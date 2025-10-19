import { NextRequest, NextResponse } from "next/server";
import { getAllCurrencies } from "@/data/currencies";
import { getAuthenticatedUser } from "@/auth.helper";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
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
