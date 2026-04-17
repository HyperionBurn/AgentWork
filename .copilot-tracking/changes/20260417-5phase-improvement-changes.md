# Changes Tracking: 5-Phase Improvement Plan

## Phase 1: Dashboard Real-Time + UI Polish
- [ ] 1.1 Wire Supabase Realtime subscriptions in page.tsx
- [ ] 1.2 Add live gateway balance widget
- [ ] 1.3 Upgrade AgentCard with live earnings/tasksCompleted
- [ ] 1.4 Add task flow animations
- [ ] 1.5 Update EconomicChart with live accumulated cost

## Phase 2: Agent Intelligence Layer
- [ ] 2.1 Define shared response types in orchestrator/src/types.ts
- [ ] 2.2 Upgrade Flask agents with structured mock outputs
- [ ] 2.3 Add context-aware task chaining in decomposer.ts
- [ ] 2.4 Update executor.ts for context passing between subtasks

## Phase 3: Real Contract Integration
- [ ] 3.1 Add isContractDeployed() feature flag to config.ts
- [ ] 3.2 Deploy contracts to Arc testnet (requires funded wallet)
- [ ] 3.3 Wire real viem contract calls in contracts.ts
- [ ] 3.4 Update orchestrator escrow lifecycle

## Phase 4: Demo Resilience + Metrics
- [ ] 4.1 Add retry logic with exponential backoff to executor.ts
- [ ] 4.2 Add session recorder writing to evidence/ directory
- [ ] 4.3 Create one-click demo launch script (scripts/demo.ps1)
- [ ] 4.4 Add cost accumulator and comparison table

## Phase 5: Submission Excellence
- [ ] 5.1 Create evidence collector script
- [ ] 5.2 Write Circle Product Feedback document
- [ ] 5.3 Update README with final submission content
- [ ] 5.4 Create judge-ready demo script
