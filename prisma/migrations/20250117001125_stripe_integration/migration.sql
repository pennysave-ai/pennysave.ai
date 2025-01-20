-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasActiveStripeSubscription" BOOLEAN DEFAULT false,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubscriptionEndDate" TIMESTAMP(3);
