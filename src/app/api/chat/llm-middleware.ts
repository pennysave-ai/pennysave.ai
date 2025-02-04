import {
  type LanguageModelV1Prompt,
  wrapLanguageModel,
  type LanguageModelV1Middleware,
} from "ai";
import { auth } from "@/auth";
import { db } from "@/db";
import { createOpenAI } from "@ai-sdk/openai";
import { convertAmountFromMilliunits } from "@/lib/utils";

/**
 * Function to add the instruction to the last user message in the prompt
 * @param {Object} params - Parameters
 */
function addToLastUserMessage({
  params,
  text,
}: {
  params: {
    prompt: LanguageModelV1Prompt;
  };
  text: string;
}) {
  // Add the instruction to the last user message in the prompt
  const messages = params.prompt || [];

  const updatedMessages = messages.map((msg: any) => { // eslint-disable-line
    if (msg.role === "user" && msg === messages[messages.length - 1]) {
      return {
        ...msg,
        content: [
          {
            ...msg.content[0],
            text: `${msg.content[0]?.text}\n${text}`,
          },
        ],
      };
    }
    return msg;
  });
  return {
    ...params.prompt,
    messages: updatedMessages,
  };
}

const openai = createOpenAI({
  compatibility: "strict", // strict mode, enable when using the OpenAI API
});

export const ragMiddleWare: LanguageModelV1Middleware = {
  transformParams: async ({ params }) => {
    const session = await auth();
    if (!session) {
      return params;
    }
    const user = session.user;
    // TODO: cache this results because we are fetching the same data with each call to a model
    const transactions = await db.transaction.findMany({
      select: {
        amount: true,
        payee: true,
        notes: true,
        createdAt: true,
        account: {
          select: {
            name: true,
            institutionName: true,
            currency: { select: { name: true } },
            plaidBalance: true,
          },
        },
        category: {
          select: { name: true },
        },
      },
      where: {
        account: {
          userId: user.id,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const convertedTransactions = transactions.map((transaction) => ({
      ...transaction,
      amount: convertAmountFromMilliunits(transaction.amount),
      createdAt: transaction.createdAt,
      account: {
        name: transaction.account.name,
        balance: transaction.account.plaidBalance || "unknown",
        currency: {
          name: transaction.account.currency.name,
        },
      },
      bank: {
        name: transaction.account.institutionName,
      },
    }));

    const instruction =
      "Use the following information about my transactions and accounts to answer the question:\n" +
      convertedTransactions.map((chunk) => JSON.stringify(chunk)).join("\n");

    const updatedPrompt = addToLastUserMessage({ params, text: instruction });
    return {
      ...params,
      prompt: updatedPrompt.messages,
    };
  },
};

export const wrappedLLM = wrapLanguageModel({
  model: openai("gpt-4-turbo"),
  middleware: ragMiddleWare,
});
