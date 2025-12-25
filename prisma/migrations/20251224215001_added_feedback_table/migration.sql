-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "deviceModel" VARCHAR(50),
    "deviceOsVersion" VARCHAR(10),
    "deviceAppVersion" VARCHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedbacks_userId_idx" ON "feedbacks"("userId");

-- CreateIndex
CREATE INDEX "feedbacks_createdAt_idx" ON "feedbacks"("createdAt");

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
