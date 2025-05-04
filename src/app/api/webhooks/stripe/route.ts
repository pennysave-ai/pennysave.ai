import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { WebSocket } from "ws";
import { BroadcastType } from "@/wstypes";
import { db } from "@/db";
import { getAllCurrencies } from "@/data/currencies";
import { getUserByStripeCustomerId } from "@/data/user";
import { stripe } from "@/data/stripe";
import {
  upsertStripeAccounts,
  getStripeAccountById,
  updateLastTransactionRefreshId,
} from "@/data/accounts";
import { bulkCreateTransactions } from "@/data/transactions";
import { STRIPE_PLANS } from "@/lib/stripe";
import { convertUnixTimestampToISO } from "@/lib/utils";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const PROTOCOL = process.env.NODE_ENV === "production" ? "wss" : "ws";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  let stripeEvent: Stripe.Event;

  // Verify the stripe event
  try {
    stripeEvent = stripe.webhooks.constructEvent(
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

  switch (stripeEvent.type) {
    // First payment is successful and subscription is created
    case "checkout.session.completed": {
      const session = await stripe.checkout.sessions.retrieve(
        stripeEvent.data.object.id,
        { expand: ["line_items"] }
      );

      const priceId = session?.line_items?.data[0]?.price?.id || "";
      const pickedPlan = STRIPE_PLANS.find((plan) => plan.priceId === priceId);

      const userId = session?.metadata?.userId;
      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
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
      const subscription = await stripe.subscriptions.retrieve(
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
      const subscription = await stripe.subscriptions.retrieve(
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
    // Financial connections account is created
    case "financial_connections.account.created": {
      // Subscribe to financial connections account
      const connectedAccountId = stripeEvent.data.object.id;

      // Upsert account to make sure it exists
      const account = await stripe.financialConnections.accounts.subscribe(
        connectedAccountId,
        {
          features: ["transactions"],
        }
      );
      const [[currency, balance]] = Object.entries(
        account?.balance?.current ?? {}
      );
      const allCurrencies = await getAllCurrencies();
      const currencyId = allCurrencies?.find(
        (c) => c.name.toLowerCase() === String(currency)
      )?.id;
      const user = await getUserByStripeCustomerId(
        account?.account_holder?.customer as string
      );
      if (!user) {
        break;
      }
      const payload = [
        {
          name: account.display_name!,
          userId: user.id,
          institutionName: account.institution_name,
          stripeAccountId: account.id,
          last4: account.last4!,
          balance: Math.round(Number(balance) * 10),
          stripeAccountType: account.subcategory,
          currencyId: currencyId!,
        },
      ];
      await upsertStripeAccounts(payload);
      break;
    }
    // Financial connections account Transactions are ready to fetch
    case "financial_connections.account.refreshed_transactions": {
      const financialConnectionAccountId = stripeEvent.data.object.id;
      // Check if we already have the account
      const account = await getStripeAccountById(financialConnectionAccountId);
      if (!account) {
        break;
      }

      const transactionsPayload = {
        account: account.stripeAccountId!,
        limit: 100,
      } as {
        account: string;
        limit: number;
        transaction_refresh?: { after: string };
        transacted_at?: { gte: number };
        starting_after?: string;
      };

      if (account.stripeLastTransactionsRefreshId) {
        // means we have already fetched transactions so we need to fetch only new transactions
        transactionsPayload.transaction_refresh = {
          after: account.stripeLastTransactionsRefreshId,
        };
      } else {
        // It is the first time so we are fetching all transactions starting current month
        // Unix timestamp of the first day of the current month
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);
        transactionsPayload.transacted_at = {
          gte: Math.floor(startOfMonth.getTime() / 1000),
        };
      }

      // Get all transactions for the account
      let allTransactions: Stripe.FinancialConnections.Transaction[] = [];
      let hasMore = true;
      let lastTransactionId: string | undefined;
      let lastRefreshId = account.stripeLastTransactionsRefreshId;
      while (hasMore) {
        if (lastTransactionId) {
          transactionsPayload.starting_after = lastTransactionId;
        }
        const transactions =
          await stripe.financialConnections.transactions.list(
            transactionsPayload
          );
        // Append the fetched transactions to the list
        allTransactions = allTransactions.concat(transactions.data);

        // Check if there are more transactions to fetch
        hasMore = transactions.has_more;
        if (transactions.data.length > 0) {
          lastTransactionId =
            transactions.data[transactions.data.length - 1].id;
          lastRefreshId =
            transactions.data[transactions.data.length - 1].transaction_refresh;
        }
      }
      // TODO implement auto categorization
      const newTransactionsPayload = allTransactions.map((transaction) => ({
        amount: Math.round(Number(transaction.amount) * 10),
        notes: transaction.description,
        accountId: account.id,
        createdAt: convertUnixTimestampToISO(transaction.transacted_at),
      }));
      await bulkCreateTransactions(newTransactionsPayload);
      await updateLastTransactionRefreshId(account.id, lastRefreshId!);
    }
  }
  return NextResponse.json({ data: "success" });
}
