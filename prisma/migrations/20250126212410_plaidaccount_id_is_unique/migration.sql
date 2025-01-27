/*
  Warnings:

  - A unique constraint covering the columns `[plaidAccountId]` on the table `UserAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_plaidAccountId_key" ON "UserAccount"("plaidAccountId");
