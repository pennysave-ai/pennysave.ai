import { NextResponse } from "next/server";
import { db } from "@/db";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { bulkUpsertReports } from "@/data/reports";

export const maxDuration = 60;

async function handler(req: Request): Promise<NextResponse> {
  const { userData } = await req.json();
  try {
    if (!userData) {
      throw new Error(`No data found for user ${userData}`);
    }
    // Generate the report using the AI model
    const {
      userId,
      email, // eslint-disable-line @typescript-eslint/no-unused-vars
      ...rest
    } = userData;
    // Call model to generate the report with retries
    const result = await fetch(process.env.LLM_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-r1:70b",
        system:
          "You are a professional friendly and fun financial assistant specializing in personal finances.",
        prompt: `Analyze my transactions, budgets, spending, and earnings for the given month 
          and tell me a story about them. Find an insights and the most impactfull information. 
          Do not include expenses breakdown in the report. Skip the greeting part. Be fully transparent and provide accurate information using frendly fun and engaging language. 
          Give me a summary of my financial status and suggest ways to improve it. Do not include any recomendations on expence tracking apps or services. 
          Return the result as JSON. Use the following data for a report: ${JSON.stringify(
            rest
          )}`,
        stream: false,
        format: {
          type: "object",
          properties: {
            insights: {
              type: "string",
              description: "Summary on my finances insights",
            },
            income_analysis: {
              type: "string",
              description: "Analysis on my income",
            },
            expense_analysis: {
              type: "string",
              description: "Analysis on my expences",
            },
            health: {
              type: "string",
              enum: ["green", "yellow", "red"],
            },
            health_analysis: {
              type: "string",
              description: "Summary on my financial health",
            },
          },
          required: [
            "insights",
            "income_analysis",
            "expence_analysis",
            "health",
            "health_analysis",
          ],
        },
      }),
    });
    if (!result.ok) {
      throw new Error(`Failed to generate report for: ${userId}`);
    }
    const response = await result.json();
    if (response.error) {
      throw new Error(`Error from LLM: ${response.error}`);
    }
    if (Object.keys(response).length === 0) {
      throw new Error(`Empty response from LLM for user: ${userId}`);
    }
    const {
      insights,
      income_analysis,
      expense_analysis,
      health,
      health_analysis,
    } = response;
    const reportData = {
      income_analysis,
      expense_analysis,
      health_analysis,
      health,
      insights,
      income: rest.income,
      expenses: rest.expenses,
      netFlow: rest.netFlow,
      currencyName: rest.currencyName,
      reportDate: rest.reportDate,
    };
    // Save the report to the database
    await bulkUpsertReports([
      {
        userId,
        data: reportData,
      },
    ]);

    console.log(`Successfully processed report for user ${userId}`);
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error(
      `Error processing report for user ${userData.userId}:`,
      error
    );
    return NextResponse.json({ status: "error", message: error });
  } finally {
    await db.$disconnect();
  }
}

export const POST = verifySignatureAppRouter(handler);
