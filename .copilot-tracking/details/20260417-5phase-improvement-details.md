<!-- markdownlint-disable-file -->

# Task Details: 5-Phase Improvement Plan

## Research Reference

**Source Research**: Full codebase audit — all source files read and analyzed for improvement opportunities.

---

## Phase 1: Dashboard Real-Time + UI Polish

### Task 1.1: Wire Supabase Realtime subscriptions in page.tsx

Replace the 3s polling interval for task events with Supabase Realtime `subscribeToTasks()` channel subscription. Keep polling as a degraded-mode fallback when Realtime is unavailable.

- **Files**:
  - `packages/dashboard/app/page.tsx` — Replace `setInterval(fetchTasks, 3000)` with `subscribeToTasks()` in `useEffect`; add connection state tracking
  - `packages/dashboard/lib/supabase.ts` — Already has `subscribeToTasks()` and `subscribeToPayments()` — no changes needed
- **Success**:
  - Tasks appear in dashboard within 500ms of orchestrator insertion
  - If Supabase Realtime disconnects, falls back to polling within 10s
  - Connection status indicator shows "Live" or "Polling" in header
- **Dependencies**:
  - Supabase project with Realtime enabled on `task_events` table (already configured in schema.sql from Phase 6)

### Task 1.2: Add live gateway balance widget to dashboard

Add a new API route that returns the orchestrator's Circle Gateway balance. Display it in the hero stats bar.

- **Files**:
  - `packages/dashboard/app/api/gateway-balance/route.ts` — NEW: calls GatewayClient.getBalances() server-side (requires ORCHESTRATOR_PRIVATE_KEY env var in dashboard, or reads from Supabase)
  - `packages/dashboard/app/page.tsx` — Add 5th stat card: "Gateway Balance" with formatted USDC amount
- **Implementation Notes**:
  - The dashboard currently doesn't have ORCHESTRATOR_PRIVATE_KEY — this route should read from a new Supabase table `gateway_state` or accept balance as a query param pushed by the orchestrator
  - **Simpler alternative**: orchestrator writes balance to Supabase `gateway_state` table on each run; dashboard reads it via task-status route
- **Success**:
  - Hero stats show real-time gateway USDC balance
  - Balance updates after each deposit/payment cycle
- **Dependencies**:
  - Supabase `gateway_state` table (new) OR orchestrator passes balance through task_events

### Task 1.3: Upgrade AgentCard with live earnings/tasks data

AgentCard currently shows hardcoded `earnings: 0` and `tasksCompleted: 0`. Derive these from Supabase task_events.

- **Files**:
  - `packages/dashboard/app/api/agent-health/route.ts` — Extend health response to include per-agent task counts and earnings from Supabase
  - `packages/dashboard/components/AgentCard.tsx` — Add `earnings` and `tasksCompleted` display below description
  - `packages/dashboard/app/page.tsx` — Pass earnings/tasksCompleted from health check data to AgentCard
- **Success**:
  - Each agent card shows "$0.025 earned" and "5 tasks" (or whatever the real counts are)
  - Counts update as the demo runs
- **Dependencies**:
  - Task 1.1 (real-time task feed) provides the data flow

### Task 1.4: Add task flow animation (status transitions)

When a task's status changes (pending → paying → completed), animate the transition in TaskFeed and TxList.

- **Files**:
  - `packages/dashboard/components/TaskFeed.tsx` — Add CSS transitions for new task entries (slide-in from left), status badge color transitions
  - `packages/dashboard/components/TxList.tsx` — Add pulse animation on new transaction entries
  - `packages/dashboard/app/globals.css` — Add `@keyframes slideIn`, `@keyframes pulse-glow` animations
- **Success**:
  - New tasks slide in with animation when they arrive via Realtime
  - Status badge transitions are visually smooth (color fade)
  - Completed tasks get a brief green glow effect
- **Dependencies**:
  - Task 1.1 (real-time subscriptions wired)

### Task 1.5: Update EconomicChart with live accumulated cost

Replace static comparison values with actual accumulated cost from the live demo run.

