# SPEC: Phase 4 — Execution & Demo Readiness
## Status: APPROVED (RALPLAN Consensus — Planner ✓ Architect ✓ Critic ✓)
## Owner: AgentWork Team
## Created: 2026-04-16
## Updated: 2026-04-16

---

## Problem

Phase 3 blocking fixes (B1–B7) are complete and TypeScript validates clean. However, the system has **never been run end-to-end**. Infrastructure (Supabase, wallets, faucet) is unprovisioned, 8 additional code issues were found during RALPLAN review, and the demo is 4 days away.

---

## Acceptance Criteria

- [ ] `npm install` at root exits 0
- [ ] All 4 Python agents respond to `/health` with 200
- [ ] Dashboard at `localhost:3000` renders without crash (degraded mode OK)
- [ ] `GatewayClient.deposit("$1")` succeeds → verifiable arcscan tx
- [ ] `GatewayClient.pay(agentUrl)` succeeds → verifiable arcscan tx
- [ ] Dashboard task feed shows real orchestrator payments after a run
- [ ] TxList shows clickable arcscan links
- [ ] `DEMO_RUNS=10` produces 60+ `task_events` rows in Supabase
- [ ] `docker-compose up` runs all 6 services to healthy
- [ ] Demo video evidence captured in `docs/evidence/`

---

## Architecture Decision Record (RALPLAN-DR)

### Principles
1. **Real > Mock** — every transaction must be real on Arc testnet
2. **Vertical-First** — validate the full stack before optimizing any layer
3. **Fail-Fast on Infrastructure** — provision Supabase + wallet + faucet FIRST
4. **Docker is the Demo Target** — local dev proves correctness, Docker proves deployability
5. **Evidence Over Claims** — every milestone produces a screenshot or arcscan link

### Decision Drivers
| # | Driver | Why |
|---|--------|-----|
| D1 | **4 days until Day 0** | No time for iterative discovery |
| D2 | **60+ real on-chain transactions** | Hardest requirement, depends on faucet + gateway batching |
| D3 | **Zero E2E history** | Every integration point is unproven |

### Options Evaluated
| Option | Time | Risk | Key Tradeoff |
|--------|------|------|-------------|
| **A: Infrastructure-First Sprint** ⭐ | ~3.5 hrs | Medium | Fastest to working demo; contracts deferred |
| B: Contracts-First Vertical | ~7 hrs | High | Includes Vyper deployment; 2x time, unproven tooling |
| C: Parallel Tracks | ~4-5 hrs | Medium | Best of both; requires coordination overhead |

### ADR: Option A Selected
- **Why**: Timeline dominates. PRD-05 (60+ txns) solvable via `DEMO_RUNS=10` × 7 payments = 70 events.
- **Consequences**: Contracts (Vyper) are P1 stretch goal. If Option A completes early, attempt contract deployment.

---

## Code Fixes Applied (Step 0) — ALL DONE ✅

All 8 mandatory modifications from RALPLAN consensus have been applied and TypeScript validated:

| ID | Fix | Files | Status |
|----|-----|-------|--------|
| M1 | Server-side agent health proxy | `app/api/agent-health/route.ts` (NEW) + `page.tsx` | ✅ |
| M2 | CORS `after_request` on all Flask agents | All 4 `agents/*/server.py` | ✅ |
| M3 | Mock hash `MOCK_` prefix | `packages/orchestrator/src/contracts.ts` | ✅ |
| M4 | task-status null guard (Supabase) | `app/api/task-status/route.ts` | ✅ |
| M5 | Decomposer reads AGENT_ENDPOINTS prices | `packages/orchestrator/src/decomposer.ts` | ✅ |
| M6 | Remove circlekit from requirements.txt | All 4 `agents/*/requirements.txt` | ✅ |
| M7 | agent-stats null guard (Supabase) | `app/api/agent-stats/route.ts` | ✅ |
| M8 | `/health` endpoint already existed | All 4 agents (pre-existing) | ✅ N/A |
| A1 | `balances.gateway.available` null coalescing | `packages/orchestrator/src/index.ts` | ✅ |

**TypeScript**: Both `packages/dashboard` and `packages/orchestrator` pass `tsc --noEmit` cleanly.

---

