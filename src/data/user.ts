"use server";

import { db } from "@/db";

/**
 * Get user data by email
 * @param email
 * @returns
 */
export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: {
      email,
    },
  });
}

/**
 * Get user data by Id
 * @param id
 * @returns
 */
export async function getUserById(id: string) {
  return db.user.findUnique({
    where: {
      id,
    },
  });
}

/**
 * Set user notification preferences
 * @param {string} userId - user ID
 * @param {boolean} monthlyReports - monthly reports
 */
export async function setNotificationPreferences({
  userId,
  monthlyReports,
}: {
  monthlyReports: boolean;
  userId: string;
}) {
  return db.user.update({
    where: {
      id: userId,
    },
    data: {
      sendMonthlyReport: monthlyReports,
    },
  });
}
