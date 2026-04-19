---
applyTo: ".copilot-tracking/changes/20260418-hyper-features-changes.md"
---

<!-- markdownlint-disable-file -->

# Task Checklist: AgentWork Hyper Features — Hackathon Landslide Win

## Overview

Implement 11 "Demo Weapon" hyper-features across 3 tiers to ensure AgentWork wins the Agentic Economy on Arc hackathon by a landslide, with real-time animated dashboard, one-click demo launcher, real LLM agent intelligence, live economic proof, transaction evidence gallery, agent performance metrics, smart contract deployment, and demo video infrastructure.

## Objectives

- Transform the dashboard from a static display into an interactive, animated, real-time demo weapon
- Replace all mock agent responses with real LLM-generated content when `LLM_API_KEY` is configured
- Provide undeniable economic proof that Arc nanopayments save 98%+ vs traditional payment rails
- Generate 60+ verifiable on-chain transactions with clickable arcscan.io evidence
- Deploy Vyper smart contracts (IdentityRegistry + ReputationRegistry) to Arc testnet
- Create a one-click demo experience that eliminates terminal dependency
- Produce a polished 3-minute demo video with chapter markers

## Research Summary

### Project Files

- `packages/orchestrator/src/config.ts` — 27 feature flags, ARC_CONFIG, AGENT_ENDPOINTS, CONTRACT_ADDRESSES, isContractDeployed()
- `packages/orchestrator/src/index.ts` — Main orchestrator entry, runOnce(), main(), DEMO_RUNS support, all economy hooks
- `packages/orchestrator/src/executor.ts` — initGateway(), depositFunds(), executeAllPayments(), executeAllPaymentsParallel()
- `packages/orchestrator/src/contracts.ts` — createEscrowTask(), claimEscrowTask(), completeEscrowTask(), submitReputation()
- `packages/dashboard/app/page.tsx` — Main dashboard, subscribes to Supabase Realtime, fetches task-status/agent-health/gateway-balance
- `packages/dashboard/components/TaskFeed.tsx` — Renders task events with status badges, arcscan links, animate-slide-in/pulse-glow classes
- `packages/dashboard/components/EconomicChart.tsx` — Cost comparison bars (static scenarios + optional liveCost prop)
- `packages/dashboard/components/AgentCard.tsx` — Agent cards with status, earnings, tasksCompleted
- `packages/dashboard/app/api/task-status/route.ts` — Free endpoint, returns tasks + aggregated stats (totalSpent, totalOnChainTransactions)
- `packages/dashboard/app/api/agent-stats/route.ts` — Paywalled agent stats endpoint (with withGateway)
- `packages/dashboard/app/api/agent-health/route.ts` — Server-side proxy for agent health checks
- `packages/dashboard/lib/supabase.ts` — Lazy Supabase client, subscribeToTasks(), TaskEvent/PaymentEvent types
- `packages/dashboard/app/globals.css` — CSS animations (slideInLeft, pulseGlow), dark theme variables
- `agents/*/server.py` — Flask agents with circlekit middleware, normalize_price(), CORS, agent metadata
- `agents/*/llm_client.py` — enrich_with_llm(), call_llm(), USE_REAL_LLM flag, openai client
- `packages/contracts/script/deploy.py` — Moccasin deploy script, deploy_all(), outputs contract addresses
- `packages/contracts/script/deploy_contracts.py` — Core deployment logic
- `packages/contracts/src/` — IdentityRegistry.vy, ReputationRegistry.vy, AgentEscrow.vy, PaymentSplitter.vy, SpendingLimiter.vy

### External References

- #file:../research/20260416-agentwork-ultimate-blueprint.md — Complete hackathon blueprint with architecture, economic proof, transaction flow
- #file:../research/20260416-hackathon-concept-comparative-analysis.md — Comparative analysis, 50+ transaction problem, SDK verification, competitive positioning
- #githubRepo:"circlefin/arc-nanopayments" x402 middleware GatewayClient BatchFacilitatorClient — Verified SDK patterns
- #githubRepo:"vyperlang/erc-8004-vyper" IdentityRegistry ReputationRegistry deployment order — Contract deployment patterns
- #githubRepo:"vyperlang/vyper-agentic-payments" agent marketplace Flask circlekit — Agent implementation patterns

### Standards References

- AGENTS.md §2 — Arc blockchain constants (chain ID 5042002, USDC, Gateway, Explorer)
- AGENTS.md §4 — Verified SDK API surface (GatewayClient, BatchFacilitatorClient, PaymentRequirements)
- AGENTS.md §10.6 — ERC-8004 deploy order: IdentityRegistry → ReputationRegistry(identity.address)
- AGENTS.md §10.2 — USDC 6 decimals, $0.005 = 5000 atomic units, use dollar strings with SDK
- AGENTS.md §10.3 — Transaction verification: result.transaction (NOT result.transactionHash)
- AGENTS.md §13 — Known issues: balances.gateway.formattedAvailable, DepositResult uses depositTxHash

