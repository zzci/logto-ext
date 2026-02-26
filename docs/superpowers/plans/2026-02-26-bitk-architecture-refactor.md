# BitK Architecture Refactor — Implementation Plan

> **For Claude:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure logto-ext from a single-config monolith to a bitk-style split architecture with `app/` (backend) and `frontend/` (frontend with its own package.json, vite.config, tsconfig).

**Architecture:** Backend moves from `src/` to `app/`. Frontend moves from `web/user/` to `frontend/` with its own `package.json`, `vite.config.ts`, and `tsconfig.json`. Dev mode switches from single-process `@hono/vite-dev-server` to two-process `concurrently` (API on 3010 + Vite on 3000 with proxy). SPA base path stays at `/user/`, API stays at `/ext/*`.

**Tech Stack:** Bun, Hono, Vite, React, TypeScript, Tailwind CSS v4, concurrently

**Constraints:**
- SPA base path: `/user/`
- API prefix: `/ext/*`
- Runtime config endpoint: `GET /user/config.json` (served by Hono)

---

## File Structure Map

### Files to CREATE

| File | Purpose |
|------|---------|
| `frontend/package.json` | Frontend-only dependencies |
| `frontend/vite.config.ts` | Frontend-only Vite config with `/ext/*` proxy |
| `frontend/tsconfig.json` | Frontend TypeScript config |

### Files to MOVE (rename)

| From | To |
|------|-----|
| `src/app.ts` | `app/app.ts` |
| `src/index.ts` | `app/index.ts` |
| `src/middleware/*` | `app/middleware/*` |
| `src/routes/*` | `app/routes/*` |
| `src/services/*` | `app/services/*` |
| `src/utils/*` | `app/utils/*` |
| `web/user/index.html` | `frontend/index.html` |
| `web/user/public/*` | `frontend/public/*` |
| `web/user/src/*` | `frontend/src/*` |

### Files to MODIFY

| File | Changes |
|------|---------|
| `package.json` (root) | Remove frontend deps, add concurrently, update scripts, update paths |
| `tsconfig.json` (root) | Convert to backend-only config (no references) |
| `Dockerfile` | Update all paths (`src/` → `app/`, `web/` → `frontend/`, build output) |
| `app/index.ts` | Update dist path from `../dist/user` → `../frontend/dist` |
| `.env.example` | Add `API_PORT=3010` |

### Files to DELETE

| File | Reason |
|------|--------|
| `vite.config.ts` (root) | Replaced by `frontend/vite.config.ts` |
| `tsconfig.node.json` | Merged into root `tsconfig.json` |
| `tsconfig.web.json` | Replaced by `frontend/tsconfig.json` |
| `web/` (entire directory) | Content moved to `frontend/` |
| `src/` (entire directory) | Content moved to `app/` |
| `dist/` (if exists) | Build output now at `frontend/dist/` |

---

## Chunk 1: Backend — Move `src/` → `app/` and Update Configs

### Task 1: Move backend source files

**Files:**
- Move: `src/*` → `app/*`
- Delete: `src/` (after move)

- [ ] **Step 1: Move the entire `src/` directory to `app/`**

```bash
git mv src app
```

- [ ] **Step 2: Verify the move**

```bash
ls app/
# Expected: app.ts  index.ts  middleware/  routes/  services/  utils/
```

- [ ] **Step 3: Update `app/index.ts` — change dist path**

The `userDistPath` currently resolves to `../dist/user`. After the move, the built frontend will be at `../frontend/dist`. Update:

```typescript
// OLD:
const userDistPath = resolve(import.meta.dir, "../dist/user");
// NEW:
const userDistPath = resolve(import.meta.dir, "../frontend/dist");
```

Also update the static serve root:

```typescript
// OLD:
serveStatic({ root: "./dist/user", ... })
// NEW:
serveStatic({ root: "./frontend/dist", ... })
```

Also update the warning message:

```typescript
// OLD:
logger.warn("User SPA not found at dist/user/ - run 'bun run build:web' first");
// NEW:
logger.warn("User SPA not found at frontend/dist/ - run 'bun run build:web' first");
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move backend from src/ to app/"
```

---

### Task 2: Convert root `tsconfig.json` to backend-only config

**Files:**
- Modify: `tsconfig.json`
- Delete: `tsconfig.node.json`

- [ ] **Step 1: Replace root `tsconfig.json` with backend config**

