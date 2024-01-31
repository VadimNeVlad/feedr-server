/*
  Warnings:

  - You are about to drop the column `follower_count` on the `Follow` table. All the data in the column will be lost.
  - You are about to drop the column `following_count` on the `Follow` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Follow" DROP COLUMN "follower_count",
DROP COLUMN "following_count";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "followers_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "following_count" INTEGER NOT NULL DEFAULT 0;
