"use server";

import { db } from "@/db";
import bcrypt from "bcryptjs";

/**
 * Get user by Stripe customer ID
 * @param stripeCustomerId - Stripe customer ID
 * @returns Promise<User>
 */
export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  return db.user.findFirst({
    where: {
      stripeCustomerId,
    },
  });
}

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

/**
 * Create a new user with password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} name - User's name
 * @returns {Promise<User>} - Returns the created user
 */
export async function createUserWithPassword({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      gdprConsent: new Date(),
    },
  });
}

/**
 * Create user with OAuth account
 * @param {Object} userData - User data
 * @param {string} userData.email - User's email
 * @param {string} userData.name - User's name
 * @param {string} userData.image - User's profile picture
 * @returns {Promise<User>} - Returns the created user
 */
export async function createUserWithOauth({
  email,
  name,
  image,
}: {
  email: string;
  name: string;
  image: string;
}) {
  return db.user.create({
    data: {
      email,
      name,
      image,
      gdprConsent: new Date(),
      emailVerified: new Date(),
    },
  });
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} data - User's profile data
 * @returns {Promise<User>} - Returns the updated user
 */
export async function updateUserProfile(
  userId: string,
  data: {
    name: string;
    image: string;
  }
) {
  return db.user.update({
    where: {
      id: userId,
    },
    data,
  });
}
