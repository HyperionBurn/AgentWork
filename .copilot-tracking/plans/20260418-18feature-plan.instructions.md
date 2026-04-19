---
applyTo: ".copilot-tracking/changes/20260418-18feature-changes.md"
---

<!-- markdownlint-disable-file -->

# Task Checklist: 18-Feature Economy/QoL/Arc Mega-Implementation

## Overview

Implement 18 features across Economy, QoL, and Arc-specific categories in 3 phases (P0→P1→P2) with full mock-first fallbacks and feature-flag gating.

## Objectives

- All P0 features working end-to-end with dashboard components
- All P1 features integrated with existing economy/marketplace modules
- P2 features scaffolded and toggleable via config flags
- TypeScript passes on both orchestrator and dashboard packages
- Zero regression on existing features

## Research Summary

### Project Files

- `packages/orchestrator/src/config.ts` — Feature flags + agent endpoints
- `packages/orchestrator/src/index.ts` — Main execution flow (hooks for all features)
- `packages/orchestrator/src/executor.ts` — Payment execution (retry integration)
- `packages/orchestrator/src/contracts.ts` — Escrow + reputation (refund integration)
- `packages/orchestrator/src/economy/` — Existing economy modules (splitter, spending, pricing, a2a-chaining)
- `packages/orchestrator/src/marketplace/` — Existing marketplace modules (discovery, bidding, routing)
- `packages/dashboard/app/page.tsx` — Dashboard page (additive components)
- `packages/dashboard/app/api/stream/route.ts` — Existing SSE endpoint (enhance)
- `packages/contracts/src/` — Vyper contracts (add AgentStaking.vy, Governance.vy)

### External References

- #file:../specs/20260418-18feature-ralplan-spec.md — Full RALPLAN consensus spec with ADR

### Standards References

- #file:../../AGENTS.md — Project constraints, mock pattern, Arc constants

## Implementation Checklist

### [ ] Phase 1: P0 Features (Core Demo Value)

- [ ] Task 1.1: Q4 — Smart Retry & Fallback
  - Create `packages/orchestrator/src/retry.ts` (circuit breaker, retry wrapper, fallback chain)
  - Edit `packages/orchestrator/src/executor.ts` (wrap executePayment with retry)
  - Edit `packages/orchestrator/src/config.ts` (add `useSmartRetry` flag)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 1, Task 1.1)

- [ ] Task 1.2: Q5 — Cost Estimator
  - Create `packages/orchestrator/src/cost-estimator.ts` (pre-flight cost estimate)
  - Edit `packages/orchestrator/src/config.ts` (add `useCostEstimator` flag)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 1, Task 1.2)

- [ ] Task 1.3: E2 — Escrow Refund Automation
  - Create `packages/orchestrator/src/economy/refunds.ts` (auto-refund + timer)
  - Edit `packages/orchestrator/src/contracts.ts` (add refundEscrow function)
  - Edit `packages/orchestrator/src/contracts-client.ts` (add refund to ESCROW_ABI)
  - Edit `packages/orchestrator/src/config.ts` (add `useAutoRefund` flag)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 1, Task 1.3)

- [ ] Task 1.4: A1 — Gas Cost Dashboard
  - Create `packages/dashboard/components/GasDashboard.tsx` (comparison chart)
  - Create `packages/dashboard/app/api/gas-costs/route.ts` (gas data API)
  - Edit `packages/orchestrator/src/config.ts` (add `useGasDashboard` flag)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 1, Task 1.4)

- [ ] Task 1.5: Q2 — Enhanced Real-Time Stream
  - Edit `packages/dashboard/app/api/stream/route.ts` (add payment/gas/agent events)
  - Edit `packages/dashboard/app/page.tsx` (subscribe to enhanced SSE)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 1, Task 1.5)

- [ ] Task 1.6: Q6 — Export/Share Session
  - Create `packages/dashboard/components/SessionExport.tsx` (export button + modal)
  - Create `packages/dashboard/app/api/session-export/route.ts` (session data API)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 1, Task 1.6)

- [ ] Task 1.7: Phase 1 Integration
  - Edit `packages/orchestrator/src/index.ts` (hook all P0 features into runOnce)
  - Edit `packages/dashboard/app/page.tsx` (add GasDashboard + SessionExport to layout)
  - Run TypeScript validation on both packages
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 1, Task 1.7)

### [ ] Phase 2: P1 Features (Economy Depth)

