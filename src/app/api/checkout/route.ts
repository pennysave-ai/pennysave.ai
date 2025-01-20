import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { db } from "@/db";

// TODO - Add different currency support and different locale support
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.priceId) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    // Create a checkout session for subscription
    const STRIPE = new Stripe(process.env.STRIPE_SECRET_KEY || "");

    // Check if user has a stripe customer id to avoid creating a new customer on stripe
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });
    const session = await STRIPE.checkout.sessions.create({
      mode: "subscription",
      locale: "auto",
      customer: userData?.stripeCustomerId || undefined,
      payment_method_types: ["card"],
      line_items: [
        {
          price: body.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/settings`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/settings`,
    });
    return NextResponse.json(
      {
        url: session.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json("Failed to create checkout session", {
      status: 500,
    });
  }
}
