# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssl ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY src/db/prisma ./src/db/prisma
RUN npm ci --omit=dev --ignore-scripts \
  && npm rebuild argon2 \
  && npx prisma generate --schema=src/db/prisma/schema.prisma

FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssl ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY src/db/prisma ./src/db/prisma
RUN npm ci --ignore-scripts \
  && npm rebuild argon2 \
  && npx prisma generate --schema=src/db/prisma/schema.prisma
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 999 app \
  && useradd --system --uid 999 --gid app --create-home app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json ./
COPY src/db/prisma ./src/db/prisma
COPY src/db/migrations ./src/db/migrations
COPY scripts/db-migrate.mjs ./scripts/db-migrate.mjs
USER app
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server/index.js"]
