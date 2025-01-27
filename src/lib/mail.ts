"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const HOST = process.env.NEXT_PUBLIC_URL;

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${HOST}/auth/verify-email?token=${token}`;
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Confirm your email address",
    html: `<p>Please click <a href="${confirmLink}">the link</a> to confirm your email.</p>
    <div>Note: the link will be valid for 1 hour only.</div>`,
  });
};
export const sendResetPasswordEmail = async (email: string, token: string) => {
  // TOOD: regiser a domain inside Resend
  // to be able to send emails to anyone
  // and update from email to be able to recieve emails
  const confirmLink = `${HOST}/auth/new-password?token=${token}`;
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Reset your password",
    html: `<p>Please click <a href="${confirmLink}">the link</a> to reset your old password</p>
    <div>Note: the link will be valid for 1 hour only.</div>`,
  });
};
