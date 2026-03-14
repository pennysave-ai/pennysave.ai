/*
  Warnings:

  - You are about to drop the column `uncategorizedCount` on the `ReportSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `uncategorizedSpend` on the `ReportSnapshot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ReportSnapshot" DROP COLUMN "uncategorizedCount",
DROP COLUMN "uncategorizedSpend",
ADD COLUMN     "uncategorized" JSONB;
