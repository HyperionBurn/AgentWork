<!-- markdownlint-disable-file -->

# Task Details: 18-Feature Economy/QoL/Arc Mega-Implementation

## Research Reference

**Source Spec**: #file:../specs/20260418-18feature-ralplan-spec.md

---

## Phase 1: P0 Features (Core Demo Value)

### Task 1.1: Q4 — Smart Retry & Fallback

Circuit breaker pattern for agent calls with automatic fallback to next-best agent when primary fails.

- **Files**:
  - `packages/orchestrator/src/retry.ts` (CREATE) — CircuitBreaker state machine, retry wrapper, fallback chain
  - `packages/orchestrator/src/executor.ts` (EDIT) — Import and wrap executePayment with executeWithRetry
  - `packages/orchestrator/src/config.ts` (EDIT) — Add `useSmartRetry: process.env.USE_SMART_RETRY !== "false"`
- **Implementation**:
  - `CircuitBreaker` tracks failures per agentType: 3 failures in 60s → state="open"
  - `executeWithRetry(fn, agentType, maxRetries=2)` — retries on failure, checks circuit before attempting
  - `getFallbackAgent(primaryType)` — returns next agent in chain: research↔review, code↔research, test↔code, review↔test
  - `isAvailable(agentType)` — returns false if circuit is "open"
  - `getCircuitBreakerStates()` — returns all circuit states for dashboard
- **Success**:
  - `npx tsc --noEmit` passes on orchestrator
  - executePayment retries up to 2 times on failure
  - Circuit breaker opens after 3 consecutive failures
  - Fallback chain returns valid alternative agent type
- **Dependencies**: None

### Task 1.2: Q5 — Cost Estimator

Pre-flight cost estimation before committing funds. Shows breakdown by agent, complexity, and total.

- **Files**:
  - `packages/orchestrator/src/cost-estimator.ts` (CREATE) — estimateTaskCost, formatEstimate
  - `packages/orchestrator/src/config.ts` (EDIT) — Add `useCostEstimator: process.env.USE_COST_ESTIMATOR !== "false"`
- **Implementation**:
  - `estimateTaskCost(description, decomposition?)` — if decomposition exists, use exact prices; otherwise estimate from keywords
  - Keyword-based agent matching (same pattern as marketplace/discovery.ts)
  - Complexity scoring (reuse economy/pricing.ts multipliers)
  - Confidence interval: ±20% around estimate
  - `formatEstimate(estimate)` — returns human-readable string: "Estimated: $0.035 (7 agent calls, ~11 on-chain txns)"
- **Success**:
  - Returns CostEstimate for any task description
  - Estimates are within ±50% of actual cost (for demo purposes)
- **Dependencies**: None

### Task 1.3: E2 — Escrow Refund Automation

Auto-refund mechanism for failed/disputed tasks. Time-locked release of funds back to buyer.

- **Files**:
  - `packages/orchestrator/src/economy/refunds.ts` (CREATE) — processAutoRefund, checkRefundEligibility, startRefundTimer
  - `packages/orchestrator/src/contracts.ts` (EDIT) — Add `refundEscrow(taskId, reason)` function
  - `packages/orchestrator/src/contracts-client.ts` (EDIT) — Add `refund` to ESCROW_ABI
  - `packages/orchestrator/src/config.ts` (EDIT) — Add `useAutoRefund: process.env.USE_AUTO_REFUND !== "false"`
- **Implementation**:
  - `refundEscrow(taskId, reason)` — on-chain call to AgentEscrow.refund() if contract deployed
  - Mock fallback: returns MOCK_ tx hash with reason
  - `processAutoRefund(taskId, reason)` — checks eligibility, processes refund, logs to Supabase
  - `checkRefundEligibility(taskId)` — task must be in "disputed" or "failed" state
  - `startRefundTimer(taskId, timeoutSeconds=300)` — auto-refund after timeout if not resolved
  - `processFailedTaskRefunds(results, taskId)` — batch refund for all failed agents in a run
