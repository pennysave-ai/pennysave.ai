// import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

// import { getUserAccountIdsByName, createAccount } from "@/data/accounts";
// import { getCurrencyByNameOrSymbol } from "@/data/currencies";
// import {
//   getUserCategoriesByName,
//   createCategory,
//   getUserCategories,
// } from "@/data/categories";
// import { getUserAnalytics, createTransaction } from "@/data/transactions";
// import { createTransactionSchema } from "@/schemas";
// import { convertAmountToMilliunits } from "@/lib/utils";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST() {
  // const { messages } = await req.json();
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user?.id || !user.hasActiveStripeSubscription) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    // const result = streamText({
    //   model: openai("gpt-4-turbo"),
    //   system: `You are an AI assistant specializing in personal finances.
    //   Help me to create financial goals, track expenses, and manage my budget.
    //   Only provide information related to personal finances.
    //   If a question is outside this theme, politely redirect the conversation
    //   back to personal finances or state that you can't answer.`,
    //   messages,
    //   tools: {
    //     createTransaction: tool({
    //       parameters: createTransactionSchema,
    //       description: "create a new user transaction",
    //       execute: async (params) => {
    //         const { accountId } = params;
    //         if (accountId == "1") {
    //           return {
    //             message: "Please provide a valid account name",
    //           };
    //         }
    //         try {
    //           const newTransaction = await createTransaction({
    //             ...params,
    //             amount: convertAmountToMilliunits(params.amount),
    //           });
    //           // TODO hook webhook to update endpoints data
    //           return { newTransaction };
    //         } catch (error) {
    //           console.log("error", error);
    //           return { error };
    //         }
    //       },
    //     }),
    //     createCategory: tool({
    //       parameters: z.object({
    //         name: z.string().describe("name for new category"),
    //         description: z
    //           .string()
    //           .optional()
    //           .describe("description for the new category"),
    //       }),
    //       description: "create a new user category",
    //       execute: async (params) => {
    //         try {
    //           const newCategory = await createCategory(
    //             params.name,
    //             user.id as string,
    //             params.description
    //           );
    //           // TODO hook webhook to update endpoints data
    //           return { newCategory };
    //         } catch (error) {
    //           return { error };
    //         }
    //       },
    //     }),
    //     createAccount: tool({
    //       parameters: z.object({
    //         name: z.string().describe("name for new account"),
    //         currencyId: z
    //           .string()
    //           .uuid()
    //           .describe("id of the account currency from Currency table"),
    //         institutionName: z.string().optional(),
    //       }),
    //       description: "create a new user account",
    //       execute: async (params) => {
    //         try {
    //           const newAccount = await createAccount(
    //             params.name,
    //             user.id as string,
    //             params.currencyId,
    //             params.institutionName
    //           );
    //           // TODO hook webhook to invalidate cache
    //           return { newAccount };
    //         } catch (error) {
    //           return { error };
    //         }
    //       },
    //     }),
    //     fetchUserCurrenciesByNameOrSymbol: tool({
    //       parameters: z.object({
    //         name: z.string().describe("currency name"),
    //         symbol: z.string().optional().describe("currency symbol"),
    //       }),
    //       description:
    //         "fetch the currency id, symbol, name, exchange rate by currency name or symbol (e.g. $)",
    //       execute: async (params) => {
    //         const currencies = await getCurrencyByNameOrSymbol(
    //           params.name,
    //           params?.symbol as string
    //         );
    //         return { currencies };
    //       },
    //     }),
    //     fetchUserCategoriesByName: tool({
    //       parameters: z.object({
    //         name: z.string().describe("category name"),
    //       }),
    //       description: "fetch the categories by category name",
    //       execute: async (params) => {
    //         const categories = await getUserCategoriesByName(
    //           user.id as string,
    //           params.name
    //         );
    //         return { userCategories: categories };
    //       },
    //     }),
    //     fetchUserCategories: tool({
    //       parameters: z.object({}),
    //       description: "fetch all user categories",
    //       execute: async () => {
    //         const categories = await getUserCategories(user.id as string);
    //         return { userCategories: categories };
    //       },
    //     }),
    //     fetchUserAccountsByName: tool({
    //       parameters: z.object({
    //         name: z.string().describe("account name"),
    //       }),
    //       description: "fetch the accounts by account name",
    //       execute: async (params) => {
    //         const accounts = await getUserAccountIdsByName(
    //           user.id as string,
    //           params.name
    //         );
    //         return { userAccounts: accounts };
    //       },
    //     }),
    //     fetchUserFinancialData: tool({
    //       parameters: z.object({}),
    //       description: "fetch the user's available financial data",
    //       execute: async () => {
    //         const financialData = await getUserAnalytics(user.id as string);
    //         return { financialData };
    //       },
    //     }),
    //     fetchCurrentDate: tool({
    //       parameters: z.object({}),
    //       description: "fetch the current date",
    //       execute: async () => {
    //         const currentDate = new Date().toISOString();
    //         return { currentDate };
    //       },
    //     }),
    //   },
    //   maxSteps: 10,
    // });
    // return result.toDataStreamResponse({
    //   sendUsage: false,
    //   getErrorMessage: (error) => {
    //     if (NoSuchToolError.isInstance(error)) {
    //       return "The model tried to call a unknown tool.";
    //     } else if (InvalidToolArgumentsError.isInstance(error)) {
    //       return "The model called a tool with invalid arguments.";
    //     } else if (ToolExecutionError.isInstance(error)) {
    //       return "An error occurred during tool execution.";
    //     } else {
    //       return "An unknown error occurred.";
    //     }
    //   },
    // });
  } catch {
    return new Response("", { status: 500 });
  }
}
