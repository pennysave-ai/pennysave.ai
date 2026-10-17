-- When the owner stops being on one of a budget's accounts, the account leaves the budget (it would
-- otherwise count spending they can no longer see) and the budget remembers which one, so the app
-- can say so. Cleared by the owner's next save.
ALTER TABLE "Budget" ADD COLUMN "lostAccountName" TEXT,
ADD COLUMN "lostAccountAt" TIMESTAMP(3);
