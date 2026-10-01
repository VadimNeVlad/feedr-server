# FeedR Backend

REST API for the FeedR blogging platform: articles, profiles, comments, tags, follows, reading lists (favorites), and image uploads.

**Stack:** NestJS 12 (Express) · Prisma 5 · PostgreSQL · JWT (passport-jwt) · bcrypt · Cloudinary · Swagger/OpenAPI

---

## How it works

### Request pipeline

Every request passes through the same chain, configured once in `src/app.setup.ts` (shared by the regular server and the Vercel handler):

1. **Global prefix** — all routes live under `/api`.
2. **Request logging** — each response is logged as one JSON line (`requestId`, `method`, `path`, `statusCode`, `durationMs`). An incoming `X-Request-Id` (≤128 chars) is reused, otherwise a UUID is generated; it is echoed back in the `X-Request-Id` response header.
3. **Helmet** — security headers.
4. **CORS** — allowlist from `CORS_ORIGINS`, credentials enabled.
5. **Rate limiting** — global `ThrottlerGuard`: 100 requests/min per IP; `register`/`login` 5/min, `refresh-token` 10/min. Counters are kept **in process memory**.
6. **Validation** — global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`: unknown body/query properties are rejected with 400.
7. **Guards** — `JwtGuard` (token required) or `OptionalJwtGuard` (token used if present, e.g. to compute `isFavorited` / `isFollowing`).
8. **Error mapping** — `PrismaExceptionFilter` turns Prisma errors into HTTP codes: `P2002` → 409, `P2025`/`P2003` → 404, others → 500 `Database operation failed`.

### Modules

| Module | Responsibility |
|---|---|
| `auth` | Registration, login, token refresh/rotation, logout |
| `user` | Current user profile, public profiles, avatar, password change, account deletion, follow/unfollow |
| `article` | Article CRUD with image, feed with pagination, author feed, favorites, reading list |
| `comment` | Comments per article |
| `tag` | Tag list and articles by tag |
| `follow` | Followers/following lists |
| `cloudinary` | Image upload/cleanup in Cloudinary |
| `prisma` | `PrismaService` — connects on startup, disconnects on shutdown |

### Authentication

- Passwords are hashed with bcrypt (cost 12). Emails are normalized (trimmed, lower-cased).
- **Access token**: 15 min, sent as `Authorization: Bearer <token>`.
- **Refresh token**: 7 days, sent in the request body to `/api/auth/refresh-token`. Only its SHA-256 digest is stored (`users.refresh_token_hash`). Each refresh **rotates** the token; reusing an old one fails. Logout and password change revoke it.
- Access and refresh signing keys are derived independently (HMAC-SHA256) from one master `JWT_SECRET`, so changing `JWT_SECRET` invalidates all issued tokens.

### Image uploads

- Fields: `image` (articles), `avatar` (user). `multipart/form-data`, one file.
- JPEG, PNG, GIF, WebP up to **4 MiB** (kept under Vercel's 4.5 MB body limit). Both the declared type and the file signature (magic bytes) are checked.
- Files are held **in memory** (never written to disk) and streamed to Cloudinary into `feeds/articles/<articleId>/` or `feeds/avatars/<userId>/`.
- Cloudinary errors: 400 from Cloudinary → 400, anything else → 502. Replaced/deleted images are removed from Cloudinary on a best-effort basis.

### Data model

PostgreSQL tables (see `prisma/schema.prisma`): `users`, `articles`, `tags`, `Comment`, `Follow`, plus Prisma's implicit many-to-many tables for article tags and favorites. Deleting a user cascades to their articles, comments and follows. Schema changes are versioned in `prisma/migrations/`.

---

## API overview

Base path: `/api`. Interactive documentation (Swagger UI): **`/api/docs`**.
🔒 = access token required, 🔓 = token optional.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | | Liveness + DB check (`SELECT 1`) → `{ "status": "ok" }` |
| POST | `/auth/register` | | Register, returns user + tokens |
| POST | `/auth/login` | | Login, returns user + tokens |
| POST | `/auth/refresh-token` | | Exchange refresh token for a new pair |
| POST | `/auth/logout` | 🔒 | Revoke refresh token |
| GET | `/user` | 🔒 | Current user |
| GET | `/user/:id` | 🔓 | Public profile |
| PUT | `/user` | 🔒 | Update profile |
| PUT | `/user/update-avatar` | 🔒 | Upload avatar (`avatar` field) |
| PUT | `/user/change-password` | 🔒 | Change password |
| DELETE | `/user` | 🔒 | Delete account |
| POST / DELETE | `/user/:fuid/follow` | 🔒 | Follow / unfollow |
| GET | `/:id/following`, `/:id/followers` | 🔓 | Follow lists |
| GET | `/articles` | 🔓 | Article feed (paginated) |
| GET | `/articles/:id` | 🔓 | Single article |
| GET | `/articles/author/:authorId` | 🔓 | Articles by author |
| GET | `/articles/user/reading-list` | 🔒 | Favorited articles |
| POST | `/articles` | 🔒 | Create article (`image` field optional) |
| PUT / DELETE | `/articles/:id` | 🔒 | Update / delete own article |
| POST / DELETE | `/articles/:id/favorite` | 🔒 | Add / remove favorite |
| GET | `/comments/:articleId` | | Comments of an article |
| POST | `/comments/:articleId` | 🔒 | Add comment |
| PUT / DELETE | `/comments/:id` | 🔒 | Edit / delete own comment |
| GET | `/tags` | | All tags |
| GET | `/tags/:tagName` | 🔓 | Articles with a tag |

Pagination is zero-based and limited to 100 records per request.

---

## Configuration

All configuration comes from environment variables. Locally they are read from `.env` (see `.env.example`). The app **fails at startup** with a clear message if a required variable is missing or invalid (`src/config/env.validation.ts`).

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string, e.g. `postgresql://user:password@localhost:5432/feeds` |
| `JWT_SECRET` | ✅ | — | Master secret for JWT signing. At least 16 characters are enforced; use 32+ random characters |
| `CLOUD_NAME` | ✅ | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | — | Cloudinary API secret |
| `PORT` | | `3000` | HTTP port (digits only) |
| `CORS_ORIGINS` | | `http://localhost:3000,http://localhost:5173` | Comma-separated list of exact origins (`https://example.com`, no trailing slash or path) |
| `TRUST_PROXY` | | unset | Number of reverse proxies in front of the app (e.g. `1` behind nginx). Needed so rate limiting and logs see the real client IP. Ignored on Vercel (always `1`) |