- **Files**:
  - `packages/dashboard/components/EconomicChart.tsx` — Accept `liveCost` prop; show "Your Run: $X.XXX" alongside static comparisons
  - `packages/dashboard/app/page.tsx` — Pass `stats.totalSpent` to EconomicChart
- **Success**:
  - Chart shows actual dollars spent alongside theoretical Stripe/L2/Arc costs
  - Live cost updates as payments complete
- **Dependencies**:
  - Task 1.1 for real-time stats updates

---

## Phase 2: Agent Intelligence Layer

### Task 2.1: Define shared agent response types

Create a shared TypeScript interface for agent responses that the orchestrator and dashboard can both use.

- **Files**:
  - `packages/orchestrator/src/types.ts` — NEW: Define `AgentResponse`, `ResearchResult`, `CodeResult`, `TestResult`, `ReviewResult` interfaces
  - `packages/orchestrator/src/executor.ts` — Type the `result.data` as `AgentResponse` instead of `unknown`
- **Type Definitions**:
  ```typescript
  export interface AgentResponse {
    success: boolean;
    agent: string;
    task_id: string;
    paid_by: string;
    amount: string;
    result: ResearchResult | CodeResult | TestResult | ReviewResult;
    context?: AgentContext;  // for chaining
  }

  export interface AgentContext {
    prior_subtask_id: string;
    prior_agent_type: string;
    summary: string;  // condensed prior output
  }

  export interface ResearchResult {
    summary: string;
    key_findings: string[];
    sources: Array<{ title: string; relevance: number }>;
    confidence: number;
  }

  export interface CodeResult {
    code: string;
    language: string;
    files_modified: string[];
    test_coverage?: number;
  }

  export interface TestResult {
    tests_generated: number;
    passing: number;
    failing: number;
    coverage: number;
    test_suite: string;
  }

  export interface ReviewResult {
    quality_score: number;
    issues: Array<{ severity: string; description: string }>;
    approved: boolean;
    suggestions: string[];
  }
  ```
- **Success**:
  - `result` field in `PaymentResult` is typed, not `unknown`
  - No `any` types introduced
- **Dependencies**:
  - None — can be done independently

### Task 2.2: Upgrade all 4 Flask agents with structured outputs

Replace flat string mock responses with structured, type-safe outputs matching the interfaces from Task 2.1.

- **Files**:
  - `agents/research-agent/server.py` — Upgrade `perform_research()` to return richer mock data (varying by input topic)
  - `agents/code-agent/server.py` — Upgrade to return structured code output with language, files, coverage
  - `agents/test-agent/server.py` — Upgrade to return test suite with pass/fail counts
  - `agents/review-agent/server.py` — Upgrade to return quality score, issues list, approval status
- **Implementation Notes**:
  - Responses must be backward-compatible — existing `success`, `agent`, `amount` fields preserved
  - New fields are additive: `result.code`, `result.quality_score`, etc.
  - Mock data should vary based on input to look realistic in demo
- **Success**:
  - Each agent returns structured JSON matching the TypeScript interfaces
  - AgentCard or TaskFeed can display rich result data
  - No breaking changes to orchestrator's existing response handling
- **Dependencies**:
  - Task 2.1 (types defined first)

### Task 2.3: Add context-aware task chaining in decomposer

The decomposer already creates `dependsOn` chains. Now make it pass context (prior subtask output summary) to dependent subtasks.

- **Files**:
  - `packages/orchestrator/src/decomposer.ts` — Add optional `context` field to Subtask interface; populate with summary of parent subtask expected output
- **Implementation Notes**:
  - Context is a `query` parameter added to the agent URL: `&context=<encoded_summary>`
  - Doesn't change the payment flow — agents receive context as optional input
  - Makes the demo look intelligent: "Based on research findings, implement..."
- **Success**:
  - Dependent subtasks include `context` in their URL params
  - Agents receive and can reference prior subtask output
  - Demo output shows task chaining intelligence
- **Dependencies**:
  - Task 2.2 (agents can accept context param)