## Implementation Checklist

### [ ] Phase A: Foundation + Validation (Day 0, April 20, ~6.5h)

- [ ] Task A.0: M5 Validation — Test 1 orchestrator run, count unique tx hashes
  - Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 16-55)
  - Run orchestrator with DEMO_RUNS=1, check output for unique tx hashes
  - Determine if 60 txns is achievable via payments alone or needs contract call fillers
  - Document findings for subsequent feature planning

- [ ] Task A.1: HF-3 — Real Agent Intelligence (LLM Integration)
  - Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 57-120)
  - Modify `agents/*/llm_client.py` — improve system prompts per agent type
  - Add `openai` to `agents/*/requirements.txt`
  - Modify `TaskFeed.tsx` — render agent responses in `<pre>` blocks (M3: no react-markdown)
  - Test: set LLM_API_KEY, run agent, verify unique context-aware responses
  - Gate: Agents return real LLM responses when LLM_API_KEY is set, fallback to hardcoded

- [ ] Task A.2: HF-2 — One-Click Demo Launcher
  - Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 122-210)
  - Create `packages/dashboard/app/api/demo-launch/route.ts` — POST spawns orchestrator, streams stdout
  - Create `packages/dashboard/components/DemoLauncher.tsx` — Big button, progress, cost accumulator
  - Modify `packages/dashboard/app/page.tsx` — add DemoLauncher in hero stats area
  - Security: input sanitization, AbortSignal cleanup, singleton process tracker (M1: local-dev-only)
  - Gate: Click button → orchestrator runs → 60 txns appear → cost accumulator updates

- [ ] Checkpoint A: Click button → real agents respond → transactions appear in feed

### [ ] Phase B: Visual + Proof (Day 1, April 21, ~7.5h)

- [ ] Task B.1: HF-1 — Live Transaction Waterfall
  - Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 212-275)
  - Add CSS keyframes `waterfall-slide` + `waterfall-glow` to `globals.css`
  - Modify `TaskFeed.tsx` — animated cascade, green ✅ for real hashes, amber ⏳ for MOCK_
  - Add debounce for rapid Supabase inserts (100ms batch flush)
  - Gate: Animated payment cascade with clickable arcscan links

- [ ] Task B.2: HF-4 — Economic Proof Engine
  - Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 277-330)
  - Redesign `EconomicChart.tsx` as "Live Economic Proof" with animated counters
  - Wire `stats.totalSpent` and `stats.totalOnChainTransactions` for real-time updates
  - Add animated counter using requestAnimationFrame
  - Gate: Numbers animate as transactions complete; savings % updates live

- [ ] Task B.3: HF-5 — Transaction Evidence Gallery
  - Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 332-390)
  - Create `packages/dashboard/app/evidence/page.tsx` — full-page evidence with filterable table
  - Create `packages/dashboard/app/api/evidence/route.ts` — query task_events, filter real hashes
  - Modify `page.tsx` — add "📊 View Evidence" link in header
  - Gate: 60+ real tx hashes visible, each linking to arcscan.io

- [ ] Task B.4: HF-6 — Agent Performance Metrics
  - Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 392-450)
  - Create `packages/dashboard/app/api/agent-metrics/route.ts` — FREE route, no withGateway (M2)
  - Modify `AgentCard.tsx` — add metrics section (tasks completed, earnings, success rate)
  - Skip response time metric (no started_at schema migration per M2)
  - Gate: Each agent shows real task count and earnings from actual runs

- [ ] Checkpoint B: Full dashboard demo with all TIER 1+2 visual features working

### [ ] Phase C: Contracts + Polish (Day 2, April 22, ~5.5h)

- [ ] Task C.1: HF-7 — Smart Contract Deployment
  - Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 452-520)
  - Pre-validate Moccasin/Vyper on Windows (M4) — test `moccasin --version` first
  - If Moccasin works: deploy IdentityRegistry → ReputationRegistry(identity.address)
  - If Moccasin fails: Docker-based deploy fallback or WSL
  - Update .env with deployed addresses
  - Verify contracts on arcscan.io
  - Gate: Contracts visible on arcscan.io, orchestrator interacts with real contracts

- [ ] Task C.2: HF-8 — Demo Video Infrastructure
  - Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 522-570)
  - Create `docs/demo-video-script.md` — scene-by-scene script with timing
  - Create `scripts/record-demo.ps1` — automated demo recording helper
  - Script structure: Hook (0:00) → Architecture (0:15) → Live Demo (0:45) → Evidence (1:45) → Economics (2:15) → Future (2:45)
  - Gate: Script ready for recording, covers all demo highlights in 3 minutes

