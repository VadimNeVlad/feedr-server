-- AlterTable
ALTER TABLE "users" ADD COLUMN     "comments_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "location" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "website_url" TEXT NOT NULL DEFAULT '';
