-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredCurrencyId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_preferredCurrencyId_fkey" FOREIGN KEY ("preferredCurrencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
