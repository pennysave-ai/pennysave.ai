/*
  Warnings:

  - You are about to drop the column `hasActiveAppleSubscription` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "hasActiveAppleSubscription",
ADD COLUMN     "appleSubscriptionGracePeriodExpiresAt" TIMESTAMP(3),
ADD COLUMN     "appleSubscriptionStatus" TEXT DEFAULT 'inactive';
