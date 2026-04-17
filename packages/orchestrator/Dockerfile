# ============================================================
# AgentWork Orchestrator — Dockerfile (multi-stage, workspace-aware)
# ============================================================
# Must be built from REPO ROOT so npm workspaces resolve:
#   docker compose build orchestrator
# ============================================================

FROM node:20-alpine AS base
WORKDIR /app

# ---- Install dependencies ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/dashboard/package.json ./packages/dashboard/
COPY packages/orchestrator/package.json ./packages/orchestrator/
RUN npm install --legacy-peer-deps --workspaces

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/orchestrator ./packages/orchestrator

WORKDIR /app/packages/orchestrator
RUN npm run build

# ---- Production runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/orchestrator/dist ./dist
COPY --from=builder /app/packages/orchestrator/package.json ./

EXPOSE 4030
CMD ["node", "dist/index.js"]
