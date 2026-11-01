-- The app build each user was last seen on, recorded by the API from `X-App-Version` and
-- `X-Sync-Protocol`: what tells you who a raised `Sync:MinimumProtocol` would turn away.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "appVersion" TEXT,
ADD COLUMN "syncProtocol" INTEGER,
ADD COLUMN "appSeenAt" TIMESTAMP(3);
