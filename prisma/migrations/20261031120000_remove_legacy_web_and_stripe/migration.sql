-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_currencyId_fkey";

-- DropForeignKey
ALTER TABLE "ReceiptItem" DROP CONSTRAINT "ReceiptItem_receiptId_fkey";

-- DropForeignKey
ALTER TABLE "ReceiptItem" DROP CONSTRAINT "ReceiptItem_canonicalItemId_fkey";

-- AlterTable
ALTER TABLE "MobileJWTToken" DROP COLUMN "lastUsedAt",
DROP COLUMN "usageCount";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "hasActiveStripeSubscription",
DROP COLUMN "password",
DROP COLUMN "role",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripePriceId",
DROP COLUMN "stripeSubscriptionCancelAtDate",
DROP COLUMN "stripeSubscriptionEndDate";

-- AlterTable
ALTER TABLE "UserAccount" DROP COLUMN "balance",
DROP COLUMN "last4",
DROP COLUMN "stripeAccountId",
DROP COLUMN "stripeAccountType",
DROP COLUMN "stripeLastTransactionsRefreshId";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "VerificationToken";

-- DropTable
DROP TABLE "PasswordResetToken";

-- DropTable
DROP TABLE "Store";

-- DropTable
DROP TABLE "Receipt";

-- DropTable
DROP TABLE "ReceiptItem";

-- DropTable
DROP TABLE "CanonicalItem";

-- DropEnum
DROP TYPE "UserRole";

