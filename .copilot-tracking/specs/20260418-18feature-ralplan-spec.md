# SPEC: 18-Feature Economy/QoL/Arc Mega-Implementation
## Status: APPROVED (RALPLAN Consensus)
## Owner: AgentWork Team
## Created: 2026-04-18
## Updated: 2026-04-18

---

## RALPLAN-DR Summary

### Principles
1. **Mock-first** — All features work with mock fallbacks; on-chain is enhancement not dependency
2. **Feature-flag gated** — Every new feature behind `FEATURES.useX` so demo stays stable
3. **Module-per-feature** — New code in dedicated files, barrel-exported, max 300 lines each
4. **Dashboard additive** — New components added to page, never replacing existing layout
5. **Orchestrator hook pattern** — New features hook into `runOnce()` via config flag checks

### Decision Drivers
1. **Demo impact** — Does it make judges go "wow"?
2. **Implementation speed** — Can it be built given the existing patterns?
3. **Dependency risk** — Does it require external services/tools not in stack?

### ADR: Decision
**Chosen: Option B — Tiered Implementation (P0/P1/P2)**
- **Why**: All 18 features are valuable but have different risk profiles. Tiering ensures P0s ship first and demo always works.
- **Alternatives considered**: Full 18 (too risky for demo stability), Top 6 only (leaves value on table)
- **Consequences**: More total files (~30 new files), but each is self-contained and can be toggled off

---

## Feature Priority Tiers

### P0 — Core Demo Value (standalone, no dependencies)
| ID | Feature | Module | New Files | Edits |
|----|---------|--------|-----------|-------|
| Q4 | Smart Retry & Fallback | `orchestrator/retry.ts` | 1 | executor.ts, index.ts |
| Q5 | Cost Estimator | `orchestrator/cost-estimator.ts` | 1 | index.ts |
| E2 | Escrow Refund Automation | `orchestrator/economy/refunds.ts` | 1 | contracts.ts, contracts-client.ts |
| A1 | Gas Cost Dashboard | `dashboard/components/GasDashboard.tsx` | 1 + API | — |
| Q2 | Real-Time Payment Stream (SSE) | (enhance existing `stream/route.ts`) | 0 | stream/route.ts, page.tsx |
| Q6 | Export/Share Session | `dashboard/components/SessionExport.tsx` + API | 2 | page.tsx |

### P1 — Economy Depth (depend on existing marketplace/economy modules)
| ID | Feature | Module | New Files | Edits |
|----|---------|--------|-----------|-------|
| E1 | Subscription Tiers | `orchestrator/economy/tiers.ts` | 1 + dashboard component | pricing.ts, AgentCard.tsx |
| E5 | Slashing & Insurance Fund | `orchestrator/economy/slashing.ts` + `contracts/src/AgentStaking.vy` | 2 | contracts.ts, config.ts |
| E3 | Revenue Streaming | `orchestrator/economy/streaming.ts` | 1 | executor.ts, index.ts |
| A6 | Agent Staking Portal | `dashboard/components/AgentStaking.tsx` + API | 2 | — |
| Q1 | Task Templates Library | `dashboard/components/TaskTemplates.tsx` | 1 + API | page.tsx |
| Q3 | Agent Comparison View | `dashboard/components/AgentComparison.tsx` | 1 | page.tsx |

### P2 — Arc-Specific & Stretch (nice-to-have, lower demo priority)
| ID | Feature | Module | New Files | Edits |
|----|---------|--------|-----------|-------|
| A2 | Wallet Connection (WAGMI) | `dashboard/lib/wallet.ts` + component | 2 | package.json, page.tsx |
| E6 | Batch Auction Settlement | `orchestrator/economy/auction.ts` | 1 | index.ts |
| E4 | Multi-Token Pricing | `orchestrator/economy/multi-token.ts` | 1 | pricing.ts |
| A4 | Batch Proof Verification | `orchestrator/economy/merkle-proofs.ts` | 1 | — |
| A3 | On-Chain Governance | `contracts/src/Governance.vy` + orchestrator module | 2 | — |
| A5 | Cross-Chain Bridge Status | `dashboard/components/BridgeStatus.tsx` + API | 2 | page.tsx |

---

## Implementation Phases

### Phase 1: P0 Features (6 features, ~14 new files)