- **Success**:
  - Failed tasks get auto-refund tx hash
  - Refund timer fires after timeout
  - Contract ABI includes refund function
- **Dependencies**: Existing contracts.ts, contracts-client.ts

### Task 1.4: A1 — Gas Cost Dashboard

Live comparison of Arc gas costs vs simulated Ethereum/L2 costs. Proves Arc's cost advantage.

- **Files**:
  - `packages/dashboard/components/GasDashboard.tsx` (CREATE) — Comparison chart component
  - `packages/dashboard/app/api/gas-costs/route.ts` (CREATE) — Gas cost data API
  - `packages/orchestrator/src/config.ts` (EDIT) — Add `useGasDashboard` flag
- **Implementation**:
  - API route: GET returns `{ arc: { perTx, total, txCount }, arbitrum: {...}, ethereum: {...}, savings: { vsArbitrum, vsEthereum } }`
  - Arc costs: real data from tx hashes (or $0.001/tx baseline)
  - Arbitrum: simulated $0.10/tx
  - Ethereum: simulated $2.50/tx
  - Component: 3-column comparison with animated counter + savings badge
- **Success**:
  - Shows real-time gas comparison
  - Savings calculated correctly
- **Dependencies**: None

### Task 1.5: Q2 — Enhanced Real-Time Stream

Upgrade existing SSE endpoint to push richer events (payments, gas, agent status, revenue ticks).

- **Files**:
  - `packages/dashboard/app/api/stream/route.ts` (EDIT) — Add new event types
  - `packages/dashboard/app/page.tsx` (EDIT) — Subscribe to new event types
- **Implementation**:
  - New SSE event types: `payment_confirmed`, `gas_update`, `agent_status`, `revenue_tick`, `refund_processed`
  - Enhanced heartbeat includes all agent statuses + recent tx count
  - Dashboard page subscribes and updates state reactively
  - Fallback: existing polling still works if SSE disconnects
- **Success**:
  - New event types transmitted
  - Dashboard updates in real-time when events arrive
- **Dependencies**: Existing stream/route.ts

### Task 1.6: Q6 — Export/Share Session

Generate shareable evidence package with all tx hashes, task breakdown, and cost analysis.

- **Files**:
  - `packages/dashboard/components/SessionExport.tsx` (CREATE) — Export button + modal
  - `packages/dashboard/app/api/session-export/route.ts` (CREATE) — Session data API
- **Implementation**:
  - API route: reads from Supabase task_events + aggregates session data
  - Returns JSON + HTML formatted summary
  - Component: "📤 Export" button in dashboard header
  - Export includes: all tx hashes with arcscan links, cost breakdown, agent stats, timeline
  - Copy-to-clipboard for shareable link
- **Success**:
  - Export button produces valid JSON
  - All tx hashes included in export
- **Dependencies**: Existing Supabase integration

### Task 1.7: Phase 1 Integration

Wire all P0 features into orchestrator and dashboard.

- **Files to edit**:
  - `packages/orchestrator/src/index.ts` — Add P0 feature hooks in runOnce()
  - `packages/orchestrator/src/config.ts` — All P0 flags
  - `packages/dashboard/app/page.tsx` — Add GasDashboard + SessionExport
  - `packages/orchestrator/src/economy/index.ts` — Export refunds
- **Steps**:
  1. Add all P0 feature flags to config.ts
  2. In index.ts runOnce(): before deposit, show cost estimate; after execution, process refunds for failures; retry logic in executor
  3. In page.tsx: add `<GasDashboard />` in right column, `<SessionExport />` in header
  4. Run `npx tsc --noEmit` on both packages
- **Success**:
  - Both packages pass TypeScript
  - Dashboard renders all new components
  - Orchestrator executes P0 features when enabled

---

## Phase 2: P1 Features (Economy Depth)

### Task 2.1: E1 — Subscription Tiers

Tiered pricing for agents with different capabilities and rate limits.

