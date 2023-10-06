/*
  Warnings:

  - You are about to drop the `_userFollows` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_userFollows" DROP CONSTRAINT "_userFollows_A_fkey";

-- DropForeignKey
ALTER TABLE "_userFollows" DROP CONSTRAINT "_userFollows_B_fkey";

-- DropTable
DROP TABLE "_userFollows";

-- CreateTable
CREATE TABLE "Follow" (
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("follower_id","following_id")
);

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