#### 1.1 Q4 — Smart Retry & Fallback
**Files to create:**
- `packages/orchestrator/src/retry.ts` — Circuit breaker + retry logic

**Files to edit:**
- `packages/orchestrator/src/executor.ts` — Wrap `executePayment()` with retry
- `packages/orchestrator/src/index.ts` — Call retry-wrapped execution
- `packages/orchestrator/src/config.ts` — Add `useSmartRetry` flag

**Spec:**
```typescript
// retry.ts
interface CircuitBreaker {
  agentType: string;
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
}

// Track per-agent circuit breakers
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(agentType: string): CircuitBreaker;
export function recordFailure(agentType: string): void;
export function recordSuccess(agentType: string): void;
export function isAvailable(agentType: string): boolean;

export async function executeWithRetry(
  fn: () => Promise<PaymentResult>,
  agentType: string,
  maxRetries?: number,
): Promise<PaymentResult>;

export function getFallbackAgent(primaryAgent: string): string | null;
// Fallback chain: research → review, code → research, test → code, review → test
```

#### 1.2 Q5 — Cost Estimator
**Files to create:**
- `packages/orchestrator/src/cost-estimator.ts`

**Files to edit:**
- `packages/orchestrator/src/index.ts` — Pre-flight cost estimate before deposit
- `packages/orchestrator/src/config.ts` — Add `useCostEstimator` flag

**Spec:**
```typescript
// cost-estimator.ts
export interface CostEstimate {
  taskId: string;
  breakdown: Array<{
    agentType: string;
    basePrice: string;
    adjustedPrice: string;
    complexity: number;
  }>;
  totalEstimated: string;
  estimatedAgentCalls: number;
  estimatedOnChainTxns: number;
  confidenceInterval: { low: string; high: string };
}

export function estimateTaskCost(
  taskDescription: string,
  decomposition?: TaskDecomposition,
): CostEstimate;

export function formatEstimate(estimate: CostEstimate): string;
```

#### 1.3 E2 — Escrow Refund Automation
**Files to create:**
- `packages/orchestrator/src/economy/refunds.ts`

**Files to edit:**
- `packages/orchestrator/src/contracts.ts` — Add `refundEscrow()` function
- `packages/orchestrator/src/contracts-client.ts` — Add `refund` to ESCROW_ABI
- `packages/orchestrator/src/config.ts` — Add `useAutoRefund` flag

**Spec:**
```typescript
// economy/refunds.ts
export interface RefundResult {
  taskId: string;
  refundAmount: string;
  txHash: string;
  explorerUrl: string;
  reason: string;
  mock: boolean;
}

export async function processAutoRefund(
  taskId: string,
  reason: string,
): Promise<RefundResult>;

export async function checkRefundEligibility(
  taskId: string,
): Promise<{ eligible: boolean; reason?: string }>;

export function startRefundTimer(
  taskId: string,
  timeoutSeconds?: number,
): NodeJS.Timeout;

export async function processFailedTaskRefunds(
  results: PaymentResult[],
  taskId: string,
): Promise<RefundResult[]>;
```

#### 1.4 A1 — Gas Cost Dashboard
**Files to create:**
- `packages/dashboard/components/GasDashboard.tsx`
- `packages/dashboard/app/api/gas-costs/route.ts`

**Spec:**
```typescript
// GasDashboard.tsx — Live comparison chart
interface GasComparison {
  network: string;
  costPerTx: number;
  totalCost: number;
  txCount: number;
  currency: string;
}

// Compares: Arc (real) vs Arbitrum (simulated) vs Ethereum (simulated)
// Uses real gas data from tx hashes where available
// Shows: "You saved $X.XX vs Ethereum, $X.XX vs Arbitrum"
```

#### 1.5 Q2 — Enhanced Real-Time Stream
**Files to edit:**
- `packages/dashboard/app/api/stream/route.ts` — Add payment events, gas updates
- `packages/dashboard/app/page.tsx` — Subscribe to SSE for live updates

**Spec:** Enhance existing SSE endpoint to push:
- Real payment confirmations (from Supabase trigger or poll)
- Gas cost updates per transaction
- Agent status changes
- Revenue streaming ticks (for E3 integration)

#### 1.6 Q6 — Export/Share Session
**Files to create:**
- `packages/dashboard/components/SessionExport.tsx`
- `packages/dashboard/app/api/session-export/route.ts`

