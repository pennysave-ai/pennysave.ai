import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  Transaction,
  RemovedTransaction,
  AccountsGetResponse,
} from "plaid";
import { AxiosResponse } from "axios";

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

const RETRIEVE_TRANSACTIONS_BATCH_SIZE = 100;
const plaidClient = new PlaidApi(configuration);

type GetTransactionParams = {
  accessToken: string;
  cursor?: string;
  count: number;
};

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
    webhook: `https://${PLAID_WEBHOOK_HOST}/api/webhooks/plaid?userId=${userId}`,
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

export type ExtendedAccountResponseType = AccountsGetResponse & {
  item: {
    institution_name?: string;
  };
};

/**
 * Get accounts by access token
 * @param accessToken
 * @returns {Promise<Object<ExtendedAccountResponseType>>}
 */
export const getAccounts = async (
  accessToken: string
): Promise<ExtendedAccountResponseType> => {
  const response: AxiosResponse<ExtendedAccountResponseType> =
    await plaidClient.accountsGet({
      access_token: accessToken,
    });
  return response.data;
};

/**
 * Verifty webhook signature
 * @param kid
 * @returns {Promise<Object<WebhookVerificationKeyGetResponse>>}
 */
export const verifyWebhookSignature = async (kid: string) => {
  const response = await plaidClient.webhookVerificationKeyGet({
    client_id: CLIENT_ID,
    secret: SECRET,
    key_id: kid,
  });
  return response.data;
};

/**
 * Get transactions by access token
 * @param {Object} params - The parameters to pass to the API
 * @param {String} params.accessToken - The access token
 * @param {String} params.cursor - The cursor
 * @param {String} params.count - The count
 * @returns {Promise<Object<TransactionsGetResponse>>}
 */
export const getTransactions = async (params: GetTransactionParams) => {
  const response = await plaidClient.transactionsSync({
    client_id: CLIENT_ID,
    secret: SECRET,
    access_token: params.accessToken,
    cursor: params.cursor,
    count: params.count,
  });
  return response.data;
};

type GetAllTransactionsResponse = {
  added: Transaction[];
  modified: Transaction[];
  removed: RemovedTransaction[];
  cursor: string | null;
};

/**
 * Get all transactions by access token
 * @param accessToken
 * @param cursor
 * @returns {Promise<Object<GetAllTransactionsResponse>>}
 */
export const getAllTransactions = async (
  accessToken: string,
  lastCursor: null | string = null
): Promise<GetAllTransactionsResponse> => {
  let cursor = lastCursor;
  let added: Transaction[] = [];
  let modified: Transaction[] = [];
  // Removed transaction ids
  let removed: RemovedTransaction[] = [];
  let hasMore = true;
  try {
    // Iterate through each page of new transaction updates for item
    /* eslint-disable no-await-in-loop */
    while (hasMore) {
      const request: GetTransactionParams = {
        accessToken: accessToken,
        count: RETRIEVE_TRANSACTIONS_BATCH_SIZE,
      };
      if (cursor) {
        request.cursor = cursor;
      }
      const response = await getTransactions(request);

      // Add this page of results
      added = added.concat(response.added);
      modified = modified.concat(response.modified);
      removed = removed.concat(response.removed);
      hasMore = response.has_more;

      // Update cursor to the next cursor
      cursor = response?.next_cursor;
    }
  } catch (err) {
    console.error(`Error fetching transactions: ${err}`);
    cursor = lastCursor;
  }
  return { added, modified, removed, cursor };
};
