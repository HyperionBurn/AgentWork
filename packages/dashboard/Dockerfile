# ============================================================
# AgentWork Dashboard — Dockerfile (multi-stage, workspace-aware)
# ============================================================
# Must be built from REPO ROOT so npm workspaces resolve:
#   docker compose build dashboard
# ============================================================

FROM node:20-alpine AS base
WORKDIR /app

# ---- Install root + all workspace dependencies ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/dashboard/package.json ./packages/dashboard/
COPY packages/orchestrator/package.json ./packages/orchestrator/
RUN npm install --legacy-peer-deps --workspaces

# ---- Build with NEXT_PUBLIC_* inlined at build time ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/dashboard ./packages/dashboard
COPY packages/orchestrator ./packages/orchestrator

# Build-time env vars (B7 fix) — passed via docker-compose build.args
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ARG NEXT_PUBLIC_RESEARCH_AGENT_URL="http://localhost:4021"
ARG NEXT_PUBLIC_CODE_AGENT_URL="http://localhost:4022"
ARG NEXT_PUBLIC_TEST_AGENT_URL="http://localhost:4023"
ARG NEXT_PUBLIC_REVIEW_AGENT_URL="http://localhost:4024"

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_RESEARCH_AGENT_URL=$NEXT_PUBLIC_RESEARCH_AGENT_URL
ENV NEXT_PUBLIC_CODE_AGENT_URL=$NEXT_PUBLIC_CODE_AGENT_URL
ENV NEXT_PUBLIC_TEST_AGENT_URL=$NEXT_PUBLIC_TEST_AGENT_URL
ENV NEXT_PUBLIC_REVIEW_AGENT_URL=$NEXT_PUBLIC_REVIEW_AGENT_URL

WORKDIR /app/packages/dashboard
RUN npm run build

# ---- Production runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/dashboard/public ./public
COPY --from=builder /app/packages/dashboard/.next/standalone ./
COPY --from=builder /app/packages/dashboard/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
