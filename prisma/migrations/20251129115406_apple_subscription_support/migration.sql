-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appleSubscriptionCancelAtDate" TIMESTAMP(3),
ADD COLUMN     "hasActiveAppleSubscription" BOOLEAN DEFAULT false;
