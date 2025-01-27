/*
  Warnings:

  - You are about to drop the column `plaiidAccountId` on the `UserAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserAccount" DROP COLUMN "plaiidAccountId",
ADD COLUMN     "plaidAccountId" TEXT;
