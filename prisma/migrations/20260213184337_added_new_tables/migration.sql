-- CreateTable
CREATE TABLE "ReportSnapshot" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "currencySymbol" TEXT NOT NULL,
    "incomeReceived" DOUBLE PRECISION NOT NULL,
    "expenseSpend" DOUBLE PRECISION NOT NULL,
    "netFlow" DOUBLE PRECISION NOT NULL,
    "expenseByPayee" JSONB,
    "largestExpenses" JSONB,
    "largestIncome" JSONB,
    "uncategorizedCount" INTEGER NOT NULL DEFAULT 0,
    "uncategorizedSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ReportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportComparison" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "prevMonthAvailable" BOOLEAN NOT NULL,
    "incomeReceivedDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incomeReceivedDeltaPct" DOUBLE PRECISION,
    "expenseSpendDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expenseSpendDeltaPct" DOUBLE PRECISION,
    "netFlowDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topCategoryChanges" JSONB,

    CONSTRAINT "ReportComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCategoryBreakdown" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "pct" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ReportCategoryBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRecurringCandidate" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "payee" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL,
    "months" INTEGER NOT NULL,
    "avgAmount" DOUBLE PRECISION NOT NULL,
    "medianAmount" DOUBLE PRECISION NOT NULL,
    "amountStdDev" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountStdDevPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "last3Amounts" JSONB,
    "nextExpectedWindow" JSONB,

    CONSTRAINT "ReportRecurringCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportSnapshot_reportId_key" ON "ReportSnapshot"("reportId");

-- CreateIndex
CREATE INDEX "ReportSnapshot_reportId_idx" ON "ReportSnapshot"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportComparison_reportId_key" ON "ReportComparison"("reportId");

-- CreateIndex
CREATE INDEX "ReportComparison_reportId_idx" ON "ReportComparison"("reportId");

-- CreateIndex
CREATE INDEX "ReportCategoryBreakdown_reportId_idx" ON "ReportCategoryBreakdown"("reportId");

-- CreateIndex
CREATE INDEX "ReportCategoryBreakdown_category_idx" ON "ReportCategoryBreakdown"("category");

-- CreateIndex
CREATE INDEX "ReportRecurringCandidate_reportId_idx" ON "ReportRecurringCandidate"("reportId");

-- CreateIndex
CREATE INDEX "ReportRecurringCandidate_payee_idx" ON "ReportRecurringCandidate"("payee");

-- AddForeignKey
ALTER TABLE "ReportSnapshot" ADD CONSTRAINT "ReportSnapshot_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportComparison" ADD CONSTRAINT "ReportComparison_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCategoryBreakdown" ADD CONSTRAINT "ReportCategoryBreakdown_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRecurringCandidate" ADD CONSTRAINT "ReportRecurringCandidate_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