### Task 2.4: Update executor to pass context between subtasks

The executor currently runs subtasks sequentially but discards results between calls. Store results and pass summaries to dependent subtasks.

- **Files**:
  - `packages/orchestrator/src/executor.ts` — Maintain a `Map<subtaskId, resultSummary>` across `executeAllPayments()`; inject context into subtask URLs before calling `gateway.pay()`
- **Implementation Notes**:
  - After each successful payment, extract a summary from `result.data`
  - Before executing a subtask with `dependsOn`, append `&context=<summary>` to the URL
  - Keep this lightweight — 1-2 sentence summaries, not full responses
- **Success**:
  - Executor passes context between chained subtasks
  - Each agent receives relevant prior output
  - No regressions in payment flow
- **Dependencies**:
  - Task 2.3 (decomposer creates context references)
  - Task 2.1 (typed responses for summary extraction)

---

## Phase 3: Real Contract Integration

### Task 3.1: Add isContractDeployed() feature flag to config.ts

Centralize the "are contracts deployed?" check instead of checking individual env vars in each file.

- **Files**:
  - `packages/orchestrator/src/config.ts` — Add `CONTRACT_ADDRESSES` constant and `isContractDeployed(): boolean` function
- **Implementation**:
  ```typescript
  export const CONTRACT_ADDRESSES = {
    identityRegistry: process.env.IDENTITY_REGISTRY_ADDRESS,
    reputationRegistry: process.env.REPUTATION_REGISTRY_ADDRESS,
    agentEscrow: process.env.AGENT_ESCROW_ADDRESS,
    paymentSplitter: process.env.PAYMENT_SPLITTER_ADDRESS,
    spendingLimiter: process.env.SPENDING_LIMITER_ADDRESS,
  } as const;

  export function isContractDeployed(contract: keyof typeof CONTRACT_ADDRESSES): boolean {
    const addr = CONTRACT_ADDRESSES[contract];
    return !!addr && addr !== "0x_" && addr.startsWith("0x") && addr.length === 42;
  }
  ```
- **Success**:
  - Single source of truth for contract deployment state
  - Used by contracts.ts to decide real vs mock behavior
- **Dependencies**:
  - None

### Task 3.2: Deploy contracts to Arc testnet (Moccasin)

Deploy all 5 Vyper contracts to Arc testnet using the Moccasin framework.

- **Files**:
  - `packages/contracts/script/deploy.py` — Update with real deployment logic using Moccasin
  - `packages/contracts/moccasin.toml` — Already configured with arc_testnet network
  - `.env` — Fill in deployed contract addresses after deployment
- **Deploy Order** (per AGENTS.md §10.6):
  1. IdentityRegistry (no constructor args)
  2. ReputationRegistry(identity.address)
  3. AgentEscrow (no constructor args)
  4. PaymentSplitter (no constructor args)
  5. SpendingLimiter (no constructor args)
- **Success**:
  - All 5 contracts deployed with verified addresses
  - Each deployment produces a tx hash visible on arcscan.io
  - Addresses written to .env
- **Dependencies**:
  - Funded Arc testnet wallet with USDC for gas
  - Moccasin + Vyper 0.4.x installed

### Task 3.3: Wire real contract calls in contracts.ts

Replace mock interactions with real viem contract calls when addresses are configured.

- **Files**:
  - `packages/orchestrator/src/contracts.ts` — Add viem `createPublicClient`/`createWalletClient`; real `createTask`, `claimTask`, `submitResult`, `approveCompletion`, `giveFeedback` when `isContractDeployed()` returns true
- **Implementation Notes**:
  - Import ABIs from `packages/contracts/build/` (Moccasin output)
  - Use `ORCHESTRATOR_PRIVATE_KEY` for signing
  - Keep mock fallback when addresses not configured
  - Feature-flagged: `if (isContractDeployed('agentEscrow')) { real } else { mock }`
- **Success**:
  - When contract addresses are set, orchestrator makes real on-chain calls
  - Each call produces a real tx hash on arcscan.io
  - When addresses not set, falls back to current mock behavior
