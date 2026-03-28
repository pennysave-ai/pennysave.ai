import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { parse } from "parse-multipart-data";
import sharp from "sharp";
import { getAuthenticatedUser } from "@/auth.helper";
import { updateUserProfile, deleteProfile } from "@/data/user";

function isValidIanaTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request);
  if (!user || !user.id) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
  if (!boundaryMatch) {
    return NextResponse.json({ error: "No boundary found" }, { status: 400 });
  }
  const boundary = boundaryMatch[1];

  const arrayBuffer = await request.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const parts = parse(buffer, boundary);

  let name: string | undefined;
  let timezone: string | undefined;
  let preferredLanguage: string | undefined;
  let baseCurrency: string | undefined;
  let sendMonthlyReport: boolean | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let filePart: any;

  for (const part of parts) {
    if (part.name === "name") {
      name = part.data.toString().trim();
    }
    if (part.name === "timezone") {
      timezone = part.data.toString().trim();
    }
    if (part.name === "monthlyReportsEnabled") {
      sendMonthlyReport = part.data.toString().trim() === "true";
    }
    if (part.name === "file" && part.filename) {
      filePart = part;
    }
    if (part.name === "preferredLanguage") {
      preferredLanguage = part.data.toString().trim();
    }
    if (part.name === "baseCurrency") {
      baseCurrency = part.data.toString().trim();
    }
  }

  if (timezone && !isValidIanaTimeZone(timezone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  let uploadedImageUrl: string | undefined;

  if (filePart) {
    let resizedBuffer: Buffer;
    try {
      resizedBuffer = await sharp(filePart.data)
        .rotate()
        .resize(100, 100, { fit: "inside" })
        .toBuffer();
    } catch {
      return NextResponse.json(
        { error: "Image processing failed" },
        { status: 500 },
      );
    }

    const uniqueFilename = `${user.id}-${Date.now()}.jpg`;
    const blob = await put(uniqueFilename, resizedBuffer, {
      access: "public",
      allowOverwrite: true,
    });

    // Delete old image if it exists
    if (user.image) {
      try {
        const url = new URL(user.image);
        const pathname = url.pathname.startsWith("/")
          ? url.pathname.slice(1)
          : url.pathname;
        await del(pathname);
      } catch (err) {
        console.error("Failed to delete old profile image:", err);
      }
    }

    uploadedImageUrl = blob.url;
  }

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name; // allow "" only if explicitly sent
  if (timezone !== undefined) update.timezone = timezone;
  if (preferredLanguage !== undefined)
    update.preferredLanguage = preferredLanguage;
  if (baseCurrency !== undefined) update.preferredCurrencyId = baseCurrency;
  if (sendMonthlyReport !== undefined)
    update.sendMonthlyReport = sendMonthlyReport;
  if (uploadedImageUrl !== undefined) update.image = uploadedImageUrl;

  // If nothing provided, no-op
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true });
  }

  await updateUserProfile(user.id, update);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request);
  if (!user || !user.id) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  await deleteProfile(user.id);

  return NextResponse.json({ success: true });
}
