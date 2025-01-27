import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { decrypt } from "@/utils/crypto";
import { deleteItem } from "@/lib/plaid";
import { db } from "@/db";

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.ids) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const plaidItemsAccessTokens = await db.plaidItem.findMany({
    where: { id: { in: body.ids }, userId: user.id },
    select: { accessToken: true },
  });

  // Delete items from Plaid
  await Promise.all(
    plaidItemsAccessTokens.map(async (item) => {
      await deleteItem(decrypt(item.accessToken));
    })
  );

  const plaidItems = await db.plaidItem.deleteMany({
    where: { id: { in: body.ids }, userId: user.id },
  });

  return NextResponse.json({ data: plaidItems });
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const plaidItems = await db.plaidItem.findMany({
    where: { userId: user.id },
  });
  const response = plaidItems.map((item) => ({
    id: item.id,
    name: item.institutionName,
    url: item.institutionUrl,
    color: item.institutionPrimaryColor,
  }));
  return NextResponse.json(response);
}