- **Dependencies**:
  - Task 3.1 (feature flag)
  - Task 3.2 (contracts deployed)

### Task 3.4: Update orchestrator to use real escrow lifecycle

Wire the full escrow lifecycle (create → claim → submit → approve) into the orchestrator flow.

- **Files**:
  - `packages/orchestrator/src/index.ts` — After payment execution, call real escrow completion; pass tx hashes to Supabase
  - `packages/orchestrator/src/contracts.ts` — Add `claimAndSubmit(taskId, result)` helper
- **Success**:
  - Full escrow lifecycle visible on Arc testnet
  - Each task shows: escrow created → claimed → result submitted → completed on arcscan.io
  - Adds 4+ real on-chain transactions per run beyond x402 payments
- **Dependencies**:
  - Task 3.3 (real contract calls wired)

---

## Phase 4: Demo Resilience + Metrics

### Task 4.1: Add retry logic with exponential backoff to executor

Wrap `executePayment()` with configurable retry (default: 3 attempts, 2s base backoff).

- **Files**:
  - `packages/orchestrator/src/executor.ts` — Add `executePaymentWithRetry()` that wraps `executePayment()`; add `MAX_RETRIES` and `BASE_BACKOFF_MS` constants
- **Implementation**:
  ```typescript
  const MAX_RETRIES = 3;
  const BASE_BACKOFF_MS = 2000;

  async function executePaymentWithRetry(subtask: Subtask): Promise<PaymentResult> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const result = await executePayment(subtask);
      if (result.success) return result;
      if (attempt < MAX_RETRIES) {
        const delay = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.log(`   ⏳ Retry ${attempt}/${MAX_RETRIES} in ${delay}ms...`);
        await sleep(delay);
      }
    }
    return executePayment(subtask); // final attempt
  }
  ```
- **Success**:
  - Transient failures (network timeout, 503) are retried automatically
  - Failed payments logged with attempt count
  - No infinite loops or excessive delays
- **Dependencies**:
  - Phase 2 complete (executor is the same file)

### Task 4.2: Add session recorder (evidence file writer)

After all runs complete, write a JSON evidence file with every task event, tx hash, and cost.

- **Files**:
  - `packages/orchestrator/src/session-recorder.ts` — NEW: `recordSession()` function that writes results to `evidence/session-YYYYMMDD-HHMM.json`
- **Implementation Notes**:
  - File includes: run config (DEMO_TASK, DEMO_RUNS), all PaymentResults with tx hashes, total cost, timestamp
  - Adds `evidence/*.json` to .gitignore (Critic C5)
  - Called from `main()` after all runs complete
- **Success**:
  - Running orchestrator produces a timestamped JSON file
  - File contains all tx hashes for the 60+ transactions proof
  - File is human-readable and can be shared with judges
- **Dependencies**:
  - None

### Task 4.3: Create one-click demo launch script

A single script that validates env, starts agents, waits for health, then launches orchestrator.

- **Files**:
  - `scripts/demo.sh` / `scripts/demo.ps1` — NEW: orchestrates the full demo flow
  - `package.json` — Add `"demo"` script
- **Flow**:
  1. `npm run validate-env` — check env vars
  2. Start 4 agents in background
  3. Wait for health checks (10s timeout per agent)
  4. `npm run dev:orchestrator` — run the demo
  5. Print summary with evidence file location
- **Success**:
  - Single command launches the entire demo
  - Script handles agent startup, health wait, orchestrator launch
  - Clean shutdown of agents on Ctrl+C
- **Dependencies**:
  - Task 4.2 (session recorder for evidence)
  - validate-env.ts (already exists)

### Task 4.4: Add cost accumulator and savings display

Track running costs across all runs and display savings vs. traditional payment methods.

- **Files**:
  - `packages/orchestrator/src/index.ts` — Accumulate costs across DEMO_RUNS; print comparison table at end
  - `packages/dashboard/components/EconomicChart.tsx` — Already getting live cost from Phase 1 Task 1.5
