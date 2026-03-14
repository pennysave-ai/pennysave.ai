-- DropIndex
DROP INDEX "CanonicalItem_embedding_hnsw";

-- DropIndex
DROP INDEX "Store_geom_gist";

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "rawOCRAddress" TEXT;
