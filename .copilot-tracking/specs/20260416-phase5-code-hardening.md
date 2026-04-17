# SPEC: Phase 5 — Code Hardening (Pre-Infrastructure)
## Status: APPROVED (RALPLAN Consensus — Planner ✓ Architect ✓ Critic ✓)
## Owner: AgentWork Team
## Created: 2026-04-16
## Updated: 2026-04-16

---

## Problem

Phase 4 code fixes (M1-M8, A1) are applied and TypeScript validates clean. However, a deep RALPLAN review found **4 blocking issues** that would produce zero on-chain transactions (B1), break Docker agent detection (B2), show wrong stats (B3), and display NaN on the dashboard (B4). Plus 4 high-priority issues that degrade demo quality.

---

## Acceptance Criteria

- [ ] All 4 Flask agents return HTTP 402 with x402 payment requirements in passthrough mode
- [ ] Docker agent-health route reads correct NEXT_PUBLIC_ env vars
- [ ] Orchestrator writes `status: "completed"` (not "paid") to Supabase
- [ ] Dashboard totalSpent parses amounts correctly (strips $ prefix)
- [ ] MOCK_ hashes show as "simulated" (not clickable arcscan links)
- [ ] Dashboard 402 challenge includes `extra` field for GatewayWalletBatched
- [ ] Subscription helpers null-guarded against missing Supabase
- [ ] .env.example includes all required variables (DEMO_TASK, DEMO_RUNS, GATEWAY_URL, *_AGENT_URL)
- [ ] Docker agent containers receive SELLER_WALLET for payTo in 402 responses
- [ ] Both packages pass `tsc --noEmit`

---

## Code Fixes Applied

### P0 — BLOCKING (Demo Cannot Succeed Without These)

| ID | Fix | Files | Status |
|----|-----|-------|--------|
| B1 | Agents return proper 402 in passthrough mode | All 4 `agents/*/server.py` | ✅ |
| B2 | agent-health reads NEXT_PUBLIC_ env vars | `dashboard/app/api/agent-health/route.ts` | ✅ |
| B3 | Orchestrator writes "completed" not "paid" | `orchestrator/src/executor.ts` | ✅ |
| B4 | parseFloat strips $ prefix | `dashboard/app/api/task-status/route.ts` | ✅ |

### P1 — HIGH (Degrades Demo Quality)

| ID | Fix | Files | Status |
|----|-----|-------|--------|
| H1 | MOCK_ hashes filtered from arcscan links | `TxList.tsx`, `TaskFeed.tsx` | ✅ |
| H3 | Missing env vars in .env.example | `.env.example` | ✅ |
| H4 | x402 402 response includes `extra` field | `dashboard/lib/x402.ts` | ✅ |

### P2 — MEDIUM (Polish)

| ID | Fix | Files | Status |
|----|-----|-------|--------|
| M1 | Subscription helpers null-guarded | `dashboard/lib/supabase.ts` | ✅ |
| M2 | Removed dead `getAgentBaseUrl()` | `dashboard/app/page.tsx` | ✅ |
| M4 | Removed unused SUPABASE_SERVICE_ROLE_KEY | `.env.example` | ✅ |

### Critic Modifications

| ID | Fix | Files | Status |
|----|-----|-------|--------|
| C1 | 402 helper inlined per agent (no shared module) | All 4 `agents/*/server.py` | ✅ |
| C2 | MOCK_ filtered in task-status totalTxns count | `dashboard/app/api/task-status/route.ts` | ✅ |
| C3 | SELLER_WALLET added to all agent Docker envs | `docker-compose.yml` | ✅ |
| C4 | TaskFeed amount double-prefix fix | `TaskFeed.tsx`, `TxList.tsx` | ✅ |
| C5 | Added `error` field to page.tsx TaskEvent type | `dashboard/app/page.tsx` | ✅ |

---

## Implementation Details

### B1: 402 Passthrough Mode (Critical)

**Before** (broken):
```python
if not gateway_middleware:
    return SimpleNamespace(...)  # Returns immediately, no payment
```

**After** (fixed):
```python
payment_header = request.headers.get("Payment-Signature")

if gateway_middleware:
    # Real circlekit middleware path
    ...

# Passthrough mode
if payment_header:
    # Payment retry accepted
    return SimpleNamespace(payer="0x_passthrough", ...)

# No payment — return 402 challenge
return jsonify({
    "error": "payment-required",
    "payment": {
        "scheme": "exact",
        "network": "eip155:5042002",
        "asset": "0x3600000000000000000000000000000000000000",
        "amount": price,
        "payTo": SELLER_ADDRESS,
        "maxTimeoutSeconds": 60,
        "extra": {
            "name": "GatewayWalletBatched",
            "version": "1",
            "verifyingContract": "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
        },
    },
}), 402
```

This matches the x402 protocol: orchestrator's `GatewayClient.pay()` receives the 402, reads payment requirements, creates authorization, retries with Payment-Signature header → agent accepts → SDK returns `PayResult.transaction` with on-chain tx hash.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| 402 format doesn't match SDK expectations | 30% | No on-chain txns | Test `gateway.pay()` against local agent first |
| SELLER_ADDRESS empty → payTo is "" in 402 | 20% | SDK rejects payment | Set SELLER_WALLET in .env |
| MOCK_ hash filtering misses edge cases | 10% | Shows dead links | All mock hashes use `MOCK_0x` prefix consistently |

---

## TypeScript Validation

- ✅ `packages/orchestrator`: `tsc --noEmit` passes
- ✅ `packages/dashboard`: `tsc --noEmit` passes

---

## Changes Tracking

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec from Phase 5 RALPLAN consensus | Pre-infrastructure code hardening |
| 2026-04-16 | B1-B4, H1-H4, M1-M4, C1-C5 fixes applied | All code gaps resolved |
