import { NextRequest, NextResponse } from "next/server";
import { featureRequestSchema } from "@/schemas";
import { sendFeatureRequestEmail } from "@/lib/mail";
import { consumeAttempt } from "@/lib/rateLimit";
import { getClientIpAndPrefix } from "@/lib/utils";

const MAX_REQUESTS_PER_IP = 5;
const RATE_WINDOW_SEC = 60 * 60;

/**
 * Public endpoint behind the "Request a feature" form on the landing page.
 * No account needed, so it is rate limited per IP.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = featureRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid input",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { clientIp } = getClientIpAndPrefix(req.headers);
    const byIp = await consumeAttempt(
      `feature-request:ip:${clientIp}`,
      MAX_REQUESTS_PER_IP,
      RATE_WINDOW_SEC,
    );

    if (!byIp.allowed) {
      return NextResponse.json(
        { status: "error", message: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(byIp.retryAfterSec) },
        },
      );
    }

    const { message, email, lang, trap } = validationResult.data;

    // A filled honeypot means a bot: pretend it worked and send nothing.
    // Autofill copying the visitor's own email into it is not a bot.
    if (trap && trap.trim() !== email) {
      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    await sendFeatureRequestEmail({ message, email, lang });

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("Error processing feature request:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to send feature request." },
      { status: 500 },
    );
  }
}
