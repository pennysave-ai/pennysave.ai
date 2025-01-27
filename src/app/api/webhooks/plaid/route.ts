import { NextRequest, NextResponse } from "next/server";
import { ItemWithConsentFields } from "plaid";

import { db } from "@/db";
import { encrypt, decrypt } from "@/utils/crypto";
import {
  exchangeToken,
  getInstitution,
  getItem,
  deleteItem,
  getAccounts,
} from "@/lib/plaid";
import { WebSocket } from "ws";
import { PlaidItem } from "@prisma/client";
import { BroadcastType } from "@/wstypes";

export async function POST(req: NextRequest) {
  const PROTOCOL = process.env.NODE_ENV === "production" ? "wss" : "ws";
  const body = await req.json();
  console.log("@body", body);
  switch (body.webhook_code) {
    case "SESSION_FINISHED": {
      if (body.status === "success") {
        try {
          // Get User by link_token
          // When we have created a link token, we store it in the database with the user id
          // because we need to know which user the link token belongs to
          // as onSuccess callback do not provide needed information in case of
          // enable_multi_item_link = true
          const linkToken = body.link_token;
          const user = await db.plaidLinkToken.findFirst({
            where: {
              linkToken,
            },
            select: {
              userId: true,
            },
          });
          if (!user) {
            console.error("No user found for link token");
            return NextResponse.json({ data: "success" });
          }

          // Getting the existing user items
          const userItems: PlaidItem[] = await db.plaidItem.findMany({
            where: {
              userId: user.userId,
            },
          });

          // Get all avaialable currencies from the database
          const currencies = await db.currency.findMany({
            select: {
              id: true,
              name: true,
            },
          });

          // Exchanging public tokens for access tokens
          // and check if the user has already linked an item at this institution
          for (const publicToken of body.public_tokens) {
            const response = await exchangeToken(publicToken);
            // Get the item details
            const {
              item,
            }: {
              item: ItemWithConsentFields & {
                institution_name?: string;
              };
            } = await getItem(response.access_token);
            if (!item) {
              console.error("No item found for access token");
              continue;
            }
            // Check if the user has already linked an item at this institution
            const institutionExists = userItems.find(
              (userItem) => userItem.institutionId === item.institution_id
            );

            // If the user has already linked an item at this institution
            if (institutionExists) {
              // Deleting the old accounts
              await db.userAccount.deleteMany({
                where: {
                  plaidItemId: institutionExists.plaidItemId,
                },
              });

              // Update the Item with the new access token
              await db.plaidItem.update({
                where: {
                  id: institutionExists.id,
                  userId: user.userId,
                },
                data: {
                  accessToken: encrypt(response.access_token),
                  transactionCursor: null,
                  plaidItemId: response.item_id,
                },
              });
              // Removing the old item from the Plaid API
              await deleteItem(decrypt(institutionExists.accessToken));

              // Updating the accounts
              const accountsData = await getAccounts(response.access_token);

              // Saving the new accounts
              await db.userAccount.createMany({
                data: accountsData?.accounts.map((account) => ({
                  plaidAccountId: account.account_id,
                  userId: user.userId,
                  name: account.name,
                  plaidItemId: accountsData.item.item_id,
                  plaidMask: account.mask,
                  plaidBalance: account.balances.current,
                  plaidType: account.type,
                  currencyId:
                    currencies?.find(
                      (currency) =>
                        currency.name === account.balances?.iso_currency_code
                    )?.id || "",
                })),
              });
            } else {
              // Get institution details
              const institution = await getInstitution(
                item?.institution_id as string
              );
              // Saving the new item to the database
              await db.plaidItem.create({
                data: {
                  plaidItemId: response.item_id,
                  userId: user.userId,
                  accessToken: encrypt(response.access_token),
                  institutionId: item.institution_id as string,
                  institutionName: item?.institution_name as string,
                  institutionUrl: institution.institution.url,
                  institutionPrimaryColor:
                    institution.institution.primary_color,
                },
              });
              // Get Accounts details
              const accountsData = await getAccounts(response.access_token);

              // Saving plaid accounts to the database
              await db.userAccount.createMany({
                data: accountsData?.accounts.map((account) => ({
                  plaidAccountId: account.account_id,
                  userId: user.userId,
                  name: account.name,
                  plaidItemId: accountsData.item.item_id,
                  plaidMask: account.mask,
                  plaidBalance: account.balances.current,
                  plaidType: account.type,
                  currencyId:
                    currencies?.find(
                      (currency) =>
                        currency.name === account.balances?.iso_currency_code
                    )?.id || "",
                })),
              });
            }
            // Update invalidate current user state using websocket
            const hostname = req.url?.split("/")[2].split(":")[0];
            const port = process.env.NEXT_PUBLIC_WEBSOCKET_PORT;

            const ws = new WebSocket(
              `${PROTOCOL}://${hostname}:${port}?id=PLAID_WEBHOOK`
            );
            ws.on("open", function open() {
              ws.send(
                JSON.stringify({
                  type: BroadcastType.BANK_DATA_UPDATED,
                  recipient: user.userId,
                })
              );
              ws.close();
            });
          }
        } catch (error) {
          console.error("Error in SESSION_FINISHED webhook", error);
        }
      }
      break;
    }
    case "NEW_ACCOUNTS_AVAILABLE": {
    }
    case "SYNC_UPDATES_AVAILABLE": {
      console.log("Sync updates available");
      break;
    }
    case "INITIAL_UPDATE":
      console.log("Initial update");
      break;
    case "HISTORICAL_UPDATE":
      console.log("Historical update");
      break;
    case "DEFAULT_UPDATE":
      console.log("Default update");
      break;
    default:
      console.log("Unknown webhook code");
  }
  return NextResponse.json({ data: "success" });
}