- **Comparison Output**:
  ```
  💰 Cost Comparison for 60 transactions:
     Arc:     $0.300 (actual)
     Stripe:  $18.00 (0.30 × 60)
     L2:      $6.00  (0.10 × 60)
     Savings: 60-98% vs alternatives
  ```
- **Success**:
  - Orchestrator prints cost comparison at end of all runs
  - Dashboard shows live savings percentage
- **Dependencies**:
  - Phase 1 Task 1.5 (EconomicChart receives live data)

---

## Phase 5: Submission Excellence

### Task 5.1: Create evidence collector script

Post-demo script that collects all evidence into a single shareable package.

- **Files**:
  - `scripts/collect-evidence.ts` — NEW: Reads `evidence/session-*.json`, generates markdown summary, copies arcscan screenshots (if any)
- **Output**:
  - `evidence/submission-summary.md` — Human-readable summary of all transactions
  - `evidence/tx-count.txt` — Simple count for quick verification
- **Success**:
  - Single command generates evidence package
  - Summary includes tx count, total cost, time range, arcscan links
- **Dependencies**:
  - Task 4.2 (session recorder produces JSON files)

### Task 5.2: Write Circle Product Feedback document

The $500 bonus prize requires substantive product feedback on the Circle SDK.

- **Files**:
  - `docs/circle-product-feedback.md` — Update with concrete feedback from actual usage (already exists from Phase 6 — needs real usage feedback)
- **Content Structure**:
  - What worked well (Gateway API, x402 flow, deposit/settle)
  - Pain points (SDK field naming inconsistencies, missing error codes, documentation gaps)
  - Feature requests (balance WebSocket, batch status endpoint, CLI tool)
  - Rating: 4/5 with specific improvement areas
- **Success**:
  - Document cites specific SDK methods and their behaviors
  - Feedback is constructive and actionable
  - At least 5 specific suggestions
- **Dependencies**:
  - Having actually run the orchestrator against Arc testnet (Phase 3 or Phase 4)

### Task 5.3: Update README with final submission content

Polish README for hackathon submission with all final content.

- **Files**:
  - `README.md` — Add final demo video link, update submission checklist with real results, add architecture diagram refinements
- **Content**:
  - Update PRD checklist from ✅/🔜 to actual status with evidence links
  - Add "What We Learned" section
  - Add "Future Roadmap" section (post-hackathon)
  - Replace PLACEHOLDER video link with real URL
- **Success**:
  - README reads as a complete, professional project documentation
  - All links work (arcscan, video, docs)
  - Submission checklist is 100% accurate
- **Dependencies**:
  - All prior phases complete

### Task 5.4: Create judge-ready demo script

A refined demo script with exact timing, talking points, and fallback procedures.

- **Files**:
  - `docs/demo-script.md` — Update existing Phase 6 doc with refined timing, real data, fallback procedures
- **Content**:
  - Exact timeline (0:00 intro → 0:30 architecture → 1:00 live demo → 2:00 contracts → 2:30 economics → 3:00 close)
  - Fallback plan if live demo fails (pre-recorded video, screenshots)
  - Key talking points per slide/section
- **Success**:
  - Script is usable for a live 3-minute demo
  - Includes contingency for failures
  - Maps to hackathon judging criteria
- **Dependencies**:
  - All prior phases complete

---

## Dependencies

- Node.js ≥ 18, npm workspaces
- Python 3.11+ with Flask
- Supabase with Realtime enabled
- `@circle-fin/x402-batching` v2.1.0 + `viem` v2.x
- Moccasin + Vyper 0.4.x (Phase 3 only)
- Arc testnet USDC (faucet)

## Success Criteria

- All 5 phases independently deployable (app works after each phase)
- Zero regressions — existing tests pass, dashboard works, orchestrator works
- Dashboard shows real-time updates without polling
- Agent responses are structured and context-aware
- Real contracts on Arc testnet (when addresses configured)
- Orchestrator retries failures and records evidence
- Submission materials are judge-ready