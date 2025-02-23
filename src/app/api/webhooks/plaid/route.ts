import { NextRequest, NextResponse } from "next/server";
import { ItemWithConsentFields } from "plaid";
import jwt from "jsonwebtoken";

import { db } from "@/db";
import { exchangeToken, getItem, verifyWebhookSignature } from "@/lib/plaid";
import { PlaidItem } from "@prisma/client";

import {
  processNewTransactions,
  processNewPlaidItem,
  processExistingPlaidItem,
} from "@/data/plaid";

// NOTE: We are not waiting for the promises to resolve
// in order to speed up the process and reduce the time of response from the webhook
// since the webhook has a timeout of 10 seconds only
export async function POST(req: NextRequest) {
  // Verify the webhook signature
  const plaidVerificationHeader = req.headers.get("plaid-verification");
  if (!plaidVerificationHeader) {
    return NextResponse.json("Unautorized", { status: 401 });
  }

  // Decode the JWT header
  const decodedHeader = jwt.decode(plaidVerificationHeader, {
    complete: true,
  })?.header;

  if (!decodedHeader) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  // if the algorithm is not ES256, return unauthorized
  if (decodedHeader.alg !== "ES256" || !decodedHeader.kid) {
    return NextResponse.json("Unautorized", { status: 401 });
  }

  // Verify the kid
  const { kid } = decodedHeader;
  try {
    await verifyWebhookSignature(kid);
  } catch {
    return NextResponse.json("Unautorized", { status: 401 });
  }

  // Getting the user id from the url
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  // if there is no user id in the url, return success
  if (!userId) {
    console.error(`No user ${userId} found in the url`);
    return NextResponse.json({ data: "success" });
  }

  // Check if the user has an active stripe subscription
  // if not do not process the webhook
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      hasActiveStripeSubscription: true,
    },
  });
  if (!user) {
    console.error(`User ${userId} not found`);
    return NextResponse.json({ data: "success" });
  }
  if (!user.hasActiveStripeSubscription) {
    console.error(`User ${userId} does not have an active stripe subscription`);
    return NextResponse.json({ data: "success" });
  }
  const body = await req.json();
  console.log("@body", body);

  switch (body.webhook_code) {
    // Fired when a user has successfully connected Plaid Item
    // The user went through Connect Button Flow
    case "SESSION_FINISHED": {
      if (body.status === "success") {
        try {
          // Getting the existing user items
          const plaidItems: PlaidItem[] = await db.plaidItem.findMany({
            where: {
              userId,
            },
          });

          // Get all avaialable currencies from the database
          const currencies = await db.currency.findMany({
            select: {
              id: true,
              name: true,
            },
          });
          const currenciesMap = new Map(
            currencies.map(({ name, id }) => [name, id])
          );

          // Exchanging public tokens for access tokens
          // and check if the user has already linked an item at this institution
          for (const publicToken of body.public_tokens) {
            const response = await exchangeToken(publicToken);
            // Get the item details
            const {
              item,
            }: {
              item: ItemWithConsentFields & {
                institution_name?: string | null;
              };
            } = await getItem(response.access_token);
            if (!item) {
              console.error("No item found for access token");
              continue;
            }
            // Check if the user has already linked an item at this institution
            const institutionExists = plaidItems.find(
              (plaidItem) => plaidItem.institutionId === item.institution_id
            );

            // If user went through connect button flow
            // and picked the same institution what was connected before
            if (institutionExists) {
              processExistingPlaidItem(
                institutionExists.plaidItemId,
                response.item_id,
                response.access_token,
                institutionExists.accessToken,
                institutionExists.id,
                userId,
                currenciesMap
              );
            } else {
              // Institution plaidItem does not exist in db
              processNewPlaidItem(
                response.access_token,
                userId,
                currenciesMap,
                item.institution_id as string,
                item.institution_name as string,
                response.item_id
              );
            }
          }
        } catch (error) {
          console.error("Error in SESSION_FINISHED webhook", error);
        }
      }
      break;
    }
    // Fired when new transactions data becomes available.
    case "SYNC_UPDATES_AVAILABLE": {
      const { webhook_type, item_id } = body;
      if (webhook_type === "TRANSACTIONS") {
        processNewTransactions(item_id);
      }
      break;
    }
  }
  return NextResponse.json({ data: "success" });
}