## Execution Plan (Remaining Steps)

### Step 1: Infrastructure Setup — ~30 min

| # | Task | Verification |
|---|------|-------------|
| 1a | `npm install --legacy-peer-deps` at root | `ls node_modules/@circle-fin/x402-batching` exists |
| 1b | Create `.env` from `.env.example` | All required vars filled |
| 1c | Create Supabase project, run `schema.sql` | 3 tables visible, `error` column present |
| 1d | Enable Supabase Realtime on both event tables | Replication tab shows enabled |
| 1e | Generate orchestrator wallet via `viem generatePrivateKey()` | 66-char hex string |
| 1f | Fund wallet via Circle Faucet ($5 USDC) | `getBalances().wallet.formatted >= "$5"` |

**Go/No-Go Gate G1**: `npm install` exits 0 → proceed. Else: pin versions.
**Go/No-Go Gate G2**: Wallet funded → proceed. Else: wait 30 min, retry faucet, DM Circle Discord.

### Step 2: Agent Validation — ~15 min

| # | Task | Verification |
|---|------|-------------|
| 2a | Create Python venv, `pip install -r requirements.txt` per agent | No errors (circlekit removed!) |
| 2b | Start all 4 agents in separate terminals | No crash |
| 2c | `curl http://localhost:402{1,2,3,4}/health` | All return `{"status":"healthy"}` |
| 2d | Verify CORS headers | `curl -I -H "Origin: http://localhost:3000" http://localhost:4021/` shows CORS headers |

**Go/No-Go Gate G4**: All 4 agents healthy → proceed. Else: check Python version, port conflicts.

### Step 3: First Blockchain Payment — ~15 min

| # | Task | Verification |
|---|------|-------------|
| 3a | `cd packages/orchestrator && npx tsx src/index.ts` (1 run) | Deposit succeeds |
| 3b | Watch for `depositTxHash` in output | Valid 66-char hex |
| 3c | Open `https://testnet.arcscan.io/tx/{hash}` | Transaction visible |
| 3d | Watch for payment tx hashes (7 payments) | Each has `result.transaction` |
| 3e | Verify arcscan for 1+ payment tx hash | On-chain proof |
| 3f | Count distinct tx hashes | Report for batching assessment |

**Go/No-Go Gate G3**: First tx hash on arcscan → proceed. Else: check RPC, try smaller amounts.

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

**Go/No-Go Gate G5**: Docker all healthy → proceed. Else: fall back to local terminal execution.

### Step 7: Evidence & Demo Prep — ~30 min

| # | Task | Verification |
|---|------|-------------|
| 7a | Record arcscan links | ≥ 60 txns visible |
| 7b | Dashboard screenshots | All components rendered |
| 7c | Docker stack screenshot | All services healthy |
| 7d | Update README with live links | Demo-ready |

---

## Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Faucet rate-limited/slow | 40% | Blocks funding | Request early; have backup wallet |
| Gateway batches payments → fewer tx hashes | 50% | Misses PRD-05 | Use Supabase event count as primary metric; loop mode for volume |
| npm peer dep conflict | 30% | Blocks install | Use `--legacy-peer-deps` |
| Docker networking issues | 25% | E2E fails in Docker | Fall back to local terminals |
| Supabase Realtime not enabled | 80% | Dashboard static | Polling works (3s interval); enable Realtime manually |

---

## Changes Tracking

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec from Phase 4 RALPLAN consensus | Pre-demo execution planning |
| 2026-04-16 | M1-M8 + A1 fixes applied, TypeScript validated | Code readiness for infrastructure |

---

## Acceptance Criteria

- [ ] `npm install` at root exits 0
- [ ] All 4 Python agents respond to `/health` with 200
- [ ] Dashboard at `localhost:3000` renders without crash (degraded mode OK)
- [ ] `GatewayClient.deposit("$1")` succeeds → verifiable arcscan tx
- [ ] `GatewayClient.pay(agentUrl)` succeeds → verifiable arcscan tx
- [ ] Dashboard task feed shows real orchestrator payments after a run
- [ ] TxList shows clickable arcscan links
- [ ] `DEMO_RUNS=10` produces 60+ `task_events` rows in Supabase
- [ ] `docker-compose up` runs all 6 services to healthy
- [ ] Demo video evidence captured in `docs/evidence/`

