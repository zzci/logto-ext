FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

USER bun
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
