import { generateText } from "ai";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { qstash } from "@/qstash";
import { openai } from "@/ai";
import { db } from "@/db";
import { getPrevMonthSummaries } from "@/data/transactions";
import { bulkUpsertReports } from "@/data/reports";

const BATCH_SIZE = 50; // Batch size for processing

/**
 * Generate monthly reports for a batch of users
 * and save the results to the database
 * Called by the cron job once a month by the queue from fill-monthly-reports route
 * @param req
 * @returns {Promise<NextResponse>}
 */
async function handler(req: Request): Promise<NextResponse> {
  const { userIds, startOfPreviousMonth, endOfPreviousMonth } =
    await req.json();

  try {
    const usersData = await getPrevMonthSummaries(
      userIds,
      startOfPreviousMonth,
      endOfPreviousMonth
    );

    const results = [];
    for (let i = 0; i < usersData.length; i += BATCH_SIZE) {
      const batch = usersData.slice(i, i + BATCH_SIZE);
      // Replace UserId with the iterator index
      // and remove email from payload
      // to sanitize the data before sending it to the AI Model
      const [sanitizedUserData, indexMap] = batch.reduce<
        [
          Array<{ userId: number; [key: string]: string | number }>,
          Map<number, { userId: string; email: string }>
        ]
      >(
        (acc, user, index) => {
          const { userId, email, ...userData } = user;
          acc[0].push({ userId: index, ...userData });
          acc[1] = acc[1].set(index, { userId, email });
          return acc;
        },
        [[], new Map()]
      );
      const { text } = await generateText({
        model: openai("gpt-4-turbo"),
        system: `You are a professional financial management assistant specializing in personal finances.`,
        prompt: `Analize my transactions, budgets, spendings and earnings for the given month and tell me a story generate report on them.
          Find an insights and the most impactfull information.
          Do not include expenses breakdown in the report. Skip the greeting part.
          Be fully transparent and provide accurate information using frendly fun but not offensive engaging language.
          Give me a summary of my financial status and suggest ways to improve it.
          Do not include any recomendations on expence tracking apps or services.
          Return the result as an JSON array with objects with the following keys: "userId", "insights", "income_analysis", "expence_analysis", "health" - in terms of red yellow green", "health_analysis"
          use the following data for a report ${JSON.stringify(
            sanitizedUserData
          )}`,
      });
      if (text.includes("```json")) {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          const batchResults = JSON.parse(jsonMatch[1]);
          // Use the index map to restore the original user IDs and emails
          const reports = batchResults.map((result: { userId: number }) => {
            const sanitizedData = indexMap.get(result.userId);
            const user = usersData.find(
              (user) => user.userId === sanitizedData?.userId
            );
            if (!user) {
              throw new Error(`User with ID ${result.userId} not found`);
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { userId, transactions, ...userData } = user;
            return { ...result, ...sanitizedData, ...userData };
          });
          results.push(...reports);
        } else {
          throw new Error("Failed to extract JSON content from the response");
        }
      } else {
        throw new Error("Invalid response format");
      }
    }

    // Save or process the results as needed
    const bulkInsertReportsPayload = results.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ userId, email, ...rest }) => ({
        userId: String(userId),
        data: rest,
      })
    );
    // Bulk insert the reports into the database
    await bulkUpsertReports(bulkInsertReportsPayload);

    const ids = results.map((result) => result.userId);
    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/monthly-reports/create`,
      body: {
        ids,
      },
    });
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error processing monthly reports:", error);
    return NextResponse.json({ status: "error", message: error });
  } finally {
    await db.$disconnect();
  }
}
export const maxDuration = 60;
export const POST = verifySignatureAppRouter(handler);
