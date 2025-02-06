import { createOpenAI } from "@ai-sdk/openai";

class OpenAISingleton {
  private static instance: ReturnType<typeof createOpenAI>;
  public static getInstance(): ReturnType<typeof createOpenAI> {
    if (!OpenAISingleton.instance) {
      OpenAISingleton.instance = createOpenAI({
        compatibility: "strict", // strict mode, enable when using the OpenAI API
      });
    }
    return OpenAISingleton.instance;
  }
}

export const openai = OpenAISingleton.getInstance();