---

## Architecture Decision Record (RALPLAN-DR)

### 1. Principles

1. **Real > Mock**: Every transaction must be real on Arc testnet. No faked hashes.
2. **Vertical-First**: Validate the full stack (wallet → pay → agent → Supabase → dashboard) before optimizing any layer.
3. **Fail-Fast on Infrastructure**: Provision Supabase + wallet + faucet FIRST — these are external dependencies with unknown lead times.
4. **Docker is the Demo Target**: Local dev proves correctness; Docker proves deployability. Both must work.
5. **Evidence Over Claims**: Every milestone produces a screenshot or arcscan link. Judges see proof, not promises.

### 2. Decision Drivers (Top 3)

| # | Driver | Why |
|---|--------|-----|
| D1 | **Timeline: 4 days until Day 0** | No time for iterative discovery. Must hit infrastructure setup immediately and resolve unknowns in the first 2 hours. |
| D2 | **60+ real on-chain transactions (PRD-05)** | This is the hardest requirement. It depends on faucet funding, gateway batching behavior, and orchestrator loop stability. |
| D3 | **Zero E2E history** | The system has never been run. Every integration point (SDK → gateway, gateway → agent, Supabase → dashboard) is unproven. |

### 3. Viable Options

---

#### Option A: Infrastructure-First Sprint (Recommended)

**Strategy**: Fix remaining code issues in parallel, then execute the full Phase 3 Steps 1-6 in order, starting with infrastructure provisioning.

**What gets done**:

| Phase | Task | Files | Time | Risk |
|-------|------|-------|------|------|
| 4A-0 | **Pre-flight code fixes** (see §4 below) | 6 files | 90 min | Low |
| 4A-1 | Infrastructure: npm install, .env, Supabase, wallet, faucet | `~/.env`, Supabase console | 30 min | Medium (faucet) |
| 4A-2 | Agent validation: Python venvs, health checks | `agents/*/` | 15 min | Low |
| 4A-3 | First blockchain payment: deposit + pay + arcscan verify | — | 15 min | High (gateway unknowns) |
| 4A-4 | Dashboard validation: dev server + live data | `packages/dashboard/` | 15 min | Low |
| 4A-5 | Scale to 60+ transactions: DEMO_RUNS=10 | — | 10 min | Medium (batching) |
| 4A-6 | Docker E2E: build + compose up | `docker-compose.yml`, `Dockerfile`s | 30 min | Medium (networking) |
| 4A-7 | Demo evidence: screenshots + video recording | `docs/evidence/` | 30 min | Low |
| **Total** | | | **~3.5 hrs** | |

**Pros**:
- Fastest path to a working demo
- Surfaces real integration bugs immediately
- Matches Phase 3 spec execution order (no re-planning needed)
- Docker E2E validates the full submission artifact

**Cons**:
- All-or-nothing: if infrastructure blocks (faucet, gateway), entire plan stalls
- No time for contract deployment (P1 items deferred)
- Agent CORS issue blocks dashboard health checks (but not payments)

---

#### Option B: Contracts-First Vertical

**Strategy**: Deploy Vyper contracts first, integrate viem contract calls, then run the x402 payment flow. Contracts add real on-chain txns to help hit PRD-05.

**What gets done**:

| Phase | Task | Files | Time | Risk |
|-------|------|-------|------|------|
| 4B-0 | Pre-flight code fixes (same as 4A-0) | 6 files | 90 min | Low |
| 4B-1 | Install Moccasin + Vyper, test contracts locally | `packages/contracts/` | 60 min | High (Vyper 0.4.x compat) |
| 4B-2 | Deploy IdentityRegistry + ReputationRegistry to Arc | `script/deploy.py` | 30 min | High (RPC, gas) |
| 4B-3 | Deploy AgentEscrow + PaymentSplitter | `script/deploy.py` | 20 min | Medium |
| 4B-4 | Replace mock contracts with real viem calls | `src/contracts.ts` | 90 min | High |
| 4B-5 | Infrastructure + agents + payments (same as 4A-1 to 4A-3) | — | 60 min | High |
| 4B-6 | Dashboard + scale + Docker (same as 4A-4 to 4A-6) | — | 60 min | Medium |
| 4B-7 | Demo evidence | — | 30 min | Low |
| **Total** | | | **~7 hrs** | |

