/*
  Warnings:

  - A unique constraint covering the columns `[plaidItemId]` on the table `PlaidItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PlaidItem_plaidItemId_key" ON "PlaidItem"("plaidItemId");
