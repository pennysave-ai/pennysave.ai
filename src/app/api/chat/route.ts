import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  try {
    const openai = createOpenAI({
      // custom settings, e.g.
      compatibility: "strict", // strict mode, enable when using the OpenAI API
    });

    const result = streamText({
      model: openai("gpt-4-turbo"),
      system: `You are an AI assistant specializing in personal finances. 
    Only provide information related to personal finances. 
    If a question is outside this theme, politely redirect the conversation 
    back to personal finances or state that you can't answer.`,
      messages,
    });

    return result.toDataStreamResponse();
  } catch {
    return new Response("", { status: 500 });
  }
}
