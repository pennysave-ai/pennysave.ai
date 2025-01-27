/*
  Warnings:

  - You are about to drop the column `plaidId` on the `UserAccount` table. All the data in the column will be lost.

*/
-- DropForeignKey
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserAccount_plaidId_fkey'
  ) THEN
    ALTER TABLE "UserAccount" DROP CONSTRAINT "UserAccount_plaidId_fkey";
  END IF;
END $$;

-- AlterTable
ALTER TABLE "UserAccount" DROP COLUMN "plaidId",
ADD COLUMN     "plaidItemId" TEXT,
ADD COLUMN     "plaidMask" TEXT,
ADD COLUMN     "plaiidAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_plaidItemId_fkey" FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem"("plaidItemId") ON DELETE CASCADE ON UPDATE CASCADE;
