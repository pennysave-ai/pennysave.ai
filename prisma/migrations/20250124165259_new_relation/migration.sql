/*
  Warnings:

  - Made the column `plaidId` on table `UserAccount` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserAccount" ALTER COLUMN "plaidId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_plaidId_fkey" FOREIGN KEY ("plaidId") REFERENCES "PlaidItem"("plaidItemId") ON DELETE CASCADE ON UPDATE CASCADE;
