"use server";

import React from "react";
import { Resend } from "resend";
import MonthlyReport from "@/templates/monthly-report";
import VerifyEmail from "@/templates/verify-email";
import ResetPassword from "@/templates/reset-password";
import BudgetExceedNotifcation from "@/templates/budget-exceed-notification";

const resend = new Resend(process.env.RESEND_API_KEY);
const HOST = process.env.NEXT_PUBLIC_URL;

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${HOST}/auth/verify-email?token=${token}`;
  const { renderToString } = await import("react-dom/server");
  const html = renderToString(
    React.createElement(VerifyEmail, { confirmLink })
  );
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: email,
    subject: "Confirm your email address",
    html,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const { renderToString } = await import("react-dom/server");
  const confirmLink = `${HOST}/auth/new-password?token=${token}`;
  const html = renderToString(
    React.createElement(ResetPassword, { confirmLink })
  );
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: email,
    subject: "Reset your password",
    html,
  });
};

/**
 * Bulk sends monthly reports to the users
 * Resend API has a limit of 100 emails per batch
 * @param payload - Array of monthly report data
 */
export const sendMonthlyReports = async (
  payload: { user: { email: string | null }; data: { [x: string]: string }[] }[]
) => {
  try {
    const { renderToString } = await import("react-dom/server");
    const emailPayload = payload.map(({ user, data }) => {
      const html = renderToString(
        React.createElement(MonthlyReport, {
          data,
        })
      );
      return {
        from: process.env.RESEND_FROM_EMAIL as string,
        to: user.email as string,
        subject: "Your monthly report",
        html,
      };
    });
    await resend.batch.send(emailPayload);
  } catch (error) {
    console.error("Error sending monthly reports:", error);
    throw error;
  }
};

/**
 * Sends a budget exceed notification email to the user
 * @param email - User's email address
 * @param budget - Budget data
 * @param userName - User's name
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error sending the email
 */
export const sendBudgetExceedNotification = async (
  email: string,
  budget: {
    frequency: string;
    name: string;
    totalAmount: number;
    amountSpent: number;
    currency: string;
  },
  userName: string
) => {
  try {
    const { renderToString } = await import("react-dom/server");
    const html = renderToString(
      React.createElement(BudgetExceedNotifcation, {
        budget,
        userName,
      })
    );
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: email,
      subject: "Budget Exceeded Notification",
      html,
    });
  } catch (error) {
    console.error("Error sending budget exceed notification:", error);
    throw error;
  }
};
