-- Change tracking for `GET /sync`, the app's offline feed.
--
-- Every synced row carries `syncTxid`: the id of the database transaction that last wrote it, set
-- by a trigger so no code path can forget it. A client's cursor is the snapshot `xmin` of its last
-- read — every transaction below it had finished — so a write that commits late can never slip
-- behind a cursor, which a timestamp column can't promise.
--
-- Deletes leave a `SyncTombstone` behind, written by triggers for the same reason; that includes
-- cascades (an account deleted takes its rows with it) and a row moved to another account, which
-- is a delete for anyone who can't see the new one.

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "syncTxid" xid8 DEFAULT pg_current_xact_id();

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "syncTxid" xid8 DEFAULT pg_current_xact_id();

-- AlterTable
ALTER TABLE "CategoryMapping" ADD COLUMN "syncTxid" xid8 DEFAULT pg_current_xact_id();

-- AlterTable
ALTER TABLE "TransactionPlacement" ADD COLUMN "syncTxid" xid8 DEFAULT pg_current_xact_id();

-- CreateTable
CREATE TABLE "SyncTombstone" (
    "id" BIGSERIAL NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "accountId" TEXT,
    "userId" TEXT,
    "syncTxid" xid8 DEFAULT pg_current_xact_id(),
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncTombstone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncHorizon" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "prunedThrough" xid8,

    CONSTRAINT "SyncHorizon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_accountId_syncTxid_idx" ON "Transaction"("accountId", "syncTxid");

-- CreateIndex
CREATE INDEX "Category_userId_syncTxid_idx" ON "Category"("userId", "syncTxid");

-- CreateIndex
CREATE INDEX "SyncTombstone_syncTxid_idx" ON "SyncTombstone"("syncTxid");

-- CreateIndex
CREATE INDEX "SyncTombstone_entity_entityId_idx" ON "SyncTombstone"("entity", "entityId");

INSERT INTO "SyncHorizon" ("id") VALUES (1);

-- Restamps a row on every update. Inserts take the column default.
CREATE FUNCTION sync_stamp() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW."syncTxid" := pg_current_xact_id();
    RETURN NEW;
END;
$$;

CREATE TRIGGER "Transaction_sync_stamp" BEFORE UPDATE ON "Transaction"
    FOR EACH ROW EXECUTE FUNCTION sync_stamp();

-- Only the columns a client holds: the background job that writes `nameEmbedding` must not send
-- every category back down the feed.
CREATE TRIGGER "Category_sync_stamp" BEFORE UPDATE OF "name", "description", "icon", "archivedAt", "userId" ON "Category"
    FOR EACH ROW EXECUTE FUNCTION sync_stamp();

CREATE TRIGGER "CategoryMapping_sync_stamp" BEFORE UPDATE ON "CategoryMapping"
    FOR EACH ROW EXECUTE FUNCTION sync_stamp();

CREATE TRIGGER "TransactionPlacement_sync_stamp" BEFORE UPDATE ON "TransactionPlacement"
    FOR EACH ROW EXECUTE FUNCTION sync_stamp();

-- A row gone from an account: deleted, or moved to another one.
CREATE FUNCTION sync_tombstone_transaction() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' OR OLD."accountId" IS DISTINCT FROM NEW."accountId" THEN
        INSERT INTO "SyncTombstone" ("entity", "entityId", "accountId", "userId")
        VALUES ('transaction', OLD."id", OLD."accountId", OLD."createdBy");
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER "Transaction_sync_tombstone" AFTER DELETE OR UPDATE OF "accountId" ON "Transaction"
    FOR EACH ROW EXECUTE FUNCTION sync_tombstone_transaction();

CREATE FUNCTION sync_tombstone_category() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO "SyncTombstone" ("entity", "entityId", "userId") VALUES ('category', OLD."id", OLD."userId");
    RETURN NULL;
END;
$$;

CREATE TRIGGER "Category_sync_tombstone" AFTER DELETE ON "Category"
    FOR EACH ROW EXECUTE FUNCTION sync_tombstone_category();

-- Keyed by the source category: a viewer has at most one mapping per source.
CREATE FUNCTION sync_tombstone_category_mapping() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO "SyncTombstone" ("entity", "entityId", "userId") VALUES ('categoryMapping', OLD."sourceCategoryId", OLD."viewerId");
    RETURN NULL;
END;
$$;

CREATE TRIGGER "CategoryMapping_sync_tombstone" AFTER DELETE ON "CategoryMapping"
    FOR EACH ROW EXECUTE FUNCTION sync_tombstone_category_mapping();

-- Keyed by the row: a viewer has at most one pick per row.
CREATE FUNCTION sync_tombstone_placement() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO "SyncTombstone" ("entity", "entityId", "userId") VALUES ('placement', OLD."transactionId", OLD."viewerId");
    RETURN NULL;
END;
$$;

CREATE TRIGGER "TransactionPlacement_sync_tombstone" AFTER DELETE ON "TransactionPlacement"
    FOR EACH ROW EXECUTE FUNCTION sync_tombstone_placement();

-- Drops tombstones older than `keep` and records the newest one dropped. A cursor at or below
-- `prunedThrough` may have missed a delete, so the feed answers it with a reset.
CREATE FUNCTION sync_prune_tombstones(keep interval) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
    newest xid8;
    dropped integer;
BEGIN
    WITH gone AS (
        DELETE FROM "SyncTombstone" WHERE "deletedAt" < CURRENT_TIMESTAMP - keep RETURNING "syncTxid"
    )
    SELECT max("syncTxid"), count(*) INTO newest, dropped FROM gone;
    IF newest IS NOT NULL THEN
        UPDATE "SyncHorizon"
        SET "prunedThrough" = CASE WHEN "prunedThrough" IS NULL OR "prunedThrough" < newest THEN newest ELSE "prunedThrough" END
        WHERE "id" = 1;
    END IF;
    RETURN dropped;
END;
$$;
