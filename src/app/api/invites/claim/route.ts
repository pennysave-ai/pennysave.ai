import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { client } from "@/lib/redis";
import { getClientIpAndPrefix } from "@/lib/utils";

const INVITE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to normalize locale
function normalizeLocale(locale: string): string {
  if (!locale) return "";
  // Extract primary locale (e.g., "es-ES,es;q=0.9" -> "es-ES" or "es_ES" -> "es-ES")
  const primary = locale.split(",")[0].split(";")[0].trim();
  // Normalize underscores to hyphens
  return primary.replace("_", "-").toLowerCase();
}

// Helper function to get locale language code (e.g., "es-ES" -> "es")
function getLanguageCode(locale: string): string {
  const normalized = normalizeLocale(locale);
  return normalized.split("-")[0];
}

// Helper function to normalize user agent
function normalizeUA(ua: string): string {
  return ua.toLowerCase().trim();
}

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const { ipPrefix } = getClientIpAndPrefix(headersList);
    const { locale, osVersion } = await req.json();
    const scoreThreshold = Date.now() - INVITE_EXPIRY_MS;

    console.log("🔍 Looking for match:");
    console.log("  - IP Prefix:", ipPrefix);
    console.log("  - Locale:", locale, "->", normalizeLocale(locale));
    console.log("  - OS Version:", osVersion);

    const candidates = await client.zRangeWithScores(
      "invites:pending",
      "+inf",
      scoreThreshold,
      {
        BY: "SCORE",
        REV: true,
      }
    );

    console.log("📊 Found", candidates.length, "candidates");

    let bestMatch = null;
    let bestScore = 0;

    // Multi-field fuzzy scoring (0-100)
    for (const candidate of candidates) {
      const invite = JSON.parse(candidate.value);
      let matchScore = 0;

      console.log("\n--- Candidate ---");
      console.log("Invite IP:", invite.ipPrefix);
      console.log("Invite Locale:", invite.locale);
      console.log("Invite UA:", invite.ua);

      // IP prefix matching (40 points)
      if (ipPrefix && invite.ipPrefix) {
        if (invite.ipPrefix === ipPrefix) {
          matchScore += 40;
          console.log("✅ Exact IP match: +40");
        } else if (invite.ipFull?.startsWith(ipPrefix.split(".")[0])) {
          matchScore += 20;
          console.log("✅ Partial IP match: +20");
        }
      }

      // Locale matching (20 points)
      if (locale && invite.locale) {
        const deviceLocale = normalizeLocale(locale);
        const inviteLocale = normalizeLocale(invite.locale);
        const deviceLang = getLanguageCode(locale);
        const inviteLang = getLanguageCode(invite.locale);

        if (deviceLocale === inviteLocale) {
          matchScore += 20;
          console.log("✅ Exact locale match:", deviceLocale, "+20");
        } else if (deviceLang === inviteLang) {
          matchScore += 10;
          console.log("✅ Language match:", deviceLang, "+10");
        }
      }

      // User Agent / OS Version matching (25 points)
      if (osVersion && invite.ua) {
        const normalizedUA = normalizeUA(invite.ua);
        const normalizedOS = normalizeUA(osVersion);

        if (normalizedUA.includes(normalizedOS)) {
          matchScore += 25;
          console.log("✅ OS version match:", osVersion, "+25");
        } else {
          // Try to extract iOS version from UA (e.g., "iPhone OS 17_1")
          const iosMatch = normalizedUA.match(/iphone os ([\d_]+)/);
          if (iosMatch) {
            const uaVersion = iosMatch[1].replace(/_/g, ".");
            if (
              normalizedOS.includes(uaVersion) ||
              uaVersion.includes(normalizedOS.replace(/\./g, "_"))
            ) {
              matchScore += 15;
              console.log("✅ Partial OS match:", uaVersion, "+15");
            }
          }
        }
      }

      // Time proximity (15 points)
      const inviteTimestamp =
        typeof invite.timestamp === "string"
          ? new Date(invite.timestamp).getTime()
          : invite.timestamp;
      const timeDiff =
        Math.abs(Date.now() - inviteTimestamp) / (60 * 60 * 1000); // hours

      if (timeDiff < 1) {
        matchScore += 15; // <1 hour
        console.log("✅ Very recent (<1h):", timeDiff.toFixed(1), "h, +15");
      } else if (timeDiff < 6) {
        matchScore += 10; // <6 hours
        console.log("✅ Recent (<6h):", timeDiff.toFixed(1), "h, +10");
      } else if (timeDiff < 24) {
        matchScore += 5; // <24 hours
        console.log("✅ Same day (<24h):", timeDiff.toFixed(1), "h, +5");
      }

      console.log("Total score:", matchScore);

      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestMatch = { invite, candidate: candidate.value };
        console.log("🏆 New best match!");
      }
    }

    console.log("\n=== Result ===");
    console.log("Best score:", bestScore);
    console.log("Threshold: 60");

    if (bestMatch && bestScore >= 60) {
      // Lower threshold to 60
      // Remove claimed invite to prevent reuse
      await client.zRem("invites:pending", bestMatch.candidate);

      console.log("✅ Match found! Token:", bestMatch.invite.token);

      return NextResponse.json({
        success: true,
        inviteToken: bestMatch.invite.token,
        confidence: bestScore,
        debug: {
          ipMatch: ipPrefix === bestMatch.invite.ipPrefix,
          localeMatch:
            normalizeLocale(locale) ===
            normalizeLocale(bestMatch.invite.locale),
          osMatch: bestMatch.invite.ua
            ?.toLowerCase()
            .includes(osVersion?.toLowerCase()),
        },
      });
    }

    console.log("❌ No match found (score too low or no candidates)");

    return NextResponse.json({
      success: false,
      inviteToken: null,
      debug: {
        candidatesFound: candidates.length,
        bestScore,
        threshold: 60,
      },
    });
  } catch (error) {
    console.error("Error tracking invite visit:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Add a GET method to view all invite-related keys
export async function GET() {
  try {
    const exists = await client.exists("invites:pending");

    if (!exists) {
      return NextResponse.json({
        message: "No pending invites",
        exists: false,
      });
    }

    const count = await client.zCard("invites:pending");

    // Get all with scores
    const allWithScores = await client.zRangeWithScores(
      "invites:pending",
      "+inf",
      "-inf",
      {
        BY: "SCORE",
        REV: true,
      }
    );

    const parsed = allWithScores.map((m) => {
      try {
        const data = JSON.parse(m.value);
        const timestamp =
          typeof data.timestamp === "string"
            ? new Date(data.timestamp).getTime()
            : data.timestamp;

        return {
          score: m.score,
          scoreDate: new Date(m.score).toISOString(),
          ageMinutes: Math.round((Date.now() - timestamp) / 1000 / 60),
          normalizedLocale: normalizeLocale(data.locale),
          data,
        };
      } catch {
        return {
          score: m.score,
          data: m.value,
        };
      }
    });

    return NextResponse.json({
      count,
      members: parsed,
      currentTime: Date.now(),
      threshold: Date.now() - INVITE_EXPIRY_MS,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