Generate a secret, for example:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## Running locally

Requirements: **Node.js 24**, a PostgreSQL database, a Cloudinary account (a separate one or folder for development is recommended).

```bash
cp .env.example .env           # then fill in the values
npm ci
npm run prisma:generate        # generate Prisma client into node_modules/.prisma
npm run prisma:migrate:deploy  # apply migrations to DATABASE_URL
npm run start:dev              # watch mode on http://localhost:3000
```

Check: `http://localhost:3000/api/health` and `http://localhost:3000/api/docs`.

### npm scripts

| Script | What it does |
|---|---|
| `start:dev` / `start:debug` | Run from sources with watch (and debugger) |
| `build` | Compile TypeScript into `dist/` (`nest build`, entry point `dist/main.js`) |
| `start` / `start:prod` | Run compiled app: `node dist/main` |
| `prisma:generate` | Generate Prisma client (required before `build` and after schema changes) |
| `prisma:migrate:deploy` | Apply committed migrations (deployment step) |
| `lint` / `lint:check` | ESLint with / without autofix |
| `test`, `test:ci`, `test:e2e` | Unit tests, unit with coverage, e2e tests |
| `check` | lint + unit + e2e + build — the full local validation, also run in CI |

Unit and e2e tests mock Prisma and Cloudinary, so they **do not need a database or network**.

