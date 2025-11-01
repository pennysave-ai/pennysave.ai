import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { parse } from "parse-multipart-data";
import sharp from "sharp";
import { getAuthenticatedUser } from "@/auth.helper";
import { updateUserProfile } from "@/data/user";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
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

  let name = "";
  let filePart: any;

  for (const part of parts) {
    if (part.name === "name") {
      name = part.data.toString();
    }
    if (part.name === "file" && part.filename) {
      filePart = part;
    }
  }

  let imageUrl = user.image;

  if (filePart) {
    // Resize so the smaller side is 100px, maintaining aspect ratio
    let resizedBuffer: Buffer;
    try {
      resizedBuffer = await sharp(filePart.data)
        .rotate()
        .resize(100, 100, { fit: "inside" })
        .toBuffer();
    } catch (err) {
      return NextResponse.json(
        { error: "Image processing failed" },
        { status: 500 }
      );
    }
    // Upload resized image to Vercel Blob
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
    imageUrl = blob.url;
  }

  await updateUserProfile(user.id, {
    name,
    image: imageUrl ?? "",
  });

  return NextResponse.json({ success: true });
}