**Pros**:
- Contract deployment satisfies PRD-08, PRD-09 (stretch goals)
- Real escrow + reputation txns add to the 60+ count
- More impressive demo (on-chain escrow lifecycle)

**Cons**:
- 2x the time of Option A
- Vyper/Moccasin setup is untested — could burn hours on tooling
- Contract deployment is P1, not P0 — doesn't gate submission
- If faucet is slow, contract deployment fails and burns the entire time budget

---

#### Option C: Parallel Tracks

**Strategy**: Split into two parallel tracks — Track 1 does infrastructure + payments + dashboard (like Option A), Track 2 does contract deployment. Only merge Track 2 if Track 1 succeeds.

**What gets done**:

| Track | Task | Time | Risk |
|-------|------|------|------|
| T1 | Code fixes + infra + agents + payments + dashboard + Docker | 3.5 hrs | Medium |
| T2 (parallel) | Moccasin setup + contract tests + deploy | 2.5 hrs | High |
| Merge | Integrate contracts into orchestrator (if T2 done) | 1 hr | Medium |
| **Total** | | **4-5 hrs** (wall clock) | |

**Pros**:
- Best of both: guarantees P0 via Track 1, attempts P1 via Track 2
- Contract work doesn't block demo path

**Cons**:
- Requires two people or context-switching
- Track 2 may produce nothing if tooling fails
- More complex coordination

### 4. Recommendation

**Choose Option A (Infrastructure-First Sprint)** with the following rationale:

1. **Timeline dominates**: 4 days is not enough for unproven Vyper tooling. Option A guarantees a working demo.
2. **PRD-05 is solvable without contracts**: 10 runs × 7 payments = 70 x402 transactions. Even with gateway batching, Supabase records 70 `task_events` rows.
3. **Contracts are explicitly P1** (AGENTS.md §6.2): "Nice-to-Have". The mock contract interactions in `contracts.ts` are acceptable for submission.
4. **Option B's 7-hour estimate is optimistic**: Vyper tooling + Arc RPC + gas mechanics could easily double this.

**If Option A completes with time to spare** (likely: Day 0 is April 20, we have 4 days), attempt contract deployment as a stretch goal.

---

## Remaining Code Issues (Not Caught by Phase 3)

Phase 3 focused on TypeScript compilation blockers. These issues are **runtime blockers** that Phase 3 did not address:

### R1: No CORS Headers on Python Agents (MEDIUM — blocks dashboard health checks)
**Files**: `agents/*/server.py` (all 4)
**Problem**: Dashboard's `checkAgents()` makes cross-origin `fetch()` from browser to `http://localhost:40XX/`. Flask returns no CORS headers → browser blocks the response → all agents show "offline".
**Impact**: Dashboard always shows all agents as offline, even when agents are running.
**Fix**: Add `@app.after_request` handler to inject CORS headers, or install `flask-cors`.
**Time**: 5 min per agent (20 min total)

### R2: Decomposer Hardcodes Prices (LOW — cosmetic inconsistency)
**File**: `packages/orchestrator/src/decomposer.ts` lines 38-76
**Problem**: All 7 subtasks use hardcoded `price: "$0.005"` instead of reading from `AGENT_ENDPOINTS[].price`. If env var changes price, decomposer ignores it.
**Impact**: If someone changes `RESEARCH_AGENT_PRICE=$0.010`, the orchestrator still sends `$0.005`.
**Fix**: Look up `AGENT_ENDPOINTS.find(a => a.type === type)?.price || "$0.005"`.
**Time**: 10 min

### R3: Mock Contract Hashes Pollute TxList (MEDIUM — dashboard confusion)
**File**: `packages/orchestrator/src/contracts.ts` — `generateMockHash()` produces fake `0x...` hashes
**Problem**: `mockInteraction()` generates random 66-char hex strings. These are NOT recorded to Supabase (good), but `runOnce()` logs them as if they're real transactions and adds them to `totalTxns` count. The "On-chain transactions this run: ~N" log is misleading.
**Impact**: Console output claims more on-chain txns than actually exist. Won't confuse dashboard (not in Supabase) but confuses demo presenter.
**Fix**: Either (a) skip mock contract interactions entirely when `AGENT_ESCROW_ADDRESS` not set, or (b) clearly label them as "simulated" in logs.
**Time**: 10 min