### Database changes

```bash
# after editing prisma/schema.prisma, in development:
npx prisma migrate dev --name describe_change
# in deployed environments (only applies committed migrations):
npm run prisma:migrate:deploy
```

Back up production data before applying migrations. Migrations must be applied **before** routing traffic to a version that depends on them.

---

## Build and run lifecycle

```
npm ci  ──►  prisma generate  ──►  nest build  ──►  node dist/main
                    │                                     │
          node_modules/.prisma/client          reads env, validates it,
          (query engine for current OS)        connects to PostgreSQL,
                                               listens on $PORT
```

**Startup:** `src/main.ts` creates the Nest app → validates environment → sets `trust proxy` if `TRUST_PROXY` is set → applies `configureApp` → `PrismaService` connects to the DB (startup fails if the DB is unreachable) → listens on `PORT`.

**Shutdown:** `enableShutdownHooks()` is on — on `SIGTERM`/`SIGINT` Nest closes the HTTP server and disconnects Prisma.

**Migrations are not run on startup** — they are a separate step (`prisma migrate deploy`), which needs the `prisma` CLI from devDependencies and the `prisma/` folder.

---

## Notes for containerization

Facts about the app that matter when writing the `Dockerfile` / compose files:

- **Runtime artifacts:** `dist/`, production `node_modules` (including the generated `node_modules/.prisma/client` and `@prisma/client`), `package.json`. Sources, tests, `prisma/` and devDependencies are not needed at runtime.
- **Build order:** `npm ci` → `prisma generate` → `nest build` → `npm prune --omit=dev`. `prisma generate` must run in the same OS/libc as the runtime image, because it downloads the query engine for the current platform (no `binaryTargets` are set in the schema).
- **Native / system dependencies:** `bcrypt` is a native addon (prebuilt binaries via `node-gyp-build`, glibc). The Prisma query engine needs **OpenSSL** (`libssl`) at runtime; Debian `slim` images may not have it, so install `openssl` in the image, otherwise Prisma fails to detect the SSL library.
- **Migrations:** a separate one-off step/service that has the `prisma` CLI and the `prisma/` folder, run before the app starts.
- **Configuration:** only environment variables; nothing secret should be baked into the image. `.env` is loaded only if present — the app runs without it when variables are passed in.
- **Port:** `3000` by default (`PORT`).
- **Health check:** `GET /api/health`; it also queries the database, so it fails when PostgreSQL is down. Slim images have no `curl`/`wget` — use `node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"`.
- **Signals:** graceful shutdown relies on `SIGTERM` reaching Node — start with `node dist/main` directly (not via `npm start`) or use an init (`--init` / `init: true`).
- **Filesystem:** the app is stateless and writes nothing to disk (uploads are in memory, logs go to stdout), so it can run as a non-root user with a read-only filesystem.
- **Behind a reverse proxy:** set `TRUST_PROXY` to the number of proxies; add the frontend origin to `CORS_ORIGINS`.
- **Scaling:** rate-limit counters are in memory, per instance. With several replicas each has its own limits (a shared store such as Redis would be needed for global limits).
- **Request size:** uploads are capped at 4 MiB per file; a proxy in front must allow at least ~5 MB bodies (`client_max_body_size` in nginx).
- **Outbound network:** the container needs access to PostgreSQL and to `api.cloudinary.com` (HTTPS).

---

## Deployment on Vercel

`vercel.json` routes all requests to `src/vercel.ts`, which lazily creates and caches one Nest instance per serverless function (with `trust proxy` = 1). The `vercel-build` script runs `prisma generate && nest build`. Configure all variables from `.env.example` in the Vercel project and apply migrations as a release step.

## CI

`.github/workflows/ci.yml` runs on every push and pull request: Node 24 → `npm ci` → `prisma generate` → `npm run check` → `npm audit --omit=dev --audit-level=high`.
