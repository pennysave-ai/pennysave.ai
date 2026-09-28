import { NextRequest, NextResponse } from "next/server";
import { getLegalDocuments } from "@/data/legal";

/**
 * The legal documents, structured and localized.
 *
 * Same source as the published /terms-of-service and /privacy-policy pages, so
 * the app and the web can never drift apart on the wording.
 *
 * The language comes from `?lang=` (the app sends its own setting, e.g. the
 * user's `preferredLanguage`) and falls back to `Accept-Language`, then to
 * English. The response always states which language it actually served and
 * whether that text has been through legal review, so a client can show the
 * "the English version governs" notice an unreviewed translation needs.
 *
 * Deliberately unauthenticated, unlike the other routes here: the same text is
 * already public on the website, and clients may need it before anyone has
 * signed in.
 */
export async function GET(req: NextRequest) {
  try {
    const requested =
      req.nextUrl.searchParams.get("lang") ??
      req.headers.get("accept-language");

    const payload = getLegalDocuments(requested);

    return NextResponse.json(
      { data: payload },
      {
        headers: {
          // The text changes rarely; let clients and the edge hold it — but
          // vary on the query, so one language's copy can't be served for
          // another.
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          Vary: "Accept-Language",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not fetch legal documents" },
      { status: 500 },
    );
  }
}
