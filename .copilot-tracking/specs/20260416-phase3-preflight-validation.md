# SPEC: Phase 3 — Pre-Flight Validation & Critical Fixes
## Status: APPROVED (RALPLAN Consensus — Planner ✓ Architect ✓ Critic ✓)
## Owner: AgentWork Team
## Created: 2026-04-16
## Updated: 2026-04-16

---

## Problem

Phase 2 code fixes compile cleanly but the system has **never been run end-to-end**. Five blocking architecture issues and several gaps prevent the first successful demo. Without resolution before Day 0 (April 20), the hackathon demo will fail silently.

---

## Acceptance Criteria

- [ ] `npm install` at root succeeds with zero peer-dep errors
- [ ] All 4 Python agents start and respond to `/health` with 200
- [ ] `GatewayClient.deposit("$1")` produces a verifiable arcscan tx hash
- [ ] `GatewayClient.pay(agent-url)` produces a verifiable arcscan tx hash (agent running)
- [ ] Dashboard loads at `http://localhost:3000` with non-empty task feed after orchestrator run
- [ ] `docker-compose up` runs all 6 services to "healthy" status
- [ ] `DEMO_RUNS=10` orchestrator execution produces 60+ task_events rows in Supabase
- [ ] At least 1 arcscan link is clickable and resolves from the dashboard TxList

---

## Architecture Decision Record (ADR)

### Decision
Adopt **Option A (Full Vertical Slice)** with **7 mandatory modifications** from Architect + Critic review.

### Drivers
1. Timeline: 4 days until hackathon; no time for staged validation
2. Unknowns: Gateway batching behavior, circlekit availability, faucet reliability
3. PRD-05: 60+ transactions requires architecture change (loop mode)

### Alternatives Considered
- **Option B (Staged Validation)**: 16-18 hours; too slow, mocks may not match reality
- **Option C (Minimal MVP)**: 90 min but no Docker, only 4 txns, highest risk

### Why Chosen
Option A validates the full stack in 3-4 hours and surfaces real integration bugs early. The 7 modifications address every blocking issue identified by Architect and Critic.

### Consequences
- Requires ~2 hours of additional code fixes before infrastructure setup
- Docker builds need workspace-aware context (more complex Dockerfiles)
- 60+ txn target achievable via loop mode (not contract deployment)

---

## Blocking Issues Found (Must Fix Before Testing)

### B1: Schema Missing `error` Column (Architect RISK-2)
**File**: `packages/database/schema.sql`
**Problem**: Orchestrator `supabase.ts` inserts `error` field but column doesn't exist. Every `recordTaskEvent()` silently fails.
**Fix**: Add `error TEXT` column to `task_events` table.

### B2: Dashboard `TxList` Always Empty (Architect RISK-1 + RISK-4)
**File**: `packages/dashboard/app/page.tsx`
**Problem**: `payments` state initialized but never populated. Two disconnected payment recording paths (orchestrator → `task_events`, dashboard → `payment_events`). TxList reads from empty `payment_events`.
**Fix**: Add `fetchPayments()` that queries `task_events` where `gateway_tx IS NOT NULL`, populate TxList from that.

### B3: Fatal Execution Ordering — Agents Before Payments (Critic M1)
**Problem**: Plan had `gateway.pay()` before agents start. `pay()` makes HTTP request to agent URL — connection refused if agent not running.
**Fix**: Start agents FIRST, then deposit + pay. This is a plan fix, not code fix.

### B4: Dashboard `supabase.ts` Crashes Without Env Vars (Architect M1)
**File**: `packages/dashboard/lib/supabase.ts`
**Problem**: Immediate `createClient()` with `!` assertions crashes page load if env missing.
**Fix**: Lazy initialization with null safety.

### B5: Docker Workspace Build Context (Architect RISK-5)
**File**: `packages/orchestrator/Dockerfile`
**Problem**: `npm install` inside package directory fails for workspace packages.
**Fix**: Multi-stage build from repo root, or use `docker-compose.yml` build context at root.

### B6: No Multi-Run Loop for 60+ Transactions (Critic M2, Architect M3)
**File**: `packages/orchestrator/src/index.ts`
**Problem**: Orchestrator is one-shot. Need ~10 runs × 7 payments = 70 events.
**Fix**: Add `DEMO_RUNS` env var with loop in `index.ts`.

### B7: Docker `NEXT_PUBLIC_*` Build-Time vs Runtime (Architect RISK-3)
**File**: `packages/dashboard/Dockerfile` + `docker-compose.yml`
**Problem**: Next.js inlines `NEXT_PUBLIC_*` at build time. Docker Compose passes at runtime. Dashboard can't reach agents in Docker.
**Fix**: Use build args in Dockerfile, or switch to server-side API route for agent URL resolution.

---

## Execution Plan (Ordered by Dependencies)

### Step 0: Code Fixes (Before Any Infrastructure) — ~2 hours

