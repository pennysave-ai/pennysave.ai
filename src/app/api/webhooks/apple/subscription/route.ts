import { NextResponse } from "next/server";
import { updateAppleSubscription } from "@/data/user";
import { sendWebSocketMessage } from "@/lib/websocket";
import { BroadcastType } from "@/wstypes";
// Apple notification types
enum NotificationType {
  SUBSCRIBED = "SUBSCRIBED",
  DID_RENEW = "DID_RENEW",
  DID_CHANGE_RENEWAL_STATUS = "DID_CHANGE_RENEWAL_STATUS",
  DID_FAIL_TO_RENEW = "DID_FAIL_TO_RENEW",
  EXPIRED = "EXPIRED",
  GRACE_PERIOD_EXPIRED = "GRACE_PERIOD_EXPIRED",
  REFUND = "REFUND",
  REVOKE = "REVOKE",
  DID_CHANGE_RENEWAL_PREF = "DID_CHANGE_RENEWAL_PREF",
}

// Decode JWT without verification
function decodeJWT(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }
    const payload = parts[1];
    return JSON.parse(Buffer.from(payload, "base64").toString());
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    const { signedPayload } = payload;

    if (!signedPayload) {
      console.error("❌ No signedPayload in webhook");
      return NextResponse.json(
        { error: "Missing signedPayload" },
        { status: 400 }
      );
    }

    const decodedPayload = decodeJWT(signedPayload);

    if (!decodedPayload) {
      console.error("❌ Failed to decode signedPayload");
      return NextResponse.json(
        { error: "Invalid signedPayload" },
        { status: 400 }
      );
    }

    const { notificationType, subtype, data } = decodedPayload;

    if (!data) {
      console.error("❌ No data in decoded payload");
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const transactionInfo = data.signedTransactionInfo
      ? decodeJWT(data.signedTransactionInfo)
      : null;

    const renewalInfo = data.signedRenewalInfo
      ? decodeJWT(data.signedRenewalInfo)
      : null;

    const userId = transactionInfo?.appAccountToken;
    const expiresDate = transactionInfo?.expiresDate
      ? new Date(parseInt(transactionInfo.expiresDate))
      : null;

    // CHECK IF IT'S A FREE TRIAL
    const offerType = transactionInfo?.offerType;
    const isFreeTrial = offerType === 1; // 1 = Introductory offer (free trial)

    // Get grace period expiration date
    const gracePeriodExpiresDate = renewalInfo?.gracePeriodExpiresDate
      ? new Date(parseInt(renewalInfo.gracePeriodExpiresDate))
      : null;

    const isInBillingRetry = renewalInfo?.isInBillingRetryPeriod === true;
    const country = transactionInfo?.storefront || "US";

    console.log("📝 Processing notification:", {
      notificationType,
      subtype,
      userId,
      expiresDate,
      gracePeriodExpiresDate,
      isInBillingRetry,
    });

    // Handle different notification types
    switch (notificationType) {
      case NotificationType.SUBSCRIBED:
        // New subscription started
        console.log("✅ New subscription for user:", userId);
        if (isFreeTrial) {
          console.log("🎁 User started FREE TRIAL");
          await updateAppleSubscription({
            userId,
            expiresAt: expiresDate,
            status: "trial", // Mark as trial
            country,
          });
        } else {
          console.log("💳 User subscribed (no trial)");
          await updateAppleSubscription({
            userId,
            expiresAt: expiresDate,
            status: "active",
            country,
          });
        }
        break;

      case NotificationType.DID_RENEW:
        // Subscription renewed successfully
        console.log("🔄 Subscription renewed for user:", userId);

        // Check if this is the first renewal after trial
        if (subtype === "INITIAL_BUY") {
          console.log("💰 Trial converted to paid subscription");
        }

        await updateAppleSubscription({
          userId,
          expiresAt: expiresDate,
          gracePeriodExpiresAt: null,
          status: "active", // Now a paying customer
          country,
        });
        break;

      case NotificationType.DID_FAIL_TO_RENEW:
        // Payment failed - enter grace period
        console.log("❌ Payment failed for user:", userId, {
          gracePeriodExpiresDate,
          isInBillingRetry,
        });

        if (gracePeriodExpiresDate) {
          // User enters grace period - KEEP ACCESS ACTIVE
          await updateAppleSubscription({
            userId,
            expiresAt: expiresDate,
            gracePeriodExpiresAt: gracePeriodExpiresDate,
            status: "grace_period",
            country,
          });
        } else {
          // No grace period - mark as past due but check if still in retry
          await updateAppleSubscription({
            userId,
            expiresAt: expiresDate,
            status: isInBillingRetry ? "past_due" : "canceled",
            country,
          });
        }
        break;

      case NotificationType.GRACE_PERIOD_EXPIRED:
        // Grace period ended without successful payment
        console.log("⏰ Grace period expired for user:", userId);
        await updateAppleSubscription({
          userId,
          expiresAt: expiresDate,
          gracePeriodExpiresAt: null,
          status: "grace_period_expired",
          country,
        });
        break;

      case NotificationType.EXPIRED:
        // Subscription expired
        console.log("⏰ Subscription expired for user:", userId, {
          subtype,
        });

        // Check if it's voluntary cancellation or billing issue
        const status = subtype === "VOLUNTARY" ? "canceled" : "expired";

        await updateAppleSubscription({
          userId,
          expiresAt: expiresDate,
          gracePeriodExpiresAt: null,
          status,
          country,
        });
        break;

      case NotificationType.REFUND:
      case NotificationType.REVOKE:
        // Refund or revoked - immediately revoke access
        console.log("💰 Refund/Revoke for user:", userId);
        await updateAppleSubscription({
          userId,
          expiresAt: new Date(), // Immediate expiration
          gracePeriodExpiresAt: null,
          status: "canceled",
          country,
        });
        break;

      case NotificationType.DID_CHANGE_RENEWAL_STATUS:
        // User enabled/disabled auto-renewal
        const autoRenewStatus = renewalInfo?.autoRenewStatus === 1;
        console.log("🔄 Auto-renew changed for user:", userId, {
          autoRenewStatus,
        });

        if (!autoRenewStatus) {
          // User cancelled - but keep active until expiration
          await updateAppleSubscription({
            userId,
            expiresAt: expiresDate,
            status: "active_until_expiration", // But marked as cancelled (won't renew)
            country,
          });
        } else {
          // User re-enabled auto-renewal
          await updateAppleSubscription({
            userId,
            expiresAt: expiresDate,
            status: "active",
            country,
          });
        }
        break;

      case NotificationType.DID_CHANGE_RENEWAL_PREF:
        // User changed subscription plan
        console.log("📦 Plan changed for user:", userId);
        // Plan change doesn't affect active status
        await updateAppleSubscription({
          userId,
          expiresAt: expiresDate,
          status: "active",
          country,
        });
        break;

      default:
        console.log("⚠️ Unhandled notification type:", notificationType);
    }

    // Notify user via WebSocket
    await sendWebSocketMessage(
      {
        type: BroadcastType.APPLE_SUBSCRIPTION_UPDATED,
        recipients: [userId],
      },
      userId
    );

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("❌ Error processing Apple webhook:", error);
    return NextResponse.json(
      { error: "Error processing apple subscription webhook" },
      { status: 500 }
    );
  }
}
