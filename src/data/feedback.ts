import { db } from "@/db";

/**
 * Creates a user iOS application Feedback entry in the database.
 * @param userId - The ID of the user submitting the feedback.
 * @param message - The feedback message from the user.
 * @param deviceInfo - Information about the user's device.
 * @returns {Promise<void>} - A promise that resolves when the feedback is created.
 */
export async function createFeedback({
  userId,
  message,
  deviceInfo,
}: {
  userId: string;
  message: string;
  deviceInfo?: {
    model?: string;
    osVersion?: string;
    appVersion?: string;
  };
}): Promise<void> {
  const { model, osVersion, appVersion } = deviceInfo || {};
  await db.feedback.create({
    data: {
      userId,
      message,
      deviceModel: model,
      deviceOsVersion: osVersion,
      deviceAppVersion: appVersion,
      createdAt: new Date(),
    },
  });
}