### R4: Dashboard `checkAgents()` Fails Silently in Docker (LOW — edge case)
**File**: `packages/dashboard/app/page.tsx` lines ~82-99
**Problem**: Browser `fetch()` to `http://research-agent:4021/` works server-side but NOT from browser (Docker service names are not DNS-resolvable from host). The `NEXT_PUBLIC_*_AGENT_URL` env vars handle this, but the fallback `http://localhost:{port}` is used if env var is empty.
**Impact**: In Docker, dashboard browser can't reach agents via service names. Must use `http://localhost:4021` style URLs for browser.
**Fix**: For Docker, set `NEXT_PUBLIC_RESEARCH_AGENT_URL=http://localhost:4021` (not `http://research-agent:4021`). The build arg in docker-compose already sets the Docker-internal URL for SSR, but the client-side needs localhost. This may require a dual-mode config.
**Time**: 15 min (or accept as known limitation — dashboard health checks work in local dev)

### R5: `getAgentBaseUrl()` Environment Key Pattern (LOW — type safety)
**File**: `packages/dashboard/app/page.tsx` line ~73
**Problem**: `process.env[envKey]` where `envKey` is dynamically constructed. TypeScript can't verify the key exists. Works at runtime but no compile-time safety.
**Impact**: No bug, but fragile if env var naming changes.
**Fix**: Use explicit `process.env.NEXT_PUBLIC_RESEARCH_AGENT_URL` etc. with fallback.
**Time**: 5 min

### R6: `decomposeTask()` Always Returns 7 Subtasks (LOW — by design)
**File**: `packages/orchestrator/src/decomposer.ts`
**Problem**: Task decomposition is fully hardcoded. Every run produces the same 7 subtasks regardless of input.
**Impact**: By design for demo reliability. Not a bug. Documenting for awareness.

### R7: No `.env` File Exists (BLOCKING — execution prerequisite)
**Problem**: `.env.example` exists but `.env` has never been created. Every component requires env vars.
**Impact**: Nothing runs without it.
**Fix**: `cp .env.example .env` + fill in real values.
**Time**: Part of infrastructure setup (Step 1)

### R8: Supabase `task_events.amount` May Be NULL (LOW — edge case)
**File**: `packages/orchestrator/src/executor.ts`
**Problem**: Failed payments record `amount: subtask.price` (e.g., `"$0.005"`). Dashboard's `task-status` route does `parseFloat(t.amount || "0")`. If amount is somehow null in DB, this handles it gracefully.
**Impact**: Already handled. Documenting for awareness.

### R9: `x402.ts` PaymentInfo Type Not Exported from Package (MEDIUM — type gap)
**File**: `packages/dashboard/lib/x402.ts`
**Problem**: `PaymentInfo` interface is defined inline in `x402.ts` but `lib/index.ts` re-exports it as `export type { PaymentInfo } from "./x402"`. However, the actual interface fields (payer, payee, amount, formattedAmount, transactionHash, network) may not match what the SDK actually returns.
**Impact**: If SDK settles return different field names, `PaymentInfo` would have wrong data. TypeScript won't catch this because we define the type ourselves.
**Fix**: Verify against actual SDK settle result during first payment test. Adjust `PaymentInfo` fields if needed.
**Time**: 0 min (verify during testing)

### R10: `requirements.txt` Specifies `circlekit>=0.1.0` (LOW — likely unresolvable)
**File**: `agents/*/requirements.txt` (all 4)
**Problem**: circlekit is 70% likely NOT on PyPI. `pip install -r requirements.txt` will fail on this dependency.
**Impact**: Agents crash on startup unless circlekit is available OR we make it optional.
**Fix**: Change to `pip install flask python-dotenv` (skip circlekit). Agent code already has graceful fallback (try/except ImportError → passthrough mode).
**Time**: 5 min

---

## Execution Plan (Option A — Infrastructure-First Sprint)

### Step 0: Pre-Flight Code Fixes — ~90 min

