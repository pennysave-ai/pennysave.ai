-- CreateTable
CREATE TABLE "PlaidLinkToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "linkToken" TEXT NOT NULL,

    CONSTRAINT "PlaidLinkToken_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlaidLinkToken" ADD CONSTRAINT "PlaidLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
