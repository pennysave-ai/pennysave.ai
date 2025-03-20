import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  upsertStripeAccounts,
  deleteStripeAccountsByInstitutionName,
} from "@/data/accounts";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    await upsertStripeAccounts(body);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json("Error while creating account", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  const user = session.user;
  if (!user.id || !body.institutionName) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    await deleteStripeAccountsByInstitutionName(body.institutionName, user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json("Error while deleting accounts", { status: 500 });
  }
}
