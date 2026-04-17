---
applyTo: ".copilot-tracking/changes/20260417-5phase-improvement-changes.md"
---

<!-- markdownlint-disable-file -->

# Task Checklist: 5-Phase Improvement Plan

## Overview

A 5-phase upgrade to the AgentWork infrastructure that maximizes hackathon submission quality, adds real-time features, upgrades agent intelligence, wires real contract integration, and hardens the demo — all without breaking any existing functionality.

## Objectives

- Replace polling with Supabase Realtime subscriptions for live dashboard updates
- Upgrade agent responses from flat strings to structured, type-safe, context-aware outputs
- Deploy and integrate real Vyper contracts on Arc testnet (behind feature flags)
- Add retry logic, session recording, and one-click demo launch for demo resilience
- Produce a polished, judge-ready submission with evidence pack and Circle feedback

## Research Summary

### Project Files

- `packages/dashboard/app/page.tsx` — Main dashboard page, currently polls every 3s (line ~170), needs Realtime subscription wiring
- `packages/dashboard/lib/supabase.ts` — Already exports `subscribeToTasks()` and `subscribeToPayments()` but they're unused in page.tsx
- `packages/dashboard/components/AgentCard.tsx` — Static card, no earnings/tasksCompleted data flow from Supabase
- `packages/dashboard/components/TaskFeed.tsx` — Shows tasks but no animation or real-time push
- `packages/dashboard/components/EconomicChart.tsx` — Static comparison chart, no live cost data
- `packages/dashboard/components/TxList.tsx` — Shows transactions, could benefit from live push
- `packages/dashboard/lib/x402.ts` — Full x402 middleware with verify+settle, records to payment_events
- `packages/dashboard/app/api/task-status/route.ts` — Returns tasks + stats, used by polling
- `packages/dashboard/app/api/agent-stats/route.ts` — Paywalled endpoint, returns payment data
- `packages/orchestrator/src/executor.ts` — Sequential payment execution with 1.5s sleep, no retry
- `packages/orchestrator/src/decomposer.ts` — Hardcoded 7-subtask decomposition with dependsOn chains
- `packages/orchestrator/src/contracts.ts` — Mock contract interactions, graceful fallback when addresses not set
- `packages/orchestrator/src/config.ts` — ARC_CONFIG + AGENT_ENDPOINTS, env-driven
- `packages/orchestrator/src/supabase.ts` — Records task events, could also record session summaries
- `packages/orchestrator/src/index.ts` — Multi-run loop with DEMO_RUNS, balance check, deposit logic
- `packages/contracts/src/*.vy` — 5 Vyper contracts ready for deployment (IdentityRegistry, ReputationRegistry, AgentEscrow, PaymentSplitter, SpendingLimiter)
- `packages/contracts/tests/test_contracts.py` — 19 tests for 3 contracts (Phase 7)
- `agents/*/server.py` — 4 Flask agents with x402 passthrough, mock responses, CORS
- `docker-compose.yml` — Full stack with healthchecks, Docker DNS, build args
- `scripts/validate-env.ts` — Tiered env validation
- `scripts/smoke-test.ts` — Health checks for all services
- `scripts/dry-run.ts` — Mock server end-to-end test

### External References

- AGENTS.md §4 — Verified SDK API surface (GatewayClient, BatchFacilitatorClient)
- AGENTS.md §10.5 — EIP-3009 gateway batching behavior
- AGENTS.md §6.1 — PRD requirements P0 (PRD-01 through PRD-07) and P1 (PRD-08 through PRD-13)
- Supabase Realtime docs — `postgres_changes` channel subscription pattern (already implemented in supabase.ts)

### Standards References

- AGENTS.md §12.1 — TypeScript strict mode, named exports, no `any`, no `// @ts-ignore`
- AGENTS.md §12.2 — Python 3.11+, type hints, docstrings, specific exception catching
- AGENTS.md §12.3 — Vyper 0.4.x syntax, Snekmate for ERC base, assert() for invariants
- AGENTS.md §5.1 — Spec-driven development, every feature starts with a spec

## Implementation Checklist

### [ ] Phase 1: Dashboard Real-Time + UI Polish

- [ ] Task 1.1: Wire Supabase Realtime subscriptions in page.tsx
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 1–60)

- [ ] Task 1.2: Add live gateway balance widget to dashboard
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 61–110)

- [ ] Task 1.3: Upgrade AgentCard with live earnings/tasks data
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 111–155)

- [ ] Task 1.4: Add task flow animation (status transitions)
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 156–195)

- [ ] Task 1.5: Update EconomicChart with live accumulated cost
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 196–230)

### [ ] Phase 2: Agent Intelligence Layer

- [ ] Task 2.1: Define shared agent response types
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 231–280)

- [ ] Task 2.2: Upgrade all 4 Flask agents with structured outputs
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 281–340)

- [ ] Task 2.3: Add context-aware task chaining in decomposer
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 341–385)

- [ ] Task 2.4: Update executor to pass context between subtasks
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 386–430)

### [ ] Phase 3: Real Contract Integration

- [ ] Task 3.1: Add isContractDeployed() feature flag to config.ts
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 431–470)

- [ ] Task 3.2: Deploy contracts to Arc testnet (Moccasin)
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 471–510)

- [ ] Task 3.3: Wire real contract calls in contracts.ts
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 511–560)

- [ ] Task 3.4: Update orchestrator to use real escrow lifecycle
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 561–600)

### [ ] Phase 4: Demo Resilience + Metrics

- [ ] Task 4.1: Add retry logic with exponential backoff to executor
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 601–650)

- [ ] Task 4.2: Add session recorder (evidence file writer)
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 651–700)

- [ ] Task 4.3: Create one-click demo launch script
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 701–740)

- [ ] Task 4.4: Add cost accumulator and savings display
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 741–780)

### [ ] Phase 5: Submission Excellence

- [ ] Task 5.1: Create evidence collector script
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 781–820)

- [ ] Task 5.2: Write Circle Product Feedback document
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 821–855)

- [ ] Task 5.3: Update README with final submission content
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 856–885)

- [ ] Task 5.4: Create judge-ready demo script
  - Details: .copilot-tracking/details/20260417-5phase-improvement-details.md (Lines 886–920)

## Dependencies

- Node.js ≥ 18, npm workspaces
- Python 3.11+, Flask, python-dotenv
- Supabase project with Realtime enabled (payment_events + task_events)
- `@circle-fin/x402-batching` v2.1.0 + `viem` v2.x
- Moccasin + Vyper 0.4.x for contract deployment
- Arc testnet faucet USDC

## Success Criteria

- Dashboard updates in real-time without polling (Supabase Realtime active)
- Agent responses are structured, typed, and context-aware
- Real Vyper contracts deployed to Arc testnet with on-chain tx hashes
- Orchestrator retries failed payments automatically (3 attempts, backoff)
- Evidence directory contains JSON session logs with 60+ verified transactions
- `npm run demo` launches full stack and produces judge-visible output
- All existing tests still pass, no regressions
- README has final submission content, demo video placeholder, checklist complete