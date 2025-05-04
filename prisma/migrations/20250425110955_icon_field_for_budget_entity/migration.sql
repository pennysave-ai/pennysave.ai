/*
  Warnings:

  - Made the column `icon` on table `Budget` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "icon" SET NOT NULL;
