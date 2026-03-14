-- AlterTable
ALTER TABLE "ReceiptItem" ADD COLUMN     "normalizedQuantity" DOUBLE PRECISION,
ADD COLUMN     "normalizedUnit" TEXT,
ADD COLUMN     "normalizedUnitPrice" INTEGER;
