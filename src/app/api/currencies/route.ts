import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllCurrencies } from "@/data/currencies";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const currencies = await getAllCurrencies();
    return NextResponse.json({ data: currencies });
  } catch {
    return NextResponse.json(
      { error: "Could not fetch currencies" },
      { status: 500 }
    );
  }
}
