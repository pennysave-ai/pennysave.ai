/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `PlaidLinkToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PlaidLinkToken_userId_key" ON "PlaidLinkToken"("userId");
