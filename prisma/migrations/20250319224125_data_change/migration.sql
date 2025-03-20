/*
  Warnings:

  - Made the column `stripeAccountId` on table `UserAccount` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserAccount" ALTER COLUMN "stripeAccountId" SET NOT NULL;
