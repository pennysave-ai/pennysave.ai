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
    // Split the currencies into pupular EUR/USD and All Others
    const popularCurrencies = currencies.filter(
      (currency) => currency?.code === "EUR" || currency?.code === "USD",
    );
    return NextResponse.json({
      data: { popular: popularCurrencies, allCurrencies: currencies },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not fetch currencies" },
      { status: 500 },
    );
  }
}