- **Files**:
  - `packages/orchestrator/src/economy/tiers.ts` (CREATE)
  - `packages/dashboard/components/TierSelector.tsx` (CREATE)
- **Implementation**:
  - TierLevel: "basic" | "premium" | "enterprise"
  - basic: 1x price, 10 calls/min, standard capabilities
  - premium: 4x price, 30 calls/min, priority routing + advanced capabilities
  - enterprise: 10x price, unlimited, dedicated agent + SLA
  - `getTieredPrice(base, tier)` applies multiplier
  - TierSelector: dropdown in agent card, shows price difference
- **Dependencies**: economy/pricing.ts, AgentCard.tsx

### Task 2.2: E5 — Slashing & Insurance Fund

Stake-based agent accountability with slashing for bad behavior and insurance for affected users.

- **Files**:
  - `packages/orchestrator/src/economy/slashing.ts` (CREATE)
  - `packages/contracts/src/AgentStaking.vy` (CREATE)
- **Implementation**:
  - AgentStaking.vy: stake(amount), slash(agent, amount, reason), withdraw(), getStake(agent)
  - slashing.ts: stakeAgent, slashAgent, getStakeInfo, compensateUser, calculateSlashAmount
  - Mock fallback when contract not deployed
  - Slash amounts: minor offense = 5%, major = 20%, critical = 50%
- **Dependencies**: contracts.ts pattern, config.ts

### Task 2.3: E3 — Revenue Streaming

Tick-based micro-drip payments that accumulate while an agent is "working."

- **Files**:
  - `packages/orchestrator/src/economy/streaming.ts` (CREATE)
- **Implementation**:
  - PaymentStream state: agentType, ratePerSecond, startTime, payments[]
  - `startStream(agentType, rate)` — creates stream, ticks every 1s
  - `stopStream(streamId)` — stops ticking, returns total
  - `tickStream(streamId)` — records $0.001 payment, returns mock tx hash
  - Mock only — generates MOCK_ tx hashes for each tick
  - Stream counter visible on dashboard
- **Dependencies**: economy/index.ts, config.ts

### Task 2.4: A6 — Agent Staking Portal

Dashboard component showing staked amounts, slash history, and unstake controls.

- **Files**:
  - `packages/dashboard/components/AgentStaking.tsx` (CREATE)
  - `packages/dashboard/app/api/staking/route.ts` (CREATE)
- **Implementation**:
  - Shows per-agent: staked amount, slash count, eligibility status
  - "Stake" / "Unstake" buttons (mock transactions)
  - Slash history timeline
- **Dependencies**: economy/slashing.ts

### Task 2.5: Q1 — Task Templates Library

Pre-built task templates for common use cases with preset agent chains.

- **Files**:
  - `packages/dashboard/components/TaskTemplates.tsx` (CREATE)
- **Implementation**:
  - 7 templates: Build REST API, Write Tests, Security Audit, Research Report, Code Review, Full Pipeline, Documentation
  - Each shows: name, description, agent chain, estimated cost, estimated time
  - One-click to populate task input
- **Dependencies**: None

### Task 2.6: Q3 — Agent Comparison View

Side-by-side agent comparison matrix.

- **Files**:
  - `packages/dashboard/components/AgentComparison.tsx` (CREATE)
- **Implementation**:
  - Matrix: rows=metrics (price, speed, reputation, capabilities, stake, tier), columns=agents
  - Color-coded cells (green=best, red=worst)
  - Fetches data from /api/marketplace + /api/revenue
- **Dependencies**: marketplace API, revenue API

### Task 2.7: Phase 2 Integration

- Wire P1 features into orchestrator and dashboard
- Add all P1 feature flags
- Update economy/index.ts barrel exports
- TypeScript validation

---

## Phase 3: P2 Features (Arc-Specific & Stretch)

### Task 3.1: A2 — Wallet Connection (WAGMI)

Browser wallet connection for user-funded tasks.

