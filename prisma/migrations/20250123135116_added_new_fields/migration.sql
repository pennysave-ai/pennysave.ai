/*
  Warnings:

  - Added the required column `institutionPrimaryColor` to the `PlaidItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `institutionUrl` to the `PlaidItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlaidItem" ADD COLUMN     "institutionPrimaryColor" TEXT NOT NULL,
ADD COLUMN     "institutionUrl" TEXT NOT NULL;
