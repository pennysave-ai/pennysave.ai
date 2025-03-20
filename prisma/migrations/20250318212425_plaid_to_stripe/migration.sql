/*
  Warnings:

  - You are about to drop the column `plaidAccountId` on the `UserAccount` table. All the data in the column will be lost.
  - You are about to drop the column `plaidBalance` on the `UserAccount` table. All the data in the column will be lost.
  - You are about to drop the column `plaidItemId` on the `UserAccount` table. All the data in the column will be lost.
  - You are about to drop the column `plaidMask` on the `UserAccount` table. All the data in the column will be lost.
  - You are about to drop the column `plaidType` on the `UserAccount` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeAccountId]` on the table `UserAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "UserAccount" DROP CONSTRAINT "UserAccount_plaidItemId_fkey";

-- DropIndex
DROP INDEX "UserAccount_plaidAccountId_key";

-- AlterTable
ALTER TABLE "UserAccount" DROP COLUMN "plaidAccountId",
DROP COLUMN "plaidBalance",
DROP COLUMN "plaidItemId",
DROP COLUMN "plaidMask",
DROP COLUMN "plaidType",
ADD COLUMN     "balance" DOUBLE PRECISION,
ADD COLUMN     "last4" TEXT,
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeAccountType" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_stripeAccountId_key" ON "UserAccount"("stripeAccountId");