**Spec:**
```typescript
// SessionExport.tsx
// Button that generates a shareable JSON + HTML summary
// Includes: all tx hashes, task breakdown, cost analysis, timestamps
// "Share" button → copies permalink or downloads evidence package

// API route returns formatted session data from session-recorder JSON files
```

### Phase 2: P1 Features (6 features, ~12 new files)

#### 2.1 E1 — Subscription Tiers
**Files to create:**
- `packages/orchestrator/src/economy/tiers.ts`
- `packages/dashboard/components/TierSelector.tsx`

**Files to edit:**
- `packages/orchestrator/src/economy/pricing.ts` — Use tier multiplier
- `packages/dashboard/components/AgentCard.tsx` — Show tier badge

**Spec:**
```typescript
// economy/tiers.ts
export type TierLevel = "basic" | "premium" | "enterprise";

export interface AgentTier {
  tier: TierLevel;
  priceMultiplier: number; // basic=1.0, premium=4.0, enterprise=10.0
  rateLimit: number;       // calls per minute
  maxTokens: number;       // response token limit
  priorityRouting: number; // higher = preferred in routing
  features: string[];      // enabled capabilities
}

export const TIER_CONFIG: Record<TierLevel, AgentTier>;
export function getTieredPrice(basePrice: string, tier: TierLevel): string;
export function getTierCapabilities(tier: TierLevel): string[];
export function isTierAllowed(agentType: string, tier: TierLevel): boolean;
```

#### 2.2 E5 — Slashing & Insurance Fund
**Files to create:**
- `packages/orchestrator/src/economy/slashing.ts`
- `packages/contracts/src/AgentStaking.vy`

**Files to edit:**
- `packages/orchestrator/src/contracts.ts` — Add slashing interactions
- `packages/orchestrator/src/config.ts` — Add flags + contract address

**Spec:**
```typescript
// economy/slashing.ts
export interface StakeInfo {
  agentAddress: string;
  stakedAmount: string;
  slashCount: number;
  isEligible: boolean;
}

export async function stakeAgent(agentAddress: string, amount: string): Promise<ContractInteraction>;
export async function slashAgent(agentAddress: string, reason: string): Promise<ContractInteraction>;
export async function getStakeInfo(agentAddress: string): Promise<StakeInfo>;
export async function compensateUser(userAddress: string, amount: string, reason: string): Promise<ContractInteraction>;
export function calculateSlashAmount(stakeAmount: string, offense: string): string;
```

#### 2.3 E3 — Revenue Streaming
**Files to create:**
- `packages/orchestrator/src/economy/streaming.ts`

**Files to edit:**
- `packages/orchestrator/src/executor.ts` — Stream mode alongside pay-per-call
- `packages/orchestrator/src/index.ts` — Stream mode integration

**Spec:**
```typescript
// economy/streaming.ts
export interface PaymentStream {
  streamId: string;
  agentType: string;
  ratePerSecond: string; // e.g. "$0.001"
  startTime: number;
  endTime: number | null;
  totalPaid: string;
  isActive: boolean;
  payments: Array<{ timestamp: number; amount: string; txHash: string }>;
}

export async function startStream(agentType: string, ratePerSecond?: string): Promise<PaymentStream>;
export async function stopStream(streamId: string): Promise<PaymentStream>;
export async function tickStream(streamId: string): Promise<{ amount: string; txHash: string }>;
export function getActiveStreams(): PaymentStream[];
export function getStreamTotals(): { totalStreamed: string; activeCount: number };
```

#### 2.4 A6 — Agent Staking Portal
**Files to create:**
- `packages/dashboard/components/AgentStaking.tsx`
- `packages/dashboard/app/api/staking/route.ts`

**Spec:** Dashboard card per agent showing staked amount, slash history, unstake button. Integrates with slashing.ts module.

#### 2.5 Q1 — Task Templates Library
**Files to create:**
- `packages/dashboard/components/TaskTemplates.tsx`

**Spec:**
```typescript
interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  agentChain: string[];      // e.g. ["research", "code", "test"]
  estimatedCost: string;
  estimatedTime: string;
  category: "development" | "testing" | "security" | "research" | "review";
}

const TEMPLATES: TaskTemplate[];
// Pre-built: "Build REST API", "Write Tests", "Security Audit",
// "Research Report", "Code Review", "Full Pipeline", "Documentation"
```

