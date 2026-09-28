-- A null target is an exclusion: the viewer removed the source, so it no
-- longer falls back to a same-name match.
ALTER TABLE "CategoryMapping" ALTER COLUMN "targetCategoryId" DROP NOT NULL;
