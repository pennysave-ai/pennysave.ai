/*
  Warnings:

  - You are about to drop the `PlaidLinkToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlaidLinkToken" DROP CONSTRAINT "PlaidLinkToken_userId_fkey";

-- DropTable
DROP TABLE "PlaidLinkToken";
