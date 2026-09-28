export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import { getUserLocale } from "@/data/user";
import {
  classifyReadError,
  readReceipt,
  type ReceiptCategory,
  type ReceiptStreamEvent,
} from "@/lib/receiptRead";

/** One JSON object per line, each flushed as it is written. */
const NDJSON = "application/x-ndjson";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }

  let body: {
    recognizedText?: unknown;
    categories?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // The photo no longer crosses the wire — the device reads it and sends the
  // text — so `recognizedText` is the only input the read has. A client that
  // read nothing omits it, and there is then nothing to answer with.
  const recognizedText =
    typeof body?.recognizedText === "string" ? body.recognizedText.trim() : "";
  if (!recognizedText) {
    return NextResponse.json(
      { error: "recognizedText required" },
      { status: 400 },
    );
  }

  const categories: ReceiptCategory[] = Array.isArray(body?.categories)
    ? body.categories
    : [];

  // Where the user is and what they read in: one names the instant a printed
  // time refers to, the other the language a suggested category is written in.
  const { timezone, preferredLanguage } = await getUserLocale(user.id);

  const events = readReceipt({
    recognizedText,
    categories,
    timeZone: timezone,
    language: preferredLanguage,
    // Nothing is persisted, so a client that hangs up mid-read wants both
    // upstream calls dropped rather than run to completion.
    signal: req.signal,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: ReceiptStreamEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      // Exactly one terminal event, `done` or `error`, never both.
      let terminated = false;
      try {
        for await (const event of events) {
          write(event);
          terminated ||= event.type !== "field";
        }
      } catch (error) {
        console.error("OCR read failed:", error);
        // Whatever already went out stays on the user's screen — those fields
        // were genuinely read. The read simply ends here.
        if (!terminated) write({ type: "error", ...classifyReadError(error) });
        terminated = true;
      } finally {
        if (!terminated) {
          write({ type: "error", code: "internal", retryable: true });
        }
        controller.close();
      }
    },
  });

  // No Content-Length, so the response is chunked and each line leaves as it
  // is written. `no-transform` and `X-Accel-Buffering` stop a proxy holding
  // the lines back until the end, which would defeat the whole change.
  return new Response(stream, {
    headers: {
      "Content-Type": NDJSON,
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
