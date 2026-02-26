# Stage 1: Install backend dependencies
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Install frontend dependencies and build
FROM oven/bun:1-alpine AS web-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend/ .
RUN bun run build

# Stage 3: Install production-only backend dependencies
FROM oven/bun:1-alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Stage 4: Production image
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY app ./app
COPY package.json ./
COPY --from=web-builder /app/frontend/dist ./frontend/dist

USER bun
EXPOSE 3000

CMD ["bun", "run", "app/index.ts"]
