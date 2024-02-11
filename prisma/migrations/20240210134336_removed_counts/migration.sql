/*
  Warnings:

  - You are about to drop the column `comments_count` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `favorites_count` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `comments_count` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "articles" DROP COLUMN "comments_count",
DROP COLUMN "favorites_count";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "comments_count";
