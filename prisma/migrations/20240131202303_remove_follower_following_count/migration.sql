/*
  Warnings:

  - You are about to drop the column `followers_count` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `following_count` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "followers_count",
DROP COLUMN "following_count";