| # | Fix | File(s) | Time | Severity |
|---|-----|---------|------|----------|
| 0a | Add CORS headers to all agents | `agents/*/server.py` | 20 min | MEDIUM |
| 0b | Fix `requirements.txt` to not require circlekit | `agents/*/requirements.txt` | 5 min | LOW |
| 0c | Fix decomposer to use AGENT_ENDPOINTS prices | `packages/orchestrator/src/decomposer.ts` | 10 min | LOW |
| 0d | Label mock contract interactions as simulated | `packages/orchestrator/src/contracts.ts` | 10 min | LOW |
| 0e | TypeScript re-validation | `npx tsc --noEmit` | 5 min | — |
| 0f | Create `docs/evidence/` directory for screenshots | `docs/evidence/.gitkeep` | 1 min | — |
| 0g | Verify `package.json` workspace globs match actual structure | `package.json` | 2 min | — |

### Step 1: Infrastructure Setup — ~30 min

| # | Task | Verification |
|---|------|-------------|
| 1a | `npm install --legacy-peer-deps` at root | `ls node_modules/@circle-fin/x402-batching` exists |
| 1b | `cp .env.example .env` + fill in all values | All required vars non-placeholder |
| 1c | Create Supabase project, run `schema.sql` | 3 tables visible, `error` column in `task_events` |
| 1d | Enable Supabase Realtime on `task_events` | Replication tab shows INSERT events |
| 1e | Generate orchestrator wallet: `npx viem generate-private-key` | 66-char hex string |
| 1f | Fund wallet via Circle Faucet (`$5+` USDC) | Faucet confirms, wait 30-60s for settlement |

**Go/No-Go Gate G1**: After 1f. If faucet fails, wait and retry. Hard deadline: 1 hour max before pivoting.

### Step 2: Agent Validation — ~15 min

| # | Task | Verification |
|---|------|-------------|
| 2a | Create Python venv per agent: `python -m venv .venv && .venv\Scripts\activate` | — |
| 2b | `pip install flask python-dotenv` (skip circlekit) | No errors |
| 2c | Start all 4 agents in separate terminals | No crash, passthrough mode OK |
| 2d | `curl http://localhost:4021/health` × 4 | All return `{"status":"healthy"}` |
| 2e | `curl http://localhost:4021/` | Returns agent metadata JSON |

### Step 3: First Blockchain Payment — ~15 min

| # | Task | Verification |
|---|------|-------------|
| 3a | `cd packages/orchestrator && npx tsx src/index.ts` (1 run, DEMO_RUNS=1) | No crash |
| 3b | Watch console for `depositTxHash` | Valid 66-char hex logged |
| 3c | Open `https://testnet.arcscan.io/tx/{hash}` | Transaction visible on explorer |
| 3d | Watch for 7 payment tx hashes (`result.transaction`) | Each logged with explorer URL |
| 3e | Click at least 1 payment tx on arcscan | On-chain proof confirmed |

**Go/No-Go Gate G2**: After 3e. If no tx hashes visible on arcscan, check:
- Gateway API status: https://status.circle.com
- Try `$0.001` instead of `$0.005`
- Check `getBalances()` output
- Wait 60s for settlement lag

### Step 4: Dashboard Validation — ~15 min

| # | Task | Verification |
|---|------|-------------|
| 4a | `cd packages/dashboard && npm run dev` | `localhost:3000` loads |
| 4b | Verify agent cards show online status (CORS fix needed) | Green indicators |
| 4c | Verify task feed shows payments from Step 3 | Non-empty list |
| 4d | Verify TxList shows arcscan links | Clickable URLs |
| 4e | Verify EconomicChart renders | PRD-07 satisfied |
| 4f | Screenshot dashboard | Save to `docs/evidence/` |

### Step 5: Scale to 60+ Transactions — ~10 min

| # | Task | Verification |
|---|------|-------------|
| 5a | `DEMO_RUNS=10 npx tsx src/index.ts` | 70 payment attempts |
| 5b | Verify Supabase `SELECT count(*) FROM task_events` | ≥ 60 rows |
| 5c | Verify dashboard shows updated feed | Scrollable task list |
| 5d | Count unique `gateway_tx` values | For PRD-05 evidence |
| 5e | Screenshot arcscan + dashboard | Save to `docs/evidence/` |

