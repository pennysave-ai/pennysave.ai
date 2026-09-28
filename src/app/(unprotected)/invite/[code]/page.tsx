import { redirect } from "next/navigation";

/**
 * Landing page for an invite link. Invites are 6-digit codes now, so this only
 * has to get the visitor to the App Store - the code is in the URL they
 * followed and they enter it in the app. Nothing is tracked here: matching an
 * install back to an invite by device fingerprint was replaced by the user
 * simply typing the code.
 */
export default async function InvitePage() {
  redirect(
    `https://apps.apple.com/app/pennysave/id${process.env.NEXT_PUBLIC_APP_STORE_ID}`
  );
}
