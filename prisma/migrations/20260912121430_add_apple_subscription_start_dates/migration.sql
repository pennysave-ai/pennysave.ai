-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appleSubscriptionOriginalPurchaseDate" TIMESTAMP(3),
ADD COLUMN     "appleSubscriptionStartedAt" TIMESTAMP(3),
ADD COLUMN     "appleTrialStartedAt" TIMESTAMP(3);