**Note on Gateway Batching**: If gateway batches multiple `pay()` calls into fewer on-chain settlements, we may get fewer unique tx hashes. The fallback metric is **Supabase `task_events` count** (which records every payment attempt regardless of batching). Target: 60+ events in Supabase, as many unique tx hashes as possible.

### Step 6: Docker Integration — ~30 min

| # | Task | Verification |
|---|------|-------------|
| 6a | `docker-compose build` | All 6 images build |
| 6b | `docker-compose up -d` | All containers start |
| 6c | `docker ps` — all healthy | Healthchecks pass |
| 6d | Dashboard accessible at `localhost:3000` | Page loads |
| 6e | Trigger orchestrator: `docker exec orchestrator npx tsx src/index.ts` | Payments flow |
| 6f | Verify end-to-end in Docker | Dashboard updates |

**Fallback**: If Docker networking fails (especially dashboard ↔ agent), fall back to local terminal execution. Docker is the ideal demo but not required for submission.

### Step 7: Demo Evidence — ~30 min

| # | Task | Verification |
|---|------|-------------|
| 7a | Screenshot: arcscan with 60+ transactions | Clear tx list visible |
| 7b | Screenshot: Dashboard with live task feed | Agents online, txns flowing |
| 7c | Screenshot: Economic comparison chart | PRD-07 visual proof |
| 7d | Screenshot: Agent health checks (4 online) | PRD-04 satisfied |
| 7e | Record 2-3 minute demo video (screen capture) | Shows full flow |
| 7f | Write submission text with links to evidence | Ready for Day 0 |

---

## Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Faucet rate-limited/slow | 40% | Blocks funding (D1) | Request early; have backup wallet; try alternate faucets |
| Gateway batches → fewer tx hashes | 50% | Misses PRD-05 literally | Use Supabase event count as primary; document batching behavior |
| circlekit not on PyPI | 70% | Agents passthrough only | Expected; fix `requirements.txt`; passthrough mode is acceptable |
| npm peer dep conflict | 30% | Blocks install (D2) | `--legacy-peer-deps` flag |
| CORS blocks dashboard health checks | 90% without fix | All agents show offline | Fixed in Step 0a |
| Supabase Realtime not enabled | 80% | Dashboard appears static | Polling (3s interval) works as fallback |
| Docker networking (service names) | 25% | Dashboard can't reach agents | Fall back to local terminals |
| `GatewayClient.pay()` throws on agent response format | 20% | Payment fails silently | Agent endpoints must return valid JSON; test with curl first |
| Arc RPC down/slow | 10% | All blockchain operations fail | Check status.arc.network; retry with backoff |

---

## Timeline (April 16-19, Pre-Hackathon)

| Day | Time Block | Focus | Deliverable |
|-----|-----------|-------|-------------|
| April 16 (today) | Step 0 + Step 1 | Code fixes + infrastructure | `.env` ready, Supabase provisioned, wallet funded |
| April 17 | Step 2 + Step 3 | Agents + first payment | First arcscan tx hash confirmed |
| April 18 | Step 4 + Step 5 | Dashboard + scale | 60+ transactions, dashboard live |
| April 19 | Step 6 + Step 7 | Docker + evidence | Demo video recorded, submission ready |
| April 20 (Day 0) | Buffer | Polish + submit | Submit to lablab.ai |

---

## Stretch Goals (If Time Permits)

| # | Goal | PRD | Time | Dependency |
|---|------|-----|------|-----------|
| S1 | Deploy IdentityRegistry.vy to Arc | PRD-10 | 60 min | Moccasin + Arc RPC |
| S2 | Deploy ReputationRegistry.vy | PRD-11 | 30 min | S1 address |
| S3 | Deploy AgentEscrow.vy | PRD-08 | 30 min | S1 address |
| S4 | Replace mock contracts with viem calls | — | 90 min | S3 address |
| S5 | Write Circle Product Feedback doc | PRD-13 | 60 min | None |
| S6 | Add Realtime subscription in dashboard | — | 20 min | Supabase Realtime enabled |

---

## Changes Tracking

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec from RALPLAN Planner | Phase 4 planning |
