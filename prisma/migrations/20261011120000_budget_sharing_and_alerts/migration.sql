-- Budgets are seen by everyone on all of their accounts unless private, can cover every category,
-- and split their total into category limits that don't have to use all of it.
ALTER TABLE "Budget" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allCategories" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "splitByCategory" BOOLEAN NOT NULL DEFAULT false,
-- Defaults keep what an existing budget with notifications on already sends: only "over".
ADD COLUMN "alertAtPace" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "alertWhenOver" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "alertCategoryOver" BOOLEAN NOT NULL DEFAULT false;

-- The web form only stored amounts when it allocated by category.
UPDATE "Budget" b SET "splitByCategory" = true
WHERE EXISTS (SELECT 1 FROM "BudgetAllocation" a WHERE a."budgetId" = b."id" AND a."allocatedAmount" > 0);

-- Existing budgets were only ever seen by their owner; keep it that way until they say otherwise.
UPDATE "Budget" SET "isPrivate" = true;

-- Someone who sees a budget and doesn't want its alerts.
CREATE TABLE "BudgetMute" (
    "budgetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetMute_pkey" PRIMARY KEY ("budgetId","userId")
);

-- CreateIndex
CREATE INDEX "BudgetMute_userId_idx" ON "BudgetMute"("userId");

-- AddForeignKey
ALTER TABLE "BudgetMute" ADD CONSTRAINT "BudgetMute_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetMute" ADD CONSTRAINT "BudgetMute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