- **Files**:
  - `packages/dashboard/lib/wallet.ts` (CREATE) — wagmi config for Arc testnet
  - `packages/dashboard/components/WalletConnect.tsx` (CREATE) — connect button + balance display
- **Implementation**:
  - wagmi config: chain=arcTestnet (custom chain def), transports=http(rpcUrl)
  - ConnectButton: shows address + USDC balance when connected
  - Gate task submission behind wallet connection when enabled
- **Dependencies**: wagmi, @rainbow-me/rainbowkit (npm install)

### Task 3.2: E6 — Batch Auction Settlement

Auction-based batch settlement where lowest bidder wins.

- **Files**:
  - `packages/orchestrator/src/economy/auction.ts` (CREATE)
- **Implementation**:
  - `createBatchAuction(tasks, minPrice)` — creates auction
  - `submitBid(auctionId, agentType, price)` — agent bids
  - `settleAuction(auctionId)` — lowest bidder wins, single settlement tx
  - Mock: simulate 3 bids per task, select lowest

### Task 3.3: E4 — Multi-Token Pricing

Support for multiple payment tokens on Arc.

- **Files**:
  - `packages/orchestrator/src/economy/multi-token.ts` (CREATE)
- **Implementation**:
  - `SUPPORTED_TOKENS`: USDC (primary), plus mock tokens
  - `convertToUsdc(amount, token)` — mock conversion rates
  - `formatTokenAmount(amount, token)` — human-readable with symbol

### Task 3.4: A4 — Batch Proof Verification

Merkle proof that N payments occurred, verifiable in a single on-chain tx.

- **Files**:
  - `packages/orchestrator/src/economy/merkle-proofs.ts` (CREATE)
- **Implementation**:
  - `buildMerkleTree(txHashes)` — builds Merkle tree from tx hashes
  - `generateProof(txHash, tree)` — generates inclusion proof
  - `verifyBatch(txHashes, root)` — verifies all payments against root
  - `submitBatchProof(root)` — on-chain submission (mock)

### Task 3.5: A3 — On-Chain Governance

Token-weighted voting on agent parameters.

- **Files**:
  - `packages/contracts/src/Governance.vy` (CREATE)
  - `packages/orchestrator/src/economy/governance.ts` (CREATE)
- **Implementation**:
  - Governance.vy: propose(parameter, newValue), vote(proposalId, support), execute(proposalId)
  - governance.ts: createProposal, castVote, executeProposal, getProposalState
  - Mock: simulate proposals for agent pricing + new agent approval

### Task 3.6: A5 — Cross-Chain Bridge Status

Circle CCTP bridge status display.

- **Files**:
  - `packages/dashboard/components/BridgeStatus.tsx` (CREATE)
  - `packages/dashboard/app/api/bridge-status/route.ts` (CREATE)
- **Implementation**:
  - Mock bridge status: "USDC bridged from Ethereum → Arc"
  - Shows: source chain, destination chain, amount, status, ETA
  - Animated progress bar

### Task 3.7: Phase 3 Integration + Final Validation

- Add all P2 feature flags
- Wire P2 features into orchestrator/dashboard
- Full TypeScript validation on both packages
- Update memory/repo/architecture.md with all 18 features
- Verify dashboard renders all components

---

## Dependencies

- Node.js 18+ with npm workspaces
- TypeScript 5.5+
- Next.js 14 (dashboard)
- viem 2.x (orchestrator + wallet)
- @circle-fin/x402-batching 2.1.0
- wagmi 2.x + @rainbow-me/rainbowkit (P2 Task 3.1 only)
- Vyper 0.4.x + Moccasin (P1 Task 2.2, P2 Task 3.5 contracts)

## Success Criteria

- All 18 features implemented with mock-first fallback pattern
- 18 new feature flags in config.ts (all default ON for P0/P1, OFF for P2)
- Both packages pass `npx tsc --noEmit` with zero errors
- Dashboard renders all new components without runtime errors
- Orchestrator runOnce() executes all enabled features in order
- Memory updated with complete architecture notes
