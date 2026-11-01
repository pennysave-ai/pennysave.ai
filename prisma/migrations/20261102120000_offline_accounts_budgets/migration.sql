-- Accounts and budgets can now be created by the app offline, under ids it mints, and a create is
-- sent again whenever its reply was lost. A deleted account or budget leaves a `SyncTombstone`, so
-- the API can answer such a repeat with 410 instead of bringing it back.

CREATE FUNCTION sync_tombstone_account() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO "SyncTombstone" ("entity", "entityId", "accountId") VALUES ('account', OLD."id", OLD."id");
    RETURN NULL;
END;
$$;

CREATE TRIGGER "UserAccount_sync_tombstone" AFTER DELETE ON "UserAccount"
    FOR EACH ROW EXECUTE FUNCTION sync_tombstone_account();

CREATE FUNCTION sync_tombstone_budget() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO "SyncTombstone" ("entity", "entityId", "userId") VALUES ('budget', OLD."id", OLD."userId");
    RETURN NULL;
END;
$$;

CREATE TRIGGER "Budget_sync_tombstone" AFTER DELETE ON "Budget"
    FOR EACH ROW EXECUTE FUNCTION sync_tombstone_budget();
