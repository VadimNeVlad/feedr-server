-- CreateTable
CREATE TABLE "_userFollows" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_userFollows_AB_unique" ON "_userFollows"("A", "B");

-- CreateIndex
CREATE INDEX "_userFollows_B_index" ON "_userFollows"("B");

-- AddForeignKey
ALTER TABLE "_userFollows" ADD CONSTRAINT "_userFollows_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_userFollows" ADD CONSTRAINT "_userFollows_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
