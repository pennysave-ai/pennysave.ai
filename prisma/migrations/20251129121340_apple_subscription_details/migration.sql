/*
  Warnings:

  - You are about to drop the column `appleSubscriptionCancelAtDate` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "appleSubscriptionCancelAtDate",
ADD COLUMN     "appleSubscriptionCountry" TEXT,
ADD COLUMN     "appleSubscriptionExpiresAt" TIMESTAMP(3);
