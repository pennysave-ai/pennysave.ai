-- Categories are archived, not deleted, so a partner's sorting survives.
ALTER TABLE "Category" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- A viewer's own pick for a row someone else added.
CREATE TABLE "TransactionPlacement" (
    "viewerId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionPlacement_pkey" PRIMARY KEY ("viewerId","transactionId")
);

-- CreateIndex
CREATE INDEX "TransactionPlacement_transactionId_idx" ON "TransactionPlacement"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionPlacement_categoryId_idx" ON "TransactionPlacement"("categoryId");

-- AddForeignKey
ALTER TABLE "TransactionPlacement" ADD CONSTRAINT "TransactionPlacement_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionPlacement" ADD CONSTRAINT "TransactionPlacement_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionPlacement" ADD CONSTRAINT "TransactionPlacement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
