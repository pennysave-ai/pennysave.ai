import { client } from "@/lib/redis";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getClientIpAndPrefix } from "@/lib/utils";

async function trackInviteVisit(token: string) {
  try {
    const headersList = await headers();
    const { clientIp, ipPrefix } = getClientIpAndPrefix(headersList);

    // Get user agent
    const userAgent = headersList.get("user-agent") || "unknown";

    const score = Date.now(); // Higher = more recent
    const visitorInfo = {
      token,
      ipPrefix,
      ipFull: clientIp,
      ua: userAgent,
      locale: headersList.get("accept-language"),
      timestamp: Date.now(),
    };
    await client.zAdd("invites:pending", {
      score,
      value: JSON.stringify(visitorInfo),
    });
    // Expire old invites
    await client.zremrangebyscore(
      "invites:pending",
      0,
      Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
    );
  } catch (error) {
    console.error("❌ Error tracking invite visit:", error);
  }
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await trackInviteVisit(token);
  redirect(
    `https://apps.apple.com/app/pennysave/id${process.env.NEXT_PUBLIC_APP_STORE_ID}`
  );
}
