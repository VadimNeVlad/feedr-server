# Feeds Backend

REST API for articles, profiles, comments, tags, follows, reading lists, and image uploads. Built with NestJS, Prisma, PostgreSQL, JWT, and Cloudinary.

## Requirements

- Node.js 24
- PostgreSQL
- A Cloudinary account

## Local setup

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run start:dev
```

The API is available under `/api`; the health check is `GET /api/health` and interactive OpenAPI documentation is served at `/api/docs`.

Required environment variables are documented in `.env.example`. `JWT_SECRET` should be a randomly generated value of at least 32 characters. Access and refresh signing keys are independently derived from that master secret.

`CORS_ORIGINS` is a comma-separated allowlist. If omitted locally, only `http://localhost:3000` and `http://localhost:5173` are accepted.

## Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`

Access tokens expire after 15 minutes. Refresh tokens expire after seven days, are rotated on use, and only their SHA-256 digest is stored. Changing a password or logging out revokes the active refresh token.

## Validation and uploads

Unknown request properties are rejected globally. Pagination is zero-based and limited to 100 records per request.

Article and avatar uploads accept JPEG, PNG, GIF, or WebP files up to 5 MiB. Both declared type and file signature are checked. Replaced and deleted Cloudinary images are cleaned up on a best-effort basis.

## Database changes

Generate the client after changing the Prisma schema:

```bash
npm run prisma:generate
```

Create migrations in development and apply committed migrations in deployed environments:

```bash
npx prisma migrate dev --name describe_change
npm run prisma:migrate:deploy
```

The `20260925170000_security_and_query_indexes` migration adds refresh-token storage, cascade behavior, and indexes for frequently queried foreign keys. Review and back up production data before applying migrations.

## Quality checks

```bash
npm run lint:check
npm test
npm run test:e2e
npm run build
npm audit --omit=dev
```

Run the complete local validation with `npm run check`. GitHub Actions runs the same checks on pushes and pull requests.

## Deployment

`vercel.json` points Vercel at the cached Nest handler in `src/vercel.ts`; it no longer depends on a committed `dist` directory. Configure all variables from `.env.example` in the deployment environment and run Prisma migrations as a release step before routing traffic to a version that depends on them.
