/*
  Warnings:

  - You are about to drop the column `plaidItemId` on the `PlaidItem` table. All the data in the column will be lost.
  - The primary key for the `PlaidLinkToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PlaidLinkToken` table. All the data in the column will be lost.
  - Added the required column `institutionId` to the `PlaidItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `institutionName` to the `PlaidItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PlaidLinkToken_userId_key";

-- AlterTable
ALTER TABLE "PlaidItem" DROP COLUMN "plaidItemId",
ADD COLUMN     "institutionId" TEXT NOT NULL,
ADD COLUMN     "institutionName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlaidLinkToken" DROP CONSTRAINT "PlaidLinkToken_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "PlaidLinkToken_pkey" PRIMARY KEY ("userId");
