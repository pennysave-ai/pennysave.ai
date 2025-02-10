import { db } from "@/db";

/**
 * Bulk upsert reports into the database
 * @param reports
 * @returns {Promise<void>}
 */
export async function bulkUpsertReports(
  reports: { userId: string; data: { [x: string]: string } }[]
) {
  try {
    // Check if the reports are already exists
    // for the current month and user
    const existingReports = await db.report.findMany({
      select: {
        userId: true,
      },
      where: {
        userId: {
          in: reports.map((report) => report.userId),
        },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
      },
    });
    const existingReportIds = existingReports.map((report) => report.userId);
    const newReports = reports
      .filter((report) => !existingReportIds.includes(report.userId))
      .map((report) => ({
        userId: report.userId,
        data: report.data,
      }));
    // Bulk insert the new reports
    if (newReports.length) {
      await db.report.createMany({
        data: newReports,
      });
    }
  } catch (e) {
    console.error("Error inserting the following reports:", e);
    throw new Error("Failed to create reports");
  } finally {
    db.$disconnect();
  }
}

/**
 * Get the created and unsended reports for the current month
 * @param {Array<string>} userIds
 * @returns {Promise}
 */
export async function getUnsendedReports(userIds: string[]): Promise<
  {
    id: string;
    userId: string;
    data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    user: { email: string | null };
  }[]
> {
  try {
    return await db.report.findMany({
      select: {
        id: true,
        userId: true,
        data: true,
        user: {
          select: {
            email: true,
          },
        },
      },
      where: {
        userId: {
          in: userIds,
        },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
        sentAt: null,
      },
    });
  } catch (e) {
    console.error("Error getting the unsended reports:", e);
    throw new Error("Failed to get unsended reports");
  } finally {
    db.$disconnect();
  }
}

/**
 * Mark reports as sent
 * @param {Array<string>} ids - reports IDs
 */
export const markReportsAsSent = async (ids: string[]) => {
  try {
    await db.report.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error marking reports as sent:", error);
    throw error;
  }
};
