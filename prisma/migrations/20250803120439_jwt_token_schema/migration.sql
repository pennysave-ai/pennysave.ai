-- CreateTable
CREATE TABLE "MobileJWTToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    "accessTokenHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "refreshExpiresAt" TIMESTAMP(3) NOT NULL,
    "familyInvalidated" BOOLEAN NOT NULL DEFAULT false,
    "invalidatedAt" TIMESTAMP(3),
    "invalidatedReason" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileJWTToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MobileJWTToken_familyId_key" ON "MobileJWTToken"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "MobileJWTToken_accessTokenHash_key" ON "MobileJWTToken"("accessTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "MobileJWTToken_refreshTokenHash_key" ON "MobileJWTToken"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "MobileJWTToken_userId_isActive_idx" ON "MobileJWTToken"("userId", "isActive");

-- CreateIndex
CREATE INDEX "MobileJWTToken_familyId_tokenVersion_idx" ON "MobileJWTToken"("familyId", "tokenVersion");

-- CreateIndex
CREATE INDEX "MobileJWTToken_userId_familyInvalidated_idx" ON "MobileJWTToken"("userId", "familyInvalidated");

-- CreateIndex
CREATE INDEX "MobileJWTToken_expiresAt_idx" ON "MobileJWTToken"("expiresAt");

-- CreateIndex
CREATE INDEX "MobileJWTToken_refreshExpiresAt_idx" ON "MobileJWTToken"("refreshExpiresAt");

-- AddForeignKey
ALTER TABLE "MobileJWTToken" ADD CONSTRAINT "MobileJWTToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
