"use server";

import React from "react";
import { Resend } from "resend";
import MonthlyReport from "@/templates/monthly-report";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Bulk sends monthly reports emails to the users
 * Resend API has a limit of 100 emails per batch
 * @param payload - Array of monthly report data
 */
export const sendMonthlyReports = async (
  payload: {
    user: { email: string | null };
    data: { [x: string]: string }[];
  }[],
) => {
  try {
    const { renderToString } = await import("react-dom/server");
    const emailPayload = payload.map(({ user, data }) => {
      const html = renderToString(
        React.createElement(MonthlyReport, {
          data,
        }),
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
 * Forwards a feature request from the landing page to the support inbox.
 * @param request - The idea, plus the sender's email when they left one
 */
export const sendFeatureRequestEmail = async ({
  message,
  email,
  lang,
}: {
  message: string;
  email?: string;
  lang?: string;
}) => {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: process.env.FEATURE_REQUEST_EMAIL || "support@pennysave.ai",
    replyTo: email,
    subject: `Feature request: ${message.slice(0, 60).replace(/\s+/g, " ")}`,
    html: `<p style="white-space:pre-wrap">${escape(message)}</p><hr /><p>From: ${
      email ? escape(email) : "anonymous"
    }<br />Language: ${escape(lang ?? "unknown")}</p>`,
  });
  if (error) {
    throw new Error(error.message);
  }
};
