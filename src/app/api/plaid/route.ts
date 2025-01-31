import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { decrypt, encrypt } from "@/utils/crypto";
import { deleteItem, exchangeToken, getAccounts } from "@/lib/plaid";
import { db } from "@/db";
import { ItemPublicTokenExchangeResponse } from "plaid";

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.ids) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const plaidItemsAccessTokens = await db.plaidItem.findMany({
    where: { id: { in: body.ids }, userId: user.id },
    select: { accessToken: true },
  });

  // Delete items from Plaid
  await Promise.all(
    plaidItemsAccessTokens.map(async (item) => {
      await deleteItem(decrypt(item.accessToken));
    })
  );

  const plaidItems = await db.plaidItem.deleteMany({
    where: { id: { in: body.ids }, userId: user.id },
  });

  return NextResponse.json({ data: plaidItems });
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const plaidItems = await db.plaidItem.findMany({
    where: { userId: user.id },
  });
  const response = plaidItems.map((item) => ({
    id: item.id,
    name: item.institutionName,
    url: item.institutionUrl,
    color: item.institutionPrimaryColor,
  }));
  return NextResponse.json(response);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id || !user.hasActiveStripeSubscription) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const { publicToken } = await req.json();
  if (!publicToken) {
    return NextResponse.json("Bad Request", { status: 400 });
  }

  const exchangeTokenResponse: ItemPublicTokenExchangeResponse =
    await exchangeToken(publicToken);

  if (!exchangeTokenResponse.item_id) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  try {
    // Update the plaid item with the new access token
    await db.plaidItem.update({
      where: {
        plaidItemId: exchangeTokenResponse.item_id,
      },
      data: {
        accessToken: encrypt(exchangeTokenResponse.access_token),
      },
    });

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

    // Get the accounts from the plaid API
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

    // Get all avaialable currencies from the database
    const currencies = await db.currency.findMany({
      select: { id: true, name: true },
    });

    // Delete Accounts promise
    const deleteAccountsPromise = db.userAccount.deleteMany({
      where: {
        plaidAccountId: {
          in: accountsToDelete.filter((id): id is string => id !== null),
        },
      },
    });

    // Update Accounts Promises
    const updateAccountsPromises = accountsToUpdate.map((account) => {
      return db.userAccount.update({
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
    });

    const createAccountsPromise = db.userAccount.createMany({
      data: accountsToCreate.map((account) => {
        const currency = currencies.find(
          ({ name }) => name === account.balances.iso_currency_code
        );
        // If the currency is not found, log an error
        if (!currency) {
          console.error(
            "Currency not found",
            account.balances.iso_currency_code
          );
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
    // We don't need to update transactions as they syncing via SYNC_UPDATES_AVAILABLE webhook as well
    await db.$transaction([
      deleteAccountsPromise,
      ...updateAccountsPromises,
      createAccountsPromise,
    ]);
  } catch (error) {
    console.error("Error updating plaid item", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }

  return NextResponse.json({ success: true });
}