| # | Fix | File | Time |
|---|-----|------|------|
| 0a | Add `error` column to schema.sql | `packages/database/schema.sql` | 2 min |
| 0b | Add `fetchPayments()` → TxList bridge | `packages/dashboard/app/page.tsx` | 30 min |
| 0c | Lazy init in `supabase.ts` | `packages/dashboard/lib/supabase.ts` | 10 min |
| 0d | Add `DEMO_RUNS` loop to orchestrator | `packages/orchestrator/src/index.ts` | 15 min |
| 0e | Fix Docker workspace builds | `Dockerfiles` + `docker-compose.yml` | 30 min |
| 0f | Fix `NEXT_PUBLIC_*` build-time issue | `Dockerfile` + `docker-compose.yml` | 15 min |
| 0g | TypeScript re-validation | `npx tsc --noEmit` | 5 min |

### Step 1: Infrastructure Setup (Parallel) — ~20 min

| # | Task | Verification |
|---|------|-------------|
| 1a | `npm install --legacy-peer-deps` at root | `ls node_modules/@circle-fin/x402-batching` exists |
| 1b | Create `.env` from `.env.example` | All required vars filled |
| 1c | Create Supabase project, run `schema.sql` | 3 tables visible, `error` column present |
| 1d | Enable Supabase Realtime on both event tables | Replication tab shows enabled |
| 1e | Generate orchestrator wallet via `viem generatePrivateKey()` | 66-char hex string |
| 1f | Fund wallet via Circle Faucet ($5 USDC) | `getBalances().wallet.formatted >= "$5"` |

### Step 2: Agent Validation — ~20 min

| # | Task | Verification |
|---|------|-------------|
| 2a | Create Python venv per agent, `pip install -r requirements.txt` | No errors |
| 2b | Test `python -c "import circlekit"` | Expected: ImportError OK, passthrough mode |
| 2c | Start all 4 agents in separate terminals | No crash |
| 2d | `curl http://localhost:402{1,2,3,4}/health` | All return `{"status":"healthy"}` |
| 2e | `curl http://localhost:4021/?topic=test` | Returns agent metadata JSON |

### Step 3: First Blockchain Payment — ~15 min

| # | Task | Verification |
|---|------|-------------|
| 3a | `cd packages/orchestrator && npx tsx src/index.ts` (1 run) | Deposit succeeds |
| 3b | Watch for `depositTxHash` in output | Valid 66-char hex |
| 3c | Open `https://testnet.arcscan.io/tx/{hash}` | Transaction visible |
| 3d | Watch for payment tx hashes (7 payments) | Each has `result.transaction` |
| 3e | Verify arcscan for 1+ payment tx hash | On-chain proof |

### Step 4: Dashboard Validation — ~15 min

| # | Task | Verification |
|---|------|-------------|
| 4a | `cd packages/dashboard && npm run dev` | `localhost:3000` loads |
| 4b | Check agent cards show online status | Green indicators |
| 4c | Check task feed shows orchestrator payments | Non-empty list |
| 4d | Check TxList shows explorer links | Clickable arcscan URLs |
| 4e | Check economic comparison chart renders | PRD-07 satisfied |

### Step 5: Scale to 60+ Transactions — ~10 min

| # | Task | Verification |
|---|------|-------------|
| 5a | `DEMO_RUNS=10 npx tsx src/index.ts` | 70 payment attempts |
| 5b | Verify Supabase `SELECT count(*) FROM task_events` | ≥ 60 rows |
| 5c | Verify dashboard shows updated feed | Scrollable transaction list |
| 5d | Screenshot evidence | Save to `docs/evidence/` |

### Step 6: Docker Integration — ~30 min

| # | Task | Verification |
|---|------|-------------|
| 6a | `docker-compose build` | All images build |
| 6b | `docker-compose up -d` | All 6 services start |
| 6c | `docker ps` shows all healthy | Healthchecks pass |
| 6d | Trigger orchestrator run inside Docker | Payments flow |
| 6e | Dashboard accessible at `localhost:3000` | Full E2E works |

---

## Go/No-Go Gates

| Gate | After Step | Go Condition | No-Go Action |
|------|-----------|-------------|-------------|
| G1 | Step 1a | `npm install` exits 0 | Examine peer dep errors, pin versions |
| G2 | Step 1f | Wallet funded ($5 USDC) | Wait 30 min, try backup faucet, DM Circle Discord |
| G3 | Step 3c | First tx hash on arcscan | Check RPC, try $0.001 amount, check Gateway API status |
| G4 | Step 2d | All 4 agents healthy | Run in passthrough mode (no circlekit) |
| G5 | Step 6b | Docker all healthy | Fall back to local terminal execution |

---

## Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Faucet rate-limited/slow | 40% | Blocks funding | Request early; have backup wallet |
| Gateway batches payments → fewer tx hashes | 50% | Misses PRD-05 | Use Supabase event count as primary metric; loop mode for volume |
| `circlekit` not on PyPI | 70% | Agents passthrough only | Expected and acceptable; buyer-side payments still work |
| npm peer dep conflict | 30% | Blocks install | Use `--legacy-peer-deps` |
| Docker networking issues | 25% | E2E fails in Docker | Fall back to local terminals |
| Supabase Realtime not enabled | 80% | Dashboard appears static | Polling still works (3s interval); enable Realtime manually |

---

## Changes Tracking

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec from RALPLAN consensus | Phase 3 planning |
