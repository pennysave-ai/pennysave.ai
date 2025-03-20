import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById } from "@/data/user";
import { createFinancialConnectionSession } from "@/data/stripe";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id || !user.hasActiveStripeSubscription) {
    return NextResponse.json("Unautorized", { status: 401 });
  }

  // Check if user has stripe customer id
  // which is not possible theoretically but just in case
  const userRecord = await getUserById(user.id);
  if (!userRecord?.stripeCustomerId) {
    throw new Error("User does not have a stripe customer id");
  }
  const stripeSession = await createFinancialConnectionSession(
    userRecord.stripeCustomerId
  );
  return NextResponse.json({ sessionToken: stripeSession.client_secret });
}
