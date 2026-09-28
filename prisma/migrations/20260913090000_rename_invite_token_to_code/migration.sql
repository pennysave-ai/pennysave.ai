-- Rename AccountInvite.token to AccountInvite.code.
--
-- Written by hand: Prisma's generated diff for a field rename is DROP COLUMN +
-- ADD COLUMN, which would discard every existing invite. RENAME keeps the rows
-- and the column's data intact.
ALTER TABLE "AccountInvite" RENAME COLUMN "token" TO "code";

-- Keep the unique constraint and index named after the column they cover, so
-- the next generated migration diffs cleanly against the schema.
ALTER INDEX "AccountInvite_token_key" RENAME TO "AccountInvite_code_key";
ALTER INDEX "AccountInvite_token_idx" RENAME TO "AccountInvite_code_idx";