#### 2.6 Q3 — Agent Comparison View
**Files to create:**
- `packages/dashboard/components/AgentComparison.tsx`

**Spec:** Side-by-side comparison matrix of all agents showing:
- Price per call
- Average response time
- Reputation score
- Capabilities list
- Tier availability
- Staked amount
- Tasks completed

### Phase 3: P2 Features (6 features, ~10 new files)

#### 3.1 A2 — Wallet Connection (WAGMI)
**Files to create:**
- `packages/dashboard/lib/wallet.ts`
- `packages/dashboard/components/WalletConnect.tsx`

**Files to edit:**
- `packages/dashboard/package.json` — Add wagmi + @rainbow-me/rainbowkit

#### 3.2 E6 — Batch Auction Settlement
**Files to create:**
- `packages/orchestrator/src/economy/auction.ts`

#### 3.3 E4 — Multi-Token Pricing
**Files to create:**
- `packages/orchestrator/src/economy/multi-token.ts`

#### 3.4 A4 — Batch Proof Verification
**Files to create:**
- `packages/orchestrator/src/economy/merkle-proofs.ts`

#### 3.5 A3 — On-Chain Governance
**Files to create:**
- `packages/contracts/src/Governance.vy`
- `packages/orchestrator/src/economy/governance.ts`

#### 3.6 A5 — Cross-Chain Bridge Status
**Files to create:**
- `packages/dashboard/components/BridgeStatus.tsx`
- `packages/dashboard/app/api/bridge-status/route.ts`

---

## Config Flag Summary (all new flags)

```typescript
// Added to FEATURES in config.ts
// P0
useSmartRetry: boolean,       // default true
useCostEstimator: boolean,    // default true
useAutoRefund: boolean,       // default true
useGasDashboard: boolean,     // default true
useEnhancedStream: boolean,   // default true
useSessionExport: boolean,    // default true

// P1
useSubscriptionTiers: boolean, // default true
useSlashing: boolean,          // default true
useRevenueStreaming: boolean,  // default false (opt-in)
useAgentStaking: boolean,      // default true
useTaskTemplates: boolean,     // default true
useAgentComparison: boolean,   // default true

// P2
useWalletConnect: boolean,     // default false (needs deps)
useBatchAuction: boolean,      // default false
useMultiToken: boolean,        // default false
useMerkleProofs: boolean,      // default false
useGovernance: boolean,        // default false
useBridgeStatus: boolean,      // default false
```

---

## @architect Review Notes

### Structural Soundness ✅
- All P0 features are self-contained modules — no circular dependencies
- P1 features depend only on existing economy/marketplace modules
- P2 features are fully independent stretch goals
- Feature flags ensure zero regression risk — any feature can be toggled off
- File count per feature ≤ 3 (within 300-line constraint)

### Integration Points
- `index.ts` grows by ~80 lines (feature hooks) — acceptable, still under 300
- `config.ts` adds 18 flags — may need extraction to `features.ts` if > 30
- Dashboard `page.tsx` adds ~6 components — consider tab navigation to avoid scroll fatigue

### Risk Assessment
- **E3 Revenue Streaming**: Tick-based mock payments may create many tx hashes — control with interval
- **A2 Wallet Connect**: Requires wagmi deps — make it P2 to avoid blocking demo
- **E5 Slashing**: New Vyper contract — keep as mock-first, contract is stretch

---

## @critic Validation ✅

### Testability
- Every module has mock fallback → testable without blockchain
- Each feature has at least 1 demo moment → verifiable by judges
- Feature flags allow A/B testing during demo

### Quality Criteria Met
- No `any` types, no `@ts-ignore`, no TODOs without ticket references
- All files follow naming conventions (kebab-case for files)
- All components are "use client" where needed
- Mock hash prefix `MOCK_0x` pattern maintained throughout

---

## Changes Tracking
| Date | Change | Reason |
|------|--------|--------|
| 2026-04-18 | Initial RALPLAN consensus spec | User request for 18 features |
| 2026-04-18 | Architect review: approved with minor notes | Structural soundness confirmed |
| 2026-04-18 | Critic review: approved | Quality criteria met |
