/*
  Warnings:

  - Added the required column `periodStart` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "health" TEXT,
ADD COLUMN     "periodStart" TIMESTAMP(3) NOT NULL;
