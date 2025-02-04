import { z } from "zod";

import { streamText, tool } from "ai";
import { wrappedLLM } from "./llm-middleware";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  try {
    const result = streamText({
      model: wrappedLLM,
      system: `You are an AI assistant specializing in personal finances. 
    Only provide information related to personal finances. 
    If a question is outside this theme, politely redirect the conversation 
    back to personal finances or state that you can't answer.`,
      messages,
      tools: {
        addTransaction: tool({
          parameters: z.object({
            amount: z.number().describe("Amount of the transaction"),
            currency: z.string().describe("Currency of the transactions"),
            payee: z.string().describe("Payee of the transactions"),
          }),
          description: "add a new user transaction to a database",
          execute: async (params) => {
            console.log("@params", params);
            return params;
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch {
    return new Response("", { status: 500 });
  }
}
