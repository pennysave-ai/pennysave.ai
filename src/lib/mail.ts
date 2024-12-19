import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  // TOOD: Update the link to your production URL
  // and regiser a domain inside Resend
  // to be able to send emails to anyone
  const confirmLink = `http://localhost:3000/auth/verify-email?token=${token}`;
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Confirm your email address",
    html: `<p>Please click <a href="${confirmLink}">the link</a> to confirm your email.</p>
    <div>Note: the link will be valid for 1 hour only.</div>`,
  });
};
