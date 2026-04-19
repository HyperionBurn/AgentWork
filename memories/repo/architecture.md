# AgentWork Architecture Decisions

## 18-Feature Plan (2026-04-18 RALPLAN Consensus)

### Planning Artifacts
- Spec: `.copilot-tracking/specs/20260418-18feature-ralplan-spec.md`
- Plan: `.copilot-tracking/plans/20260418-18feature-plan.instructions.md`
- Details: `.copilot-tracking/details/20260418-18feature-details.md`
- Prompt: `.copilot-tracking/prompts/implement-18feature.prompt.md`
- Changes: `.copilot-tracking/changes/20260418-18feature-changes.md`

### 18 New Feature Flags (config.ts)
- P0: useSmartRetry, useCostEstimator, useAutoRefund, useGasDashboard, useEnhancedStream, useExportSession
- P1: useSubscriptionTiers, useSlashing, useRevenueStreaming, useAgentStaking, useTaskTemplates, useAgentComparison
- P2: useWalletConnect, useBatchAuction, useMultiToken, useMerkleProofs, useGovernance, useBridgeStatus

### New Files to Create
- Orchestrator: retry.ts, cost-estimator.ts, economy/{refunds,tiers,slashing,streaming,auction,multi-token,merkle-proofs,governance}.ts
- Dashboard: 8 new components + 4 API routes
- Contracts: AgentStaking.vy, Governance.vy

## Integration Patterns

### Orchestrator → Dashboard Data Pipeline
- **Status**: Currently broken - orchestrator writes to console only
- **Required**: Orchestrator must insert to Supabase `task_events` table
- **Implementation**: Add `@supabase/supabase-js` to orchestrator, call `recordTaskEvent()` after each payment
- **File**: `packages/orchestrator/src/supabase.ts` (to be created)
- **Update**: `packages/orchestrator/src/executor.ts` to record events

### Dashboard x402 Integration (Seller-side)
- **SDK**: `@circle-fin/x402-batching/server` - `BatchFacilitatorClient`
- **Config**: Only `url` parameter required; `createAuthHeaders` optional (verify if needed)
- **Field Mapping**: Settlement result uses `transaction` field, NOT `transactionHash`
- **Environment**: Requires `SELLER_WALLET` (currently missing from .env.example)
- **File**: `packages/dashboard/lib/x402.ts`

### Orchestrator x402 Integration (Buyer-side)
- **SDK**: `@circle-fin/x402-batching/client` - `GatewayClient`
- **Config**: `chain: "arcTestnet"` (ONLY valid value per AGENTS.md), `privateKey: as Hex`
- **Field Names**: `depositTxHash` for deposits, `transaction` for payments
- **Environment**: Requires `ORCHESTRATOR_PRIVATE_KEY`
- **File**: `packages/orchestrator/src/executor.ts`

### Python Agents x402 Integration (Seller-side)
- **SDK**: `circlekit` Python package - `create_gateway_middleware`, `GatewayClient`
- **Event Loop**: Must be started in background thread using `asyncio.new_event_loop()` + `thread.start()`
- **Fallback**: Graceful passthrough mode when circlekit not installed (documented, not silent)
- **Validation**: Wallet addresses must be validated (regex: `^0x[a-fA-F0-9]{40}$`)
- **Files**: `agents/*/server.py`

## Network Configuration

### Docker Service Names vs Localhost
- **Localhost**: `http://localhost:4021` (for local development)
- **Docker Compose**: `http://research-agent:4021` (service name + port)
- **Configuration**: Use environment variables for agent URLs
  - `RESEARCH_AGENT_URL` (default: `http://localhost:4021`)
  - `CODE_AGENT_URL`, `TEST_AGENT_URL`, `REVIEW_AGENT_URL`
- **Files to update**:
  - `packages/dashboard/app/page.tsx` (agent health checks)
  - `packages/orchestrator/src/config.ts` (agent endpoints)
  - `docker-compose.yml` (environment variables)

## Data Persistence

### Supabase Schema (to be created)
- **payment_events**: Records dashboard x402 payments
  - Fields: id, payer, payee, amount, token, gateway_tx, endpoint, created_at
  - Indexed by: created_at DESC
- **task_events**: Records orchestrator task execution
  - Fields: id, task_id, agent_type, status, gateway_tx, amount, result, created_at
  - Indexed by: task_id, agent_type, created_at DESC
- **agents**: Records agent health and statistics
  - Fields: id, name, type, port, status, last_heartbeat, earnings, tasks_completed
  - Indexed by: last_heartbeat DESC
  - Trigger: Auto-update `updated_at` timestamp

