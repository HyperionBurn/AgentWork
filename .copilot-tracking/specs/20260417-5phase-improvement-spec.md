# SPEC: 5-Phase Improvement Plan

## Status: APPROVED (RALPLAN Consensus)
## Owner: AgentWork Team
## Created: 2026-04-17
## Updated: 2026-04-17

### Problem

The AgentWork hackathon project has working infrastructure but needs polish, real-time features, contract integration, and demo resilience to maximize submission quality and differentiate from other Arc submissions.

### Acceptance Criteria

- [ ] Dashboard shows real-time updates via Supabase subscriptions (not polling)
- [ ] Agent responses are structured, typed, and context-aware
- [ ] Real Vyper contracts deployed to Arc testnet (behind feature flags)
- [ ] Orchestrator retries failed payments automatically
- [ ] Session evidence files capture 60+ verified transactions
- [ ] One-click demo launch script works end-to-end
- [ ] Submission materials are judge-ready
- [ ] Zero regressions — every phase independently deployable

### Technical Design

```
Phase 1: Dashboard Real-Time + UI Polish
  - page.tsx: Supabase Realtime subscriptions + polling fallback
  - gateway-balance route or Supabase gateway_state table
  - AgentCard: live earnings/tasksCompleted from Supabase
  - TaskFeed/TxList: CSS slide-in + status transition animations
  - EconomicChart: live accumulated cost prop

Phase 2: Agent Intelligence Layer
  - orchestrator/src/types.ts: AgentResponse, ResearchResult, CodeResult, TestResult, ReviewResult
  - agents/*/server.py: Structured mock outputs per agent type
  - decomposer.ts: context field on dependent subtasks
  - executor.ts: context map for inter-subtask data passing

Phase 3: Real Contract Integration
  - config.ts: isContractDeployed() feature flag
  - contracts/script/deploy.py: Real Moccasin deployment
  - contracts.ts: Real viem calls when addresses configured
  - index.ts: Full escrow lifecycle wired

Phase 4: Demo Resilience + Metrics
  - executor.ts: executePaymentWithRetry() with exponential backoff
  - session-recorder.ts: JSON evidence file writer
  - scripts/demo.ps1: One-click launch
  - index.ts: Cost accumulator + comparison table

Phase 5: Submission Excellence
  - scripts/collect-evidence.ts: Evidence pack generator
  - docs/circle-product-feedback.md: Real SDK feedback
  - README.md: Final submission content
  - docs/demo-script.md: Judge-ready demo script
```

### Dependencies

- Phase 1: Supabase Realtime enabled on task_events (already configured)
- Phase 2: Independent (can run in parallel with Phase 1)
- Phase 3: Phase 2 complete (executor context passing); Arc testnet wallet funded
- Phase 4: Phase 2 complete (executor modifications)
- Phase 5: All prior phases complete

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supabase Realtime disconnects | Medium | Low | Polling fallback maintained |
| Contract deployment fails | Medium | Medium | Feature flag falls back to mock; contracts are P1 |
| Agent response shape change breaks orchestrator | Low | High | Additive-only changes; existing fields preserved |
| Demo script timing off | Low | Low | Practice runs; pre-recorded backup |
| Phase 3 blocks Phase 4 | Medium | Low | Phase 3 is optional; Phase 4 works without contracts |

### Architect Modifications Applied

- M1: Use existing subscribeToTasks() in page.tsx
- M2: Shared types.ts file in orchestrator
- M3: Feature flag for contract deployment state
- M4: Retry in executor.ts per-payment, not per-run
- M5: Session recorder writes to evidence/ directory
- M6: Decomposer context param for task chaining
- M7: Live gateway balance in dashboard

### Critic Modifications Applied

- C1: Phase ordering accounts for dependencies
- C2: Each phase independently deployable
- C3: isContractDeployed() centralizes contract state checks
- C4: Agent response changes are additive-only
- C5: Evidence files written to gitignored evidence/ directory
- C6: Each phase targets ≤8 files

### Changes Tracking

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-17 | Created spec via RALPLAN consensus | Planner (Option B) + Architect (M1-M7) + Critic (C1-C6) |
