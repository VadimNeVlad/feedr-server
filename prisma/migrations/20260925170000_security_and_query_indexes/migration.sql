-- Store only a digest of the currently valid refresh token.
ALTER TABLE "users" ADD COLUMN "refresh_token_hash" TEXT;

-- User and article deletion should not be blocked by dependent rows.
ALTER TABLE "articles" DROP CONSTRAINT "articles_author_id_fkey";
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment" DROP CONSTRAINT "Comment_author_id_fkey";
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment" DROP CONSTRAINT "Comment_article_id_fkey";
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_article_id_fkey"
  FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Follow" DROP CONSTRAINT "Follow_follower_id_fkey";
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_follower_id_fkey"
  FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Follow" DROP CONSTRAINT "Follow_following_id_fkey";
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_following_id_fkey"
  FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "articles_author_id_idx" ON "articles"("author_id");
CREATE INDEX "Comment_author_id_idx" ON "Comment"("author_id");
CREATE INDEX "Comment_article_id_idx" ON "Comment"("article_id");
CREATE INDEX "Follow_following_id_idx" ON "Follow"("following_id");
