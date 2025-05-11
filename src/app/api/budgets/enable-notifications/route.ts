import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { toggleBudgetNotifications } from "@/data/budgets";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  if (typeof body.enable !== "boolean") {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  // Check if user has an active subscription to enable notifications
  if (!user.hasActiveStripeSubscription && body.enable) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const updatedBudget = await toggleBudgetNotifications(
      user.id,
      body.id,
      body.enable
    );
    return NextResponse.json({ data: updatedBudget });
  } catch (e) {
    return NextResponse.json(`Error while updating budget ${e}`, {
      status: 500,
    });
  }
}
