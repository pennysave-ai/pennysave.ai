import apn from "apn";
import { getDeviceTokenByUserId } from "@/data/user";

interface APNMessage {
  title: string;
  body: string;
  subtitle?: string;
  category?: string; // Determine action buttons in notification
}

export enum APNNotificationType {
  SUBSCRIPTION_ENDED = "SUBSCRIPTION_ENDED",
  MONTHLY_REPORT_READY = "MONTHLY_REPORT_READY",
}

interface APNPayload {
  type: APNNotificationType;
}

interface BatchNotification {
  deviceToken: string;
  message: APNMessage;
  payload: APNPayload;
  silent: boolean;
}

export class APNService {
  private static instance: APNService;
  private provider: apn.Provider;

  private constructor() {
    // Initialize APNs provider
    this.provider = new apn.Provider({
      token: {
        key: process.env.APNS_KEY_PATH || "", // Path to .p8 file
        keyId: process.env.APNS_KEY_ID || "",
        teamId: process.env.APNS_TEAM_ID || "",
      },
      production: process.env.APNS_PRODUCTION === "true",
    });

    console.log("✅ APNs Provider initialized");
  }

  public static getInstance(): APNService {
    if (!APNService.instance) {
      APNService.instance = new APNService();
    }
    return APNService.instance;
  }

  /**
   * Send silent background notification
   * Cannot be disabled by user, but rate limited (~2-3 per hour)
   */
  async sendSilentNotification(
    deviceToken: string,
    payload?: APNPayload,
  ): Promise<apn.Responses | null> {
    if (!deviceToken) return null;

    const notification = new apn.Notification({
      // contentAvailable: true,
      topic: "ai.pennysave.app",
      priority: 5,
      pushType: "background",
      payload: payload,
    });

    const result = await this.provider.send(notification, deviceToken);

    if (result.sent.length > 0) {
      console.log("🔕 Silent APNs sent to user");
      return result;
    }
    if (result.failed.length > 0) {
      console.error(
        `❌ Silent APNs failed for user`,
        result.failed[0].response,
      );
      return null;
    }

    return result;
  }

  /**
   * Send visible notification with alert
   * Can be disabled by user, no rate limits
   */
  async sendVisibleNotification(
    deviceToken: string,
    message: APNMessage,
    payload: APNPayload,
  ) {
    const notification = new apn.Notification({
      alert: {
        ...message,
      },
      badge: 0, // set badge for app icon if needed
      sound: "default",
      topic: "ai.pennysave.app",
      category: message.category || "DEFAULT",
      contentAvailable: false, // Also trigger background refresh
      payload: payload,
      mutableContent: 1, // Allow notification service extension to modify the notification (e.g. localize strings, add images)
      pushType: "alert", // ← ADD THIS (required for service extension)
      priority: 10,
    });

    const result = await this.provider.send(notification, deviceToken);
    console.log("APN send result:", result);
    if (result.sent.length > 0) {
      console.log("🔔 Visible APNs sent to user");
    }
    if (result.failed.length > 0) {
      console.error(
        "❌ Visible APNs failed for user",
        result.failed[0].response,
      );
    }

    return result;
  }

  /**
   * Get device token for user
   */
  async getDeviceToken(userId: string): Promise<string | null> {
    const deviceToken = await getDeviceTokenByUserId(userId);
    if (!deviceToken) {
      console.log(`⚠️ No device token for user ${userId}`);
      return null;
    }
    return deviceToken;
  }

  /**
   * Batch send notifications
   */
  async sendBatchNotifications(notifications: BatchNotification[]) {
    const results = await Promise.all(
      notifications.map(({ deviceToken, message, payload, silent }) =>
        silent
          ? this.sendSilentNotification(deviceToken, payload)
          : this.sendVisibleNotification(deviceToken, message, payload),
      ),
    );

    const sent = results.filter((r) => (r?.sent?.length ?? 0) > 0).length;
    const failed = results.filter((r) => (r?.failed?.length ?? 0) > 0).length;

    console.log(`📊 Batch notifications: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  shutdown(): void {
    this.provider.shutdown();
  }
}

export default APNService.getInstance();
