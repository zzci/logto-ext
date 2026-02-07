# Stage 1: Install all dependencies (including devDeps for Vite build)
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Build the frontend
FROM deps AS web-builder
WORKDIR /app
COPY vite.config.ts tsconfig.node.json tsconfig.web.json ./
COPY web ./web
RUN bun run build:web

# Stage 3: Install production-only dependencies
FROM oven/bun:1-alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Stage 4: Production image
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./
COPY --from=web-builder /app/dist/user ./dist/user

USER bun
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
