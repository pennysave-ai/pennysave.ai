-- CreateTable
CREATE TABLE "PlaidCategory" (
    "id" TEXT NOT NULL,
    "primary" TEXT NOT NULL,
    "detailed" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "PlaidCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaidCategory_id_key" ON "PlaidCategory"("id");
