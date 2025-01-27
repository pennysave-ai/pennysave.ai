import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { encrypt } from "@/utils/crypto";
import { exchangeToken, getAccounts } from "@/lib/plaid";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const { publicToken } = await req.json();
  if (!publicToken) {
    return NextResponse.json("Bad Request", { status: 400 });
  }

  const exchangeTokenResponse: {
    access_token: string;
    item_id: string;
    request_id: string;
  } = await exchangeToken(publicToken);
  console.log("@exchangeTokenResponse", exchangeTokenResponse);
  // Update the plaid item with the new access token
  await db.plaidItem.update({
    where: {
      plaidItemId: exchangeTokenResponse.item_id,
    },
    data: {
      accessToken: encrypt(exchangeTokenResponse.access_token),
    },
  });

  // @exchangeTokenResponse {
  //   access_token: 'access-sandbox-1d2376f7-392c-4471-b421-0e009925d50d',
  //   item_id: 'l443zLBWPMUD7Z51bJbdugAb7jyQ9XIZZLv6M',
  //   request_id: 'CVyjmX8Dj0x5RGt'
  // }

  // Getting the current user accounts ids under the plaid item
  const existingUserAccounts = await db.userAccount.findMany({
    where: {
      userId: user.id,
      plaidItemId: exchangeTokenResponse.item_id,
    },
    select: {
      plaidAccountId: true,
    },
  });

  const existingUserAccountsIds = existingUserAccounts.map(
    ({ plaidAccountId }) => plaidAccountId
  );

  const { accounts } = await getAccounts(exchangeTokenResponse.access_token);

  // Compare the existing accounts with the new accounts
  // if there are new accounts, create them
  // if there are removed accounts, delete them
  // if there are updated accounts, update them

  const accountsToCreate = accounts.filter(({ account_id }) => {
    return !existingUserAccountsIds.includes(account_id);
  });

  const accountsToDelete = existingUserAccountsIds.filter((id) => {
    return !accounts.some(({ account_id }) => account_id === id);
  });

  const accountsToUpdate = accounts.filter(({ account_id }) => {
    return existingUserAccountsIds.includes(account_id);
  });

  // Deleting the removed accounts
  await db.userAccount.deleteMany({
    where: {
      plaidAccountId: {
        in: accountsToDelete.filter((id): id is string => id !== null),
      },
    },
  });

  // Get all avaialable currencies from the database
  const currencies = await db.currency.findMany({
    select: { id: true, name: true },
  });
  // Updating the existing accounts
  for (const account of accountsToUpdate) {
    await db.userAccount.update({
      where: {
        plaidAccountId: account.account_id,
      },
      data: {
        plaidItemId: exchangeTokenResponse.item_id,
        plaidMask: account.mask,
        plaidAccountId: account.account_id,
        plaidBalance: account.balances.current,
        plaidType: account.type,
      },
    });
  }

  // Creating the new accounts
  await db.userAccount.createMany({
    data: accountsToCreate.map((account) => {
      const currency = currencies.find(
        ({ name }) => name === account.balances.iso_currency_code
      );
      // If the currency is not found, log an error
      if (!currency) {
        console.error("Currency not found", account.balances.iso_currency_code);
      }
      return {
        name: account.name,
        currencyId: currency?.id || "",
        plaidItemId: exchangeTokenResponse.item_id,
        plaidMask: account.mask,
        plaidAccountId: account.account_id,
        plaidBalance: account.balances.current,
        plaidType: account.type,
        userId: user.id!,
      };
    }),
  });

  return NextResponse.json({ success: true });
}
