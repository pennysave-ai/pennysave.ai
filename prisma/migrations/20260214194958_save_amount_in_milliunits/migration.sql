/*
  Warnings:

  - You are about to alter the column `incomeReceivedDelta` on the `ReportComparison` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `expenseSpendDelta` on the `ReportComparison` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `netFlowDelta` on the `ReportComparison` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `avgAmount` on the `ReportRecurringCandidate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `medianAmount` on the `ReportRecurringCandidate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `amountStdDev` on the `ReportRecurringCandidate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `amountStdDevPct` on the `ReportRecurringCandidate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "ReportComparison" ALTER COLUMN "incomeReceivedDelta" DROP DEFAULT,
ALTER COLUMN "incomeReceivedDelta" SET DATA TYPE INTEGER,
ALTER COLUMN "expenseSpendDelta" DROP DEFAULT,
ALTER COLUMN "expenseSpendDelta" SET DATA TYPE INTEGER,
ALTER COLUMN "netFlowDelta" DROP DEFAULT,
ALTER COLUMN "netFlowDelta" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "ReportRecurringCandidate" ALTER COLUMN "avgAmount" SET DATA TYPE INTEGER,
ALTER COLUMN "medianAmount" SET DATA TYPE INTEGER,
ALTER COLUMN "amountStdDev" DROP DEFAULT,
ALTER COLUMN "amountStdDev" SET DATA TYPE INTEGER,
ALTER COLUMN "amountStdDevPct" DROP DEFAULT,
ALTER COLUMN "amountStdDevPct" SET DATA TYPE INTEGER;
