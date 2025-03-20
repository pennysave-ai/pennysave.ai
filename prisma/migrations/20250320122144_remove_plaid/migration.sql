/*
  Warnings:

  - You are about to drop the column `plaidId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `plaidPrimary` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidAdress` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidCategoryConfidenceLeveL` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidCategoryDetailed` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidCategoryPrimary` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidCity` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidCountry` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidLatitude` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidLongitude` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidPaymentChannel` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidPostalCode` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidRegion` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidStoreNumber` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `plaidUserId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `plaidUserToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `PlaidCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlaidItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlaidItem" DROP CONSTRAINT "PlaidItem_userId_fkey";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "plaidId",
DROP COLUMN "plaidPrimary";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "logo",
DROP COLUMN "plaidAdress",
DROP COLUMN "plaidCategoryConfidenceLeveL",
DROP COLUMN "plaidCategoryDetailed",
DROP COLUMN "plaidCategoryPrimary",
DROP COLUMN "plaidCity",
DROP COLUMN "plaidCountry",
DROP COLUMN "plaidLatitude",
DROP COLUMN "plaidLongitude",
DROP COLUMN "plaidPaymentChannel",
DROP COLUMN "plaidPostalCode",
DROP COLUMN "plaidRegion",
DROP COLUMN "plaidStoreNumber";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "plaidUserId",
DROP COLUMN "plaidUserToken";

-- DropTable
DROP TABLE "PlaidCategory";

-- DropTable
DROP TABLE "PlaidItem";
