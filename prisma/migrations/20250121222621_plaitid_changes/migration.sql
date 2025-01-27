/*
  Warnings:

  - You are about to drop the column `status` on the `PlaidItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlaidItem" DROP COLUMN "status",
ALTER COLUMN "transactionCursor" DROP NOT NULL;
