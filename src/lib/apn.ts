import { ApnsClient, Errors, Notification, SilentNotification } from "apns2";
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
  [key: string]: unknown;
}

interface BatchNotification {
  deviceToken: string;
  message: APNMessage;
  payload: APNPayload;
  silent: boolean;
}

export class APNService {
  private static instance: APNService;
  private client: ApnsClient;

  private constructor() {
    const key = (process.env.APNS_KEY_PATH || "").replace(/\\n/g, "\n");
    this.client = new ApnsClient({
      team: process.env.APNS_TEAM_ID || "",
      keyId: process.env.APNS_KEY_ID || "",
      signingKey: key,
      defaultTopic: "ai.pennysave.app",
      host:
        process.env.NODE_ENV === "production"
          ? "api.push.apple.com"
          : "api.sandbox.push.apple.com",
    });

    // Listen for any APN errors globally
    this.client.on(Errors.error, (err) => {
      console.error(
        "❌ APNs error:",
        err.reason,
        err.statusCode,
        err.notification.deviceToken,
      );
    });

    console.log(
      "✅ APNs Provider initialized with keyId:",
      process.env.APNS_KEY_ID,
      "teamId:",
      process.env.APNS_TEAM_ID,
      "production:",
      process.env.NODE_ENV === "production",
      "key preview:",
      key.substring(0, 40),
    );
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
    _payload?: APNPayload,
  ): Promise<boolean> {
    if (!deviceToken) return false;

    try {
      // apns2 SilentNotification does not accept extra options by design
      // (Apple recommends only content-available flag for true silent notifications)
      const notification = new SilentNotification(deviceToken);
      await this.client.send(notification);
      console.log("🔕 Silent APNs sent to user");
      return true;
    } catch (err) {
      console.error("❌ Silent APNs failed for user", err);
      return false;
    }
  }

  /**
   * Send visible notification with alert
   * Can be disabled by user, no rate limits
   */
  async sendVisibleNotification(
    deviceToken: string,
    message: APNMessage,
    payload: APNPayload,
  ): Promise<boolean> {
    try {
      const notification = new Notification(deviceToken, {
        alert: {
          title: message.title,
          body: message.body,
          subtitle: message.subtitle,
        },
        badge: 0, // set badge for app icon if needed
        sound: "default",
        category: message.category || "DEFAULT",
        mutableContent: true, // Allow notification service extension to modify the notification
        data: payload,
      });

      await this.client.send(notification);
      console.log("APN send result: success");
      console.log("🔔 Visible APNs sent to user");
      return true;
    } catch (err) {
      console.error("❌ Visible APNs failed for user", err);
      console.log("APN send result: failed", JSON.stringify(err, null, 2));
      return false;
    }
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

    const sent = results.filter(Boolean).length;
    const failed = results.filter((r) => !r).length;

    console.log(`📊 Batch notifications: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }
}

export default APNService.getInstance();
