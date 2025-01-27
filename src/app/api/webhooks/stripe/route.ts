import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { WebSocket } from "ws";
import { STRIPE_PLANS } from "@/lib/stripe";
import { db } from "@/db";
import { BroadcastType } from "@/wstypes";

const STRIPE = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const PROTOCOL = process.env.NODE_ENV === "production" ? "wss" : "ws";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  let stripeEvent: Stripe.Event;

  // Verify the stripe event
  try {
    stripeEvent = STRIPE.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
    // eslint-disable-next-line
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ data: err?.message }, { status: 400 });
  }

  const hostname = req.url?.split("/")[2].split(":")[0];
  const port = process.env.NEXT_PUBLIC_WEBSOCKET_PORT;

  console.log("Stripe event type", stripeEvent.type);
  switch (stripeEvent.type) {
    // First payment is successful and subscription is created
    case "checkout.session.completed": {
      const session = await STRIPE.checkout.sessions.retrieve(
        stripeEvent.data.object.id,
        { expand: ["line_items"] }
      );

      const priceId = session?.line_items?.data[0]?.price?.id || "";
      const pickedPlan = STRIPE_PLANS.find((plan) => plan.priceId === priceId);

      const userId = session?.metadata?.userId;
      const subscriptionId = session.subscription as string;
      const subscription = await STRIPE.subscriptions.retrieve(subscriptionId);
      const subscriptionEndDate = subscription.current_period_end;
      if (!pickedPlan) break;
      if (!userId) break;

      // Update user info
      await db.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionEndDate: new Date(subscriptionEndDate * 1000),
          stripePriceId: pickedPlan.priceId,
          hasActiveStripeSubscription: true,
        },
      });
      // TODO: Send email to user

      // Notify user of successful subscription
      const ws = new WebSocket(
        `${PROTOCOL}://${hostname}:${port}?id=STRIPE_WEBHOOK`
      );
      ws.on("open", function open() {
        ws.send(
          JSON.stringify({
            type: BroadcastType.SUBSCRIPTION_CREATED,
            recipient: userId,
          })
        );
        ws.close();
      });
      break;
    }
    // Subscription is deleted
    case "customer.subscription.deleted": {
      console.log("...deleting");
      const subscription = await STRIPE.subscriptions.retrieve(
        stripeEvent.data.object.id
      );
      console.log("@@@@subscription deleted", subscription);
      const user = await db.user.findFirst({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (!user) {
        console.log(
          "Could not find user to cancel subscription",
          subscription.customer
        );
        break;
      }
      try {
        await db.user.update({
          where: { id: user.id },
          data: {
            stripeSubscriptionEndDate: null,
            stripePriceId: null,
            stripeSubscriptionCancelAtDate: null,
            hasActiveStripeSubscription: false,
          },
        });
        console.log("Subscription canceled", user.id);
        const ws = new WebSocket(
          `${PROTOCOL}://${hostname}:${port}?id=STRIPE_WEBHOOK`
        );
        ws.on("open", function open() {
          ws.send(
            JSON.stringify({
              type: BroadcastType.SUBSCRIPTION_DELETED,
              recipient: user.id,
            })
          );
          ws.close();
        });
        break;
      } catch (e) {
        console.log("Error canceling subscription", e);
      }
    }
    // Subscription is updated
    case "customer.subscription.updated": {
      const subscription = await STRIPE.subscriptions.retrieve(
        stripeEvent.data.object.id
      );
      // Upadating subscription info if subscription is not canceled
      if (subscription.status !== "canceled") {
        const user = await db.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        });
        if (!user) {
          console.log(
            "Could not find user to update subscription",
            subscription.customer
          );
          break;
        }
        await db.user.update({
          where: { id: user.id },
          data: {
            stripeSubscriptionEndDate: new Date(
              subscription.current_period_end * 1000
            ),
            stripePriceId: subscription.items.data[0].price.id,
            stripeSubscriptionCancelAtDate: subscription?.cancel_at
              ? new Date(subscription?.cancel_at * 1000)
              : null,
          },
        });
        const ws = new WebSocket(
          `${PROTOCOL}://${hostname}:${port}?id=STRIPE_WEBHOOK`
        );
        ws.on("open", function open() {
          ws.send(
            JSON.stringify({
              type: BroadcastType.SUBSCRIPTION_UPDATED,
              recipient: user.id,
            })
          );
          ws.close();
        });
        break;
      }
    }
  }
  return NextResponse.json({ data: "success" });
}
