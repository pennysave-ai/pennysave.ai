/*
  Warnings:

  - You are about to alter the column `incomeReceived` on the `ReportSnapshot` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `expenseSpend` on the `ReportSnapshot` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `netFlow` on the `ReportSnapshot` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "ReportSnapshot" ALTER COLUMN "incomeReceived" SET DATA TYPE INTEGER,
ALTER COLUMN "expenseSpend" SET DATA TYPE INTEGER,
ALTER COLUMN "netFlow" SET DATA TYPE INTEGER;
