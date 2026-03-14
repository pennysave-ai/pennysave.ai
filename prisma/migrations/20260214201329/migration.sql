/*
  Warnings:

  - You are about to alter the column `spend` on the `ReportCategoryBreakdown` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "ReportCategoryBreakdown" ALTER COLUMN "spend" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "ReportRecurringCandidate" ALTER COLUMN "amountStdDevPct" SET DATA TYPE DOUBLE PRECISION;
