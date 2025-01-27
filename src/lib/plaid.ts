import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";

const CLIENT_ID = process.env.PLAID_CLIENT_ID;
const SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || "sandbox";
const PLAID_WEBHOOK_HOST = process.env.PLAID_WEBHOOK_HOST;

const PLAID_PRODUCTS: Products[] =
  (process.env.PLAID_PRODUCTS?.split(",") as Products[]) ||
  (["transactions"] as Products[]);

const COUNTRY_CODES: CountryCode[] = (process.env.PLAID_COUNTRY_CODES?.split(
  ","
) as CountryCode[]) || ["US" as CountryCode];

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": CLIENT_ID,
      "PLAID-SECRET": SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

/**
 * Creates a Plaid user.
 * @param userId
 * @returns {Promise<Object<PlaidUserCreateResponse>>}
 */
export const createPlaidUser = async (userId: string) => {
  const response = await plaidClient.userCreate({
    client_id: CLIENT_ID,
    secret: SECRET,
    client_user_id: userId,
  });
  return response.data;
};

/**
 * Creates a link for multi item link flow.
 * @param userId
 * @param plaidUserToken
 * @returns {String} link token
 */

export const getCreateLinkToken = async (
  userId: string,
  plaidUserToken: string
) => {
  const response = await plaidClient.linkTokenCreate({
    user: {
      client_user_id: userId,
    },
    user_token: plaidUserToken,
    client_name: "pennysave.ai",
    products: PLAID_PRODUCTS,
    country_codes: COUNTRY_CODES,
    language: "en",
    enable_multi_item_link: true,
    webhook: `https://${PLAID_WEBHOOK_HOST}/api/webhooks/plaid`,
  });
  return response.data.link_token;
};

/**
 * Creates a link token for the update mode Plaid flow.
 * @param userId
 * @param plaidUserToken
 * @param accessToken
 * @returns {String} link token
 */
export const getUpdateLinkToken = async (
  userId: string,
  plaidUserToken: string,
  accessToken: string
) => {
  const response = await plaidClient.linkTokenCreate({
    user: {
      client_user_id: userId,
    },
    user_token: plaidUserToken,
    access_token: accessToken,
    client_name: "pennysave.ai",
    products: PLAID_PRODUCTS,
    country_codes: COUNTRY_CODES,
    language: "en",
  });
  return response.data.link_token;
};

/**
 * Exchanges a public token for an access token.
 * @param publicToken
 * @returns
 */
export const exchangeToken = async (publicToken: string) => {
  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });
  return response.data;
};

/**
 * Get plaid user Items by userToken
 * @param userToken
 * @returns {Promise<Object<PlaidItemGetResponse>>}
 */
export const getItemsByUserToken = async (userToken: string) => {
  const response = await plaidClient.userItemsGet({
    client_id: CLIENT_ID,
    secret: SECRET,
    user_token: userToken,
  });
  return response.data;
};

/**
 *
 * @param accessToken Get item details by access token
 * @returns  {Promise<Object<PlaidItemGetResponse>>}
 */
export const getItem = async (accessToken: string) => {
  const response = await plaidClient.itemGet({
    access_token: accessToken,
  });
  return response.data;
};

/**
 * Deletes an item from Plaid.
 * @param accessToken
 * @returns
 */
export const deleteItem = async (accessToken: string) => {
  const response = await plaidClient.itemRemove({
    access_token: accessToken,
  });
  return response.data;
};

/**
 * Get Institution by id
 * @param institutionId
 * @returns { Promise<Object<InstitutionGetResponse>>}
 */
export const getInstitution = async (institutionId: string) => {
  const response = await plaidClient.institutionsGetById({
    institution_id: institutionId,
    client_id: CLIENT_ID,
    secret: SECRET,
    country_codes: COUNTRY_CODES,
    options: {
      include_optional_metadata: true,
    },
  });
  return response.data;
};

/**
 * Get accounts by access token
 * @param accessToken
 * @returns
 */
export const getAccounts = async (accessToken: string) => {
  const response = await plaidClient.accountsGet({
    access_token: accessToken,
  });
  return response.data;
};

export const getTransactions = async (accessToken: string) => {
  const response = await plaidClient.transactionsSync({
    access_token: accessToken,
  });
  return response.data;
};

// /**
//  * Fetches transactions from the Plaid API for a given item.
//  *
//  * @param {string} plaidItemId the Plaid ID for the item.
//  * @returns {Object{}} an object containing transactions and a cursor.
//  */
// const fetchTransactionUpdates = async (plaidItemId: string) => {
//   // the transactions endpoint is paginated, so we may need to hit it multiple times to
//   // retrieve all available transactions.

//   // get the access token based on the plaid item id
//   const { plaid_access_token: accessToken, transactions_cursor: lastCursor } =
//     await retrieveItemByPlaidItemId(plaidItemId);

//   let cursor = lastCursor;

//   // New transaction updates since "cursor"
//   let added = [];
//   let modified = [];
//   // Removed transaction ids
//   let removed = [];
//   let hasMore = true;

//   const batchSize = 100;
//   try {
//     // Iterate through each page of new transaction updates for item
//     /* eslint-disable no-await-in-loop */
//     while (hasMore) {
//       const request = {
//         access_token: accessToken,
//         cursor: cursor,
//         count: batchSize,
//       };
//       const response = await plaidClient.transactionsSync(request);
//       const data = response.data;
//       // Add this page of results
//       added = added.concat(data.added);
//       modified = modified.concat(data.modified);
//       removed = removed.concat(data.removed);
//       hasMore = data.has_more;
//       // Update cursor to the next cursor
//       cursor = data.next_cursor;
//     }
//   } catch (err) {
//     console.error(`Error fetching transactions: ${err?.message}`);
//     cursor = lastCursor;
//   }
//   return { added, modified, removed, cursor, accessToken };
// };
