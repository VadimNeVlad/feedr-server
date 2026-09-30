-- The Follow.createdAt field has existed in schema.prisma since 2024 without a migration.
-- IF NOT EXISTS keeps this safe for databases where the column was added via `prisma db push`.
ALTER TABLE "Follow" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
