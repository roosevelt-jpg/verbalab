# Lugemi / verbalab — Nest API image (repo-root Dockerfile for Fly UI detection).
# Preferred production: two apps — see docs/fly.md and infra/fly/*.jnb.toml
#
# Build from repo root:
#   docker build -t verbalab-api .
#   # or: docker build -f apps/api/Dockerfile -t verbalab-api .
FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/typescript-config ./packages/typescript-config
COPY packages/eslint-config ./packages/eslint-config
RUN pnpm install --frozen-lockfile --filter @lugemi/api...
COPY apps/api ./apps/api
RUN pnpm --filter @lugemi/api exec prisma generate \
  && pnpm --filter @lugemi/api run build

FROM base AS runner
ENV NODE_ENV=production
ENV API_PORT=3001
ENV PORT=3001
WORKDIR /app
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api ./apps/api
RUN chmod +x /app/apps/api/scripts/docker-entrypoint.sh /app/apps/api/scripts/fly-migrate.sh
WORKDIR /app
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const p=process.env.PORT||process.env.API_PORT||3001;fetch('http://127.0.0.1:'+p+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/app/apps/api/scripts/docker-entrypoint.sh"]
# Nest binds 0.0.0.0:$PORT (see apps/api/src/main.ts); Fly sets PORT (default 3001 here).
CMD ["node", "apps/api/dist/main.js"]
