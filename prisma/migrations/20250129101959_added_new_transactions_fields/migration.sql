-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "plaidAdress" TEXT,
ADD COLUMN     "plaidCategoryConfidenceLeveL" TEXT,
ADD COLUMN     "plaidCategoryDetailed" TEXT,
ADD COLUMN     "plaidCategoryPrimary" TEXT,
ADD COLUMN     "plaidCity" TEXT,
ADD COLUMN     "plaidCountry" TEXT,
ADD COLUMN     "plaidLatitude" DOUBLE PRECISION,
ADD COLUMN     "plaidLongitude" DOUBLE PRECISION,
ADD COLUMN     "plaidPaymentChannel" TEXT,
ADD COLUMN     "plaidPostalCode" TEXT,
ADD COLUMN     "plaidRegion" TEXT,
ADD COLUMN     "plaidStoreNumber" TEXT;
