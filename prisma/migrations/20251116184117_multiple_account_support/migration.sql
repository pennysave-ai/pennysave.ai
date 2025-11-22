/*
  Warnings:

  - You are about to drop the column `name` on the `UserAccount` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserAccount` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserAccount" DROP CONSTRAINT "UserAccount_userId_fkey";

-- AlterTable
ALTER TABLE "UserAccount" DROP COLUMN "name",
DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "UserAccountAccess" (
    "userId" TEXT NOT NULL,
    "userAccountId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAccountAccess_pkey" PRIMARY KEY ("userId","userAccountId")
);

-- AddForeignKey
ALTER TABLE "UserAccountAccess" ADD CONSTRAINT "UserAccountAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAccountAccess" ADD CONSTRAINT "UserAccountAccess_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