### Real-time vs Polling
- **Current**: Dashboard polls `/api/task-status` every 3 seconds
- **Recommended**: Use Supabase real-time subscriptions
  ```typescript
  supabase.channel('task_events')
    .on('postgres_changes', { event: 'INSERT', schema: 'public' }, payload => {
      setTasks(prev => [payload.new, ...prev]);
    })
    .subscribe();
  ```
- **Benefit**: Reduces network overhead, instant updates, lower latency

## Component Boundaries

| Component | Responsibility | Key Files |
|-----------|----------------|-------------|
| **Orchestrator** | Task decomposition + payment execution + task recording | `src/index.ts`, `src/decomposer.ts`, `src/executor.ts`, `src/contracts.ts` |
| **Dashboard** | Real-time monitoring + payment verification + UI | `app/page.tsx`, `lib/x402.ts`, `lib/supabase.ts`, `components/` |
| **Agents** | Execute specialized tasks (research/code/test/review) | `agents/*/server.py` |
| **Contracts** | On-chain escrow + reputation + identity | `packages/contracts/src/*.vy` |
| **Database** | Persist payment + task + agent events | Supabase (PostgreSQL) |

## Verified SDK API Surface (v2.1.0)

### GatewayClient (buyer-side)
```typescript
new GatewayClient({ chain: "arcTestnet", privateKey: Hex })
client.deposit(amount: string): Promise<DepositResult>
  // DepositResult { depositTxHash: Hex, amount: bigint, formattedAmount: string }
client.pay(url: string, init?: RequestInit): Promise<PayResult>
  // PayResult { data: T, amount: bigint, formattedAmount: string, transaction: Hex }
client.getBalances(): Promise<Balances>
  // Balances { wallet: {...}, gateway: { total, available, formattedAvailable, ...} }
client.withdraw(args): Promise<WithdrawResult>
```

### BatchFacilitatorClient (seller-side)
```typescript
new BatchFacilitatorClient({ url?: string, createAuthHeaders?: () => Promise<...> })
facilitator.verify(payload, requirements): Promise<{ isValid, invalidReason?, payer? }>
facilitator.settle(payload, requirements): Promise<{ success, errorReason?, transaction, network, payer? }>
```

### PaymentRequirements Shape
```typescript
{
  scheme: "exact",
  network: "eip155:5042002",
  asset: "0x3600000000000000000000000000000000000000",
  amount: "$0.005",  // Dollar-prefixed string required
  payTo: sellerWallet,
  maxTimeoutSeconds: 60,
  extra: {
    name: "GatewayWalletBatched",
    version: "1",
    verifyingContract: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
  },
}
```

## Critical Integration Points

### Point 1: Orchestrator → Supabase
- **Current**: ❌ Not implemented
- **Required**: ✅ Insert task events after each payment
- **Impact**: Dashboard shows empty feed without this
- **Priority**: CRITICAL (blocks demo)

### Point 2: Dashboard → Supabase
- **Current**: ⚠️ Partial (inserts without error handling)
- **Required**: ✅ Add try/catch, log failures, implement retry
- **Impact**: Silent failures if insert fails
- **Priority**: CRITICAL

### Point 3: Orchestrator → Agents (x402)
- **Current**: ✅ Working (GatewayClient.pay() calls)
- **Required**: ✅ Maintain current implementation
- **Impact**: Core payment flow working
- **Priority**: None (already correct)

### Point 4: Dashboard → Agents (x402)
- **Current**: ✅ Working (withGateway() middleware)
- **Required**: ⚠️ Add SELLER_WALLET env var
- **Impact**: Payment verification fails without wallet
- **Priority**: CRITICAL

## Design Patterns

### Separation of Concerns
- x402 logic isolated in `lib/x402.ts`
- Supabase logic isolated in `lib/supabase.ts`
- Component logic isolated in `components/*.tsx`
- **Status**: ✅ Good practice, maintain

### Configuration Management
- Current: Scattered across files (hardcoded ports, URLs)
- Recommended: Centralize in `lib/config.ts` (dashboard), `src/config.ts` (orchestrator)
- Priority: HIGH (maintainability)

### Error Handling
- Current: Silent catches in many places, no retries
- Recommended: Try/catch with logging, exponential backoff retry, error boundaries
- Priority: HIGH (reliability)

### Type Safety
- Current: Local type redefinitions, any types missing
- Recommended: Import from single source, use viem Address/Hex types
- Priority: MEDIUM (quality)
