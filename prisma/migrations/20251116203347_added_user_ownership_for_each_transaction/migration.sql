/*
  Warnings:

  - Added the required column `createdBy` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "createdBy" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_createdBy_idx" ON "Transaction"("createdBy");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