- [ ] Task C.3: Buffer / TIER 3 features (pick from HF-9/10/11)
  - Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 572-650)
  - HF-9: Multi-Agent DAG Visualization (2.5h, Judge Impact 6/10)
  - HF-10: Arc Network Health Monitor (1.5h, Judge Impact 4/10)
  - HF-11: Interactive Agent Chat Preview (2.0h, Judge Impact 7/10)
  - Cut priority: HF-10 first → HF-9 second → keep HF-11 if time permits

- [ ] Checkpoint C: Contracts deployed, video script ready, buffer features selected

### [ ] Phase D: Demo + Submission (Day 3-4, April 23-24)

- [ ] Task D.1: Record demo video using HF-8 script
- [ ] Task D.2: Run 60+ transaction stress test, verify all arcscan links
- [ ] Task D.3: Polish dashboard layout, error boundaries, responsive design
- [ ] Task D.4: Submit to lablab.ai with demo video + GitHub repo + written submission

## Dependencies

- **Arc Testnet wallet funded** via faucet (https://faucet.circle.com) — USER ACTION before Day 0
- **LLM_API_KEY** set in .env for HF-3 (optional — falls back to hardcoded responses)
- **Supabase** project configured with `task_events` table for all dashboard features
- **Node.js** workspace (`npm install` from root) for dashboard + orchestrator
- **Python** virtual environments per agent for Flask servers
- **Moccasin + Vyper** installed for HF-7 contract deployment (may require WSL on Windows)
- **@circle-fin/x402-batching@^2.1.0** + peer deps (`@x402/core`, `@x402/evm`, `viem`) installed

## Success Criteria

- [ ] One-click demo launcher produces 60+ on-chain transactions visible in dashboard
- [ ] Transaction waterfall animates payments with arcscan.io links
- [ ] Economic proof engine shows real-time savings (Arc vs Stripe vs L2) updating live
- [ ] Evidence gallery page shows all real transactions with verification links
- [ ] Agent performance metrics display real task counts and earnings per agent
- [ ] Real LLM responses appear when LLM_API_KEY is configured (fallback to hardcoded)
- [ ] Smart contracts deployed to Arc testnet and visible on arcscan.io (if Moccasin works on Windows)
- [ ] Demo video script covers all highlights in under 3 minutes
- [ ] All TypeScript compiles clean (`npx tsc --noEmit` passes in dashboard and orchestrator)
- [ ] No hardcoded private keys or API tokens in source code
- [ ] All new constants use env vars from .env.example

## 5 Mandatory Modifications (Critic Consensus Requirements)

| # | Modification | Incorporated In |
|---|---|---|
| M1 | Demo Launcher = local-dev-only, no Docker cross-container spawn | Task A.2 |
| M2 | Skip response time metric (no started_at schema migration) | Task B.4 |
| M3 | Use `<pre>` blocks instead of react-markdown (bundle size) | Task A.1 |
| M4 | Pre-validate Moccasin/Vyper on Windows BEFORE committing 3h | Task C.1 |
| M5 | Run 1 test execution to verify tx hash count before building visuals | Task A.0 |

## Cut Priority (If Behind Schedule)

1. **HF-10** (Arc Health) — 4/10 judge impact, lowest ROI, cut first
2. **HF-9** (DAG Viz) — 6/10 impact, cut second
3. **HF-7** (Contracts) — 7/10 but HIGH variance (±1.5h), Windows risk
4. **HF-6** (Agent Metrics) — 6/10, good but not jaw-dropping
5. **HF-11** (Agent Chat) — 7/10, keep if possible

## Risk Assessment Matrix

| Risk | Probability | Impact | Mitigation |
|------|:---:|:---:|---|
| Wallet not funded (no real txns) | HIGH | CRITICAL | Fund Day 0 via faucet; pre-run + cache evidence |
| Moccasin/Vyper on Windows fails | 40% | 3h wasted | Pre-test first (M4); Docker fallback; contracts are P1 |
| 60+ unique tx hashes not achievable | MEDIUM | HIGH | Gateway batching may consolidate; add contract calls |
| Demo Launcher child_process issues | 50% | MEDIUM | Local-dev-only (M1); AbortSignal cleanup; terminal fallback |
| Supabase down during demo | LOW | HIGH | Pre-cached data; null guards; offline mode |
| Breaking existing functionality | MEDIUM | HIGH | Additive-only changes; `tsc --noEmit` after each feature |
| Total effort exceeds 24.5h realistic budget | MEDIUM | HIGH | TIER 3 optional; cut priority list above |