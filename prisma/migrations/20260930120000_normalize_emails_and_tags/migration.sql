-- Emails are normalized (trim + lowercase) on register/login since cb7cce7,
-- but users created before that were stored as typed and could no longer log in.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "users"
    GROUP BY lower(trim("email"))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot normalize emails: several users share the same email ignoring case. Resolve them manually first.';
  END IF;
END $$;

UPDATE "users" SET "email" = lower(trim("email")) WHERE "email" <> lower(trim("email"));

-- Tag names are now normalized (trim + lowercase). Merge tags that differ only by case
-- into one canonical tag (the smallest id) and move their article links onto it.
CREATE TEMP TABLE "_tag_merge" AS
SELECT "id", first_value("id") OVER (PARTITION BY lower(trim("name")) ORDER BY "id") AS "canonical_id"
FROM "tags";

INSERT INTO "_ArticleToTag" ("A", "B")
SELECT at."A", m."canonical_id"
FROM "_ArticleToTag" at
JOIN "_tag_merge" m ON m."id" = at."B"
WHERE m."id" <> m."canonical_id"
ON CONFLICT DO NOTHING;

DELETE FROM "tags" t USING "_tag_merge" m
WHERE t."id" = m."id" AND m."id" <> m."canonical_id";

UPDATE "tags" SET "name" = lower(trim("name")) WHERE "name" <> lower(trim("name"));

DROP TABLE "_tag_merge";
