# syntax=docker/dockerfile:1.7

# ------------------------------
# deps: install root + www deps
# ------------------------------
FROM node:20-bullseye AS deps
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

# Root deps (Nuxt is here)
COPY package.json /app/package.json
COPY pnpm-lock.yaml /app/pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# App workspace deps (no lockfile in www)
RUN mkdir -p /app/www
COPY www/package.json /app/www/package.json
RUN pnpm -C /app/www install --frozen-lockfile=false

# ------------------------------
# build: compile Nuxt (www)
# ------------------------------
FROM node:20-bullseye AS build
WORKDIR /app
ENV NODE_ENV=production
# ⬇️ Give the Nuxt/Vite build more heap
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Optional noise reducers / minor savings
ENV NUXT_TELEMETRY_DISABLED=1
ENV NITRO_MINIFY=false

RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

# bring in deps’ node_modules
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/www/node_modules /app/www/node_modules

# bring in source
COPY . /app

# build the app in /www
RUN pnpm -C /app/www build

# ------------------------------
# runtime: serve Nitro output
# ------------------------------
FROM node:20-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
COPY --from=build /app/www/.output /app/.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

