# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:24-trixie-slim@sha256:8ec5d7557396cfe32d21c3f9c13072355ceab22b584578ca4bb28af31120cffe

# System packages shared by every stage, so prisma generate (build) and the
# runtime (prod) always see the same OpenSSL.
FROM ${NODE_IMAGE} AS base

WORKDIR /app

# upgrade pulls Debian security fixes released after the base image was built.
# hadolint ignore=DL3008
RUN apt-get update \
  && apt-get upgrade -y --no-install-recommends \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM deps AS build

COPY . .

RUN npm run prisma:generate
RUN npm run build
RUN npm prune --omit=dev

FROM deps AS migrate

COPY --from=build /app/prisma ./prisma

CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS prod

# The app runs with plain node; npm and corepack bundled with the base image
# are unused at runtime and only add vulnerable dependencies.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
  /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

ENV NODE_ENV=production

USER node

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/main"]