Merge `tsconfig.node.json` content into `tsconfig.json`, updating include path:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["bun-types"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["app"]
}
```

- [ ] **Step 2: Delete old tsconfig files**

```bash
rm tsconfig.node.json tsconfig.web.json
```

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json && git rm tsconfig.node.json tsconfig.web.json
git commit -m "refactor: convert root tsconfig to backend-only"
```

---

### Task 3: Update root `package.json` — backend deps + scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Rewrite `package.json`**

Move frontend-only deps out (they'll go to `frontend/package.json`). Add `concurrently`. Update scripts.

```json
{
  "name": "logto-ext",
  "version": "1.0.0",
  "private": true,
  "description": "Logto extension service with user account center",
  "type": "module",
  "scripts": {
    "dev": "concurrently --kill-others \"bun run dev:api\" \"bun run dev:web\"",
    "dev:api": "bun run --hot app/index.ts",
    "dev:web": "cd frontend && bun run dev",
    "build:web": "cd frontend && bun run build",
    "build": "bun run build:web",
    "start": "bun run app/index.ts",
    "preview": "cd frontend && bun run preview",
    "install:all": "bun install && cd frontend && bun install"
  },
  "dependencies": {
    "consola": "^3.4.2",
    "hono": "^4.11.7"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "concurrently": "^9.1.2",
    "typescript": "~5.9.3"
  }
}
```

- [ ] **Step 2: Update `.env.example`**

Add `API_PORT` for dev mode:

```
# === Backend (runtime) ===
LOGTO_ENDPOINT=https://your-tenant.logto.app
LOGTO_M2M_APP_ID=your-m2m-app-id
LOGTO_M2M_APP_SECRET=your-m2m-app-secret
LOGTO_SPA_ENDPOINT=https://your-spa-tenant.logto.app
LOGTO_SPA_APP_ID=your-spa-app-id
APP_URL=https://ext.example.com
LOGTO_WEBHOOK_SECRET=your-webhook-signing-key
API_KEY=your-api-key
PORT=3000
API_PORT=3010
LOG_LEVEL=info
```

- [ ] **Step 3: Update `app/utils/env.ts`**

Add `API_PORT` to the config (used by dev mode to serve API on separate port):

```typescript
interface EnvConfig {
  // ... existing fields ...
  PORT: number;
  API_PORT: number;
}

// In getEnvConfig():
PORT: parseInt(process.env.PORT || "3000", 10),
API_PORT: parseInt(process.env.API_PORT || process.env.PORT || "3000", 10),
```

- [ ] **Step 4: Update `app/index.ts` — use `API_PORT` in dev, `PORT` in production**

Change the server port logic:

```typescript
const server = Bun.serve({
  port: env.API_PORT,
  fetch: app.fetch,
});
```

- [ ] **Step 5: Commit**

```bash
git add package.json .env.example app/utils/env.ts app/index.ts
git commit -m "refactor: update root package.json for split architecture"
```

---

## Chunk 2: Frontend — Move `web/user/` → `frontend/` with Own Configs

### Task 4: Move frontend source files

**Files:**
- Move: `web/user/*` → `frontend/*`
- Delete: `web/` (after move)

- [ ] **Step 1: Create `frontend/` and move files**

```bash
mkdir -p frontend
# Move web/user contents to frontend/
git mv web/user/index.html frontend/
git mv web/user/public frontend/
git mv web/user/src frontend/
```

- [ ] **Step 2: Remove empty `web/` directory**

```bash
rm -rf web
```

- [ ] **Step 3: Verify structure**

```bash
ls frontend/
# Expected: index.html  public/  src/
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move frontend from web/user/ to frontend/"
```

---

### Task 5: Create `frontend/package.json`

**Files:**
- Create: `frontend/package.json`

- [ ] **Step 1: Write `frontend/package.json`**

Contains only frontend dependencies:

```json
{
  "name": "logto-ext-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@logto/react": "^4.0.12",
    "@tanstack/react-query": "^5.90.20",
    "clsx": "^2.1.1",
    "i18next": "^25.8.4",
    "lucide-react": "^0.563.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-i18next": "^16.5.4",
    "react-router-dom": "^7.13.0",
    "tailwind-merge": "^3.4.0",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "tailwindcss": "^4.1.18",
    "typescript": "~5.9.3",
    "vite": "^7.2.4"
  }
}
```

- [ ] **Step 2: Install frontend dependencies**

```bash
cd frontend && bun install
```

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/bun.lock
git commit -m "refactor: add frontend/package.json with frontend deps"
```

---

### Task 6: Create `frontend/vite.config.ts`

**Files:**
- Create: `frontend/vite.config.ts`
- Delete: root `vite.config.ts`

- [ ] **Step 1: Write `frontend/vite.config.ts`**

No more `@hono/vite-dev-server`. Use Vite proxy for `/ext/*` and `/user/config.json`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/user/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/ext': {
        target: 'http://localhost:3010',
        changeOrigin: true,
      },
      '/user/config.json': {
        target: 'http://localhost:3010',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 2: Delete root `vite.config.ts`**

```bash
git rm vite.config.ts
```

- [ ] **Step 3: Commit**

```bash
git add frontend/vite.config.ts
git commit -m "refactor: add frontend/vite.config.ts with proxy config"
```

---

### Task 7: Create `frontend/tsconfig.json`

**Files:**
- Create: `frontend/tsconfig.json`

- [ ] **Step 1: Write `frontend/tsconfig.json`**

Based on old `tsconfig.web.json`, with paths updated for new location:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/tsconfig.json
git commit -m "refactor: add frontend/tsconfig.json"
```

---

## Chunk 3: Docker, Cleanup, and Verification

### Task 8: Update Dockerfile

**Files:**
- Modify: `Dockerfile`

- [ ] **Step 1: Rewrite Dockerfile for new structure**

```dockerfile
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
```

- [ ] **Step 2: Commit**

```bash
git add Dockerfile
git commit -m "refactor: update Dockerfile for new directory structure"
```

---

### Task 9: Clean up and remove old files

**Files:**
- Delete: `@hono/vite-dev-server` from root deps (already done in Task 3)
- Verify: no stale references remain

- [ ] **Step 1: Remove root `bun.lock` and reinstall backend deps**

After the `package.json` was trimmed in Task 3, reinstall:

```bash
cd /app/ai/logto-ext && rm -f bun.lock && bun install
```

- [ ] **Step 2: Verify no imports reference old paths**

Search for any remaining `src/` or `web/user` references:

```bash
grep -r "from ['\"]\.\.\/src\/" app/ || echo "No stale src/ imports"
grep -r "web/user" app/ frontend/ || echo "No stale web/user references"
grep -r "dist/user" app/ frontend/ Dockerfile || echo "No stale dist/user references"
```

- [ ] **Step 3: Commit cleanup**

```bash
git add -A
git commit -m "chore: clean up stale references and reinstall deps"
```

---

### Task 10: Verify dev mode works

- [ ] **Step 1: Start dev mode**

```bash
bun run dev
```

Expected: Two processes start:
- API on `http://localhost:3010`
- Vite on `http://localhost:3000`

- [ ] **Step 2: Test API directly**

```bash
curl http://localhost:3010/ext/health
# Expected: {"status":"ok"}
```

- [ ] **Step 3: Test config proxy**

```bash
curl http://localhost:3000/user/config.json
# Expected: {"logtoEndpoint":"...","logtoAppId":"...","appUrl":"..."}
```

- [ ] **Step 4: Test SPA loads**

```bash
curl -s http://localhost:3000/user/ | head -5
# Expected: HTML with <div id="root">
```

---

### Task 11: Verify production build works

- [ ] **Step 1: Build frontend**

```bash
bun run build:web
```

Expected: Build succeeds, output in `frontend/dist/`.

- [ ] **Step 2: Verify build output**

```bash
ls frontend/dist/
# Expected: index.html  favicon.svg  assets/
```

- [ ] **Step 3: Start production server**

```bash
PORT=3000 bun run start
```

- [ ] **Step 4: Test production endpoints**

```bash
curl http://localhost:3000/ext/health
curl http://localhost:3000/user/config.json
curl -s http://localhost:3000/user/ | head -5
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "refactor: complete bitk-style architecture restructure"
```

---

## Summary of Final Structure

```
logto-ext/
├── app/                        # Backend (Hono on Bun)
│   ├── index.ts                # Production entry (serves SPA + API)
│   ├── app.ts                  # Hono router (/ext/*, /user/config.json)
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
├── frontend/                   # Frontend (React SPA)
│   ├── index.html
│   ├── src/
│   ├── public/
│   ├── dist/                   # Build output (gitignored)
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── bun.lock
├── package.json                # Root: backend deps + orchestration scripts
├── tsconfig.json               # Backend TS config
├── Dockerfile
├── .env
└── .env.example
```