- [ ] Task 2.1: E1 — Subscription Tiers
  - Create `packages/orchestrator/src/economy/tiers.ts` (tier config + pricing)
  - Create `packages/dashboard/components/TierSelector.tsx` (tier picker UI)
  - Edit `packages/orchestrator/src/economy/pricing.ts` (tier multiplier integration)
  - Edit `packages/orchestrator/src/config.ts` (add `useSubscriptionTiers` flag)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 2, Task 2.1)

- [ ] Task 2.2: E5 — Slashing & Insurance Fund
  - Create `packages/orchestrator/src/economy/slashing.ts` (slash + compensate)
  - Create `packages/contracts/src/AgentStaking.vy` (staking contract)
  - Edit `packages/orchestrator/src/config.ts` (add `useSlashing`, `useAgentStaking` flags + address)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 2, Task 2.2)

- [ ] Task 2.3: E3 — Revenue Streaming
  - Create `packages/orchestrator/src/economy/streaming.ts` (tick-based mock streaming)
  - Edit `packages/orchestrator/src/config.ts` (add `useRevenueStreaming` flag)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 2, Task 2.3)

- [ ] Task 2.4: A6 — Agent Staking Portal
  - Create `packages/dashboard/components/AgentStaking.tsx` (stake display)
  - Create `packages/dashboard/app/api/staking/route.ts` (staking API)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 2, Task 2.4)

- [ ] Task 2.5: Q1 — Task Templates Library
  - Create `packages/dashboard/components/TaskTemplates.tsx` (template gallery)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 2, Task 2.5)

- [ ] Task 2.6: Q3 — Agent Comparison View
  - Create `packages/dashboard/components/AgentComparison.tsx` (comparison matrix)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 2, Task 2.6)

- [ ] Task 2.7: Phase 2 Integration
  - Edit `packages/orchestrator/src/index.ts` (hook P1 features)
  - Edit `packages/dashboard/app/page.tsx` (add P1 components)
  - Run TypeScript validation
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 2, Task 2.7)

### [ ] Phase 3: P2 Features (Arc-Specific & Stretch)

- [ ] Task 3.1: A2 — Wallet Connection (WAGMI)
  - Create `packages/dashboard/lib/wallet.ts` (wagmi config)
  - Create `packages/dashboard/components/WalletConnect.tsx` (connect button)
  - Edit `packages/dashboard/package.json` (add wagmi deps)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 3, Task 3.1)

- [ ] Task 3.2: E6 — Batch Auction Settlement
  - Create `packages/orchestrator/src/economy/auction.ts` (batch auction logic)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 3, Task 3.2)

- [ ] Task 3.3: E4 — Multi-Token Pricing
  - Create `packages/orchestrator/src/economy/multi-token.ts` (multi-token support)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 3, Task 3.3)

- [ ] Task 3.4: A4 — Batch Proof Verification
  - Create `packages/orchestrator/src/economy/merkle-proofs.ts` (proof generation)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 3, Task 3.4)

- [ ] Task 3.5: A3 — On-Chain Governance
  - Create `packages/contracts/src/Governance.vy` (voting contract)
  - Create `packages/orchestrator/src/economy/governance.ts` (governance interaction)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 3, Task 3.5)

- [ ] Task 3.6: A5 — Cross-Chain Bridge Status
  - Create `packages/dashboard/components/BridgeStatus.tsx` (bridge display)
  - Create `packages/dashboard/app/api/bridge-status/route.ts` (bridge API)
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 3, Task 3.6)

- [ ] Task 3.7: Phase 3 Integration + Final Validation
  - Edit all integration points
  - Full TypeScript validation
  - Update memory with architecture notes
  - Details: .copilot-tracking/details/20260418-18feature-details.md (Phase 3, Task 3.7)

## Dependencies

- Node.js + npm workspaces
- TypeScript 5.5+
- Next.js 14 (dashboard)
- viem 2.x (orchestrator)
- @circle-fin/x402-batching 2.1.0
- wagmi + @rainbow-me/rainbowkit (P2 only — A2)
- Vyper 0.4.x + Moccasin (P1 E5, P2 A3 contracts)

## Success Criteria

- [ ] All 18 features implemented with mock-first fallback
- [ ] All feature flags present in config.ts
- [ ] Both packages pass `npx tsc --noEmit`
- [ ] Dashboard renders all new components without errors
- [ ] Orchestrator runOnce executes all enabled features
- [ ] At least 10 on-chain transaction types demonstrated
- [ ] Memory updated with new architecture notes
