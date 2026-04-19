<!-- markdownlint-disable-file -->

# Task Details: AgentWork Hyper Features — Hackathon Landslide Win

## Research Reference

**Source Research**: #file:../research/20260416-agentwork-ultimate-blueprint.md
**Comparative Analysis**: #file:../research/20260416-hackathon-concept-comparative-analysis.md
**RALPLAN Consensus**: Planner → Architect → Critic cycle (1 round, consensus achieved with 5 mandatory modifications)

---

## Phase A: Foundation + Validation (Day 0, April 20, ~6.5h)

### Task A.0: M5 Validation — Test 1 Orchestrator Run, Count Unique TX Hashes

Before building any visual features, verify that the orchestrator produces real transaction hashes and determine how many unique hashes result from a single run.

- **Files**:
  - `packages/orchestrator/src/index.ts` (Lines 380-450) — runOnce() summary shows totalTxns calculation
  - `packages/orchestrator/src/executor.ts` — payment execution produces PaymentResult with transactionHash
  - `.env` — must have ORCHESTRATOR_PRIVATE_KEY set and wallet funded
- **Actions**:
  1. Fund wallet via faucet (https://faucet.circle.com) if not already done
  2. Set `DEMO_RUNS=1` in .env
  3. Run `cd packages/orchestrator && npx tsx src/index.ts`
  4. Count unique `MOCK_0x` or real `0x` hashes in output
  5. Calculate: 15 runs × 4 agents = 60 payments. But Gateway may batch → fewer unique on-chain txns
  6. If < 60 unique hashes: plan to add contract interactions (escrow lifecycle, identity registration, reputation) as fillers
  7. Document: expected unique hashes per run, total for 15 runs, filler strategy if needed
- **Success**:
  - [ ] Orchestrator completes 1 run without errors
  - [ ] Unique tx hash count documented (real or MOCK_)
  - [ ] Strategy confirmed for achieving 60+ total (payments alone or payments + contract calls)
- **Research References**:
  - #file:../research/20260416-hackathon-concept-comparative-analysis.md (Lines 50-80) — "50+ On-Chain Transaction Problem" section
  - AGENTS.md §10.5 — EIP-3009 batching behavior, each gateway.pay() may not produce distinct on-chain tx
- **Dependencies**:
  - Funded wallet (USER ACTION)
  - All 4 agents running (start with `python agents/*/server.py`)

### Task A.1: HF-3 — Real Agent Intelligence (LLM Integration)

Replace hardcoded agent responses with real LLM-generated content when `LLM_API_KEY` is set. Falls back to existing hardcoded responses when not set.

- **Files**:
  - `agents/research-agent/llm_client.py` (Lines 1-60) — call_llm(), enrich_with_llm(), USE_REAL_LLM flag
  - `agents/code-agent/llm_client.py` — Same structure as research-agent
  - `agents/test-agent/llm_client.py` — Same structure
  - `agents/review-agent/llm_client.py` — Same structure
  - `agents/research-agent/requirements.txt` — Add `openai` package
  - `agents/code-agent/requirements.txt` — Add `openai` package
  - `agents/test-agent/requirements.txt` — Add `openai` package
  - `agents/review-agent/requirements.txt` — Add `openai` package
  - `agents/research-agent/server.py` (Lines 1-100) — Agent Flask server, uses enrich_with_llm()
  - `packages/dashboard/components/TaskFeed.tsx` (Lines 50-80) — Task result rendering
- **Actions**:
  1. Add `openai>=1.0.0` to each agent's `requirements.txt`
  2. Enhance `llm_client.py` system prompts per agent type:
     - Research Agent: "You are a deep research specialist. Synthesize findings with citations."
     - Code Agent: "You are an expert programmer. Write clean, well-documented code."
     - Test Agent: "You are a QA engineer. Generate comprehensive test suites."
     - Review Agent: "You are a senior code reviewer. Provide actionable feedback."
  3. Add A2A context passing: when agent receives context from previous agent, include it in LLM prompt
  4. Modify `TaskFeed.tsx` result rendering — wrap in `<pre className="whitespace-pre-wrap text-xs text-slate-300">` (M3: no react-markdown)
  5. Add collapsible detail panel per task for long responses
  6. Test with `USE_REAL_LLM=true` and `LLM_API_KEY` set
- **M3 Compliance**: Use `<pre>` blocks with `whitespace-pre-wrap` for formatting. Do NOT add `react-markdown` or `remark-gfm` packages to avoid bundle bloat.
- **Success**:
  - [ ] Each agent returns unique, context-aware LLM responses when `LLM_API_KEY` is set
  - [ ] Falls back to existing hardcoded responses when `LLM_API_KEY` is empty
  - [ ] TaskFeed renders responses in formatted `<pre>` blocks
  - [ ] No new npm dependencies added to dashboard
- **Research References**:
  - `agents/research-agent/llm_client.py` (Lines 30-50) — call_llm() already uses openai client with fallback
  - AGENTS.md §6.3 — "Real LLM calls in demo (hardcode responses for reliability)" is listed as non-goal BUT this hyper-feature overrides that for judge impact
- **Dependencies**:
  - Task A.0 completed (know tx hash strategy)
  - LLM_API_KEY in .env (optional — graceful fallback)
  - `pip install openai` in each agent's venv

### Task A.2: HF-2 — One-Click Demo Launcher

Create a dashboard button that spawns the orchestrator process and streams progress to the UI. This is the highest-ROI feature (Judge Impact 9/10).

- **Files**:
  - **NEW** `packages/dashboard/app/api/demo-launch/route.ts` — POST endpoint, spawns orchestrator
  - **NEW** `packages/dashboard/components/DemoLauncher.tsx` — Button + progress + cost accumulator
  - `packages/dashboard/app/page.tsx` (Lines 170-200) — Add DemoLauncher in hero stats area
  - `packages/orchestrator/src/config.ts` (Line 20) — FEATURES.useRealLLM flag
- **Actions**:
  1. Create `app/api/demo-launch/route.ts`:
     ```typescript
     import { spawn } from "node:child_process";
     import { join } from "node:path";
     import { NextRequest, NextResponse } from "next/server";

     let activeProcess: ReturnType<typeof spawn> | null = null;

     export async function POST(req: NextRequest) {
       // Singleton: only one demo at a time
       if (activeProcess?.exitCode === null) {
         return NextResponse.json({ error: "Demo already running" }, { status: 409 });
       }

       const body = await req.json().catch(() => ({}));
       const task = body.task || "";
       const runs = Math.min(parseInt(body.runs || "15", 10), 50);

       // Sanitize task input (M1 security)
       if (task && !/^[\w\s.,!?-]+$/.test(task)) {
         return NextResponse.json({ error: "Invalid task input" }, { status: 400 });
       }

       const orchestratorPath = join(process.cwd(), "..", "orchestrator");
       const env = { ...process.env, DEMO_RUNS: String(runs) };
       if (task) env.DEMO_TASK = task;

       activeProcess = spawn("npx", ["tsx", "src/index.ts"], {
         cwd: orchestratorPath,
         env,
         stdio: ["ignore", "pipe", "pipe"],
       });

       // Collect output for response
       let output = "";
       activeProcess.stdout!.on("data", (d: Buffer) => { output += d.toString(); });
       activeProcess.stderr!.on("data", (d: Buffer) => { output += d.toString(); });

       // Cleanup on abort
       req.signal.addEventListener("abort", () => {
         activeProcess?.kill();
         activeProcess = null;
       });

       // Return immediately — progress flows through Supabase Realtime
       return NextResponse.json({
         status: "started",
         pid: activeProcess.pid,
         runs,
         task: task || process.env.DEMO_TASK || "default",
       });
     }
     ```
  2. Create `components/DemoLauncher.tsx`:
     - States: idle → running → complete
     - Big button with gradient (arc-purple → arc-blue)
     - Running state: spinner + "Run X/Y" progress (reads from stats.totalOnChainTransactions)
     - Complete state: "✅ XX transactions on Arc" + total cost
     - Cost accumulator: reads stats.totalSpent in real-time
  3. Add `<DemoLauncher />` to `page.tsx` above the two-column layout (hero stats area)
  4. Security (per architect review):
     - Input sanitization: regex `/^[\w\s.,!?-]+$/`
     - Singleton process tracker: only 1 orchestrator at a time
     - AbortSignal cleanup on disconnect
     - DO NOT use `shell: true` on Windows
- **M1 Compliance**: Local-dev-only. Does NOT work in Docker (can't spawn across containers). Document this limitation.
- **Success**:
  - [ ] "Run Demo" button visible on dashboard
  - [ ] Clicking spawns orchestrator, button shows "Running..."
  - [ ] Supabase Realtime feeds transaction updates to TaskFeed/TxList
  - [ ] Button transitions to "Complete! XX transactions" when done
  - [ ] Only one demo runs at a time (409 Conflict if already running)
  - [ ] Process cleanup on page navigation (AbortSignal)
- **Research References**:
  - #file:../research/20260416-agentwork-ultimate-blueprint.md (Lines 50-80) — Architecture diagram shows orchestrator → agents → Gateway → Arc flow
  - AGENTS.md §9 — Testing commands: `cd packages/orchestrator && npx tsx src/index.ts`
- **Dependencies**:
  - Task A.0 completed (validated tx hash count strategy)
  - Task A.1 completed or in progress (agents need to be running for real responses)

---

## Phase B: Visual + Proof (Day 1, April 21, ~7.5h)

### Task B.1: HF-1 — Live Transaction Waterfall

Transform the existing TaskFeed into an animated Bloomberg-terminal-style waterfall with cascading payment animations and arcscan verification links.

- **Files**:
  - `packages/dashboard/app/globals.css` (Lines 1-50) — CSS keyframes (slideInLeft, pulseGlow already exist)
  - `packages/dashboard/components/TaskFeed.tsx` (Lines 50-80) — Task event rendering with status badges
  - `packages/dashboard/app/page.tsx` (Lines 140-165) — Supabase subscription callback
- **Actions**:
  1. Add new CSS keyframes to `globals.css`:
     ```css
     @keyframes waterfall-slide {
       from { opacity: 0; transform: translateY(-10px); }
       to { opacity: 1; transform: translateY(0); }
     }
     @keyframes waterfall-glow {
       0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
       50% { box-shadow: 0 0 12px 4px rgba(124, 58, 237, 0.3); }
     }
     ```
  2. Modify `TaskFeed.tsx`:
     - Replace `animate-slide-in` with `animate-[waterfall-slide_0.3s_ease-out]`
     - Add `animate-[waterfall-glow_2s_ease-in-out_1]` for newly completed items
     - Green ✅ badge for real hashes: `<span className="text-green-400">✅ confirmed</span>`
     - Amber ⏳ badge for MOCK_: `<span className="text-amber-400">⏳ simulated</span>`
     - Arcscan link for real hashes: `https://testnet.arcscan.io/tx/${hash}`
  3. Add debounce for rapid Supabase inserts in `page.tsx`:
     ```typescript
     const pendingRef = useRef<TaskEvent[]>([]);
     const flushRef = useRef<NodeJS.Timeout>();
     // In subscription callback: accumulate, then flush every 100ms
     ```
  4. Auto-scroll to latest transaction on insert
- **Success**:
  - [ ] New payments animate into view with waterfall-slide effect
  - [ ] Real hashes show green ✅ with clickable arcscan link
  - [ ] MOCK_ hashes show amber ⏳ "simulated" badge
  - [ ] Rapid inserts (60+) don't cause excessive re-renders (debounced)
  - [ ] List auto-scrolls to latest entry
- **Research References**:
  - `packages/dashboard/app/globals.css` (Lines 25-50) — Existing animation keyframes as pattern reference
  - `packages/dashboard/components/TaskFeed.tsx` (Lines 60-80) — Current isMockTx detection logic
- **Dependencies**:
  - Task A.2 completed (Demo Launcher produces transactions that feed the waterfall)

### Task B.2: HF-4 — Economic Proof Engine

Redesign EconomicChart as a "Live Economic Proof" with animated counters showing real-time cost comparison between Arc, L2, and Stripe.

- **Files**:
  - `packages/dashboard/components/EconomicChart.tsx` (Lines 1-80) — Current static cost comparison
  - `packages/dashboard/app/api/task-status/route.ts` (Lines 40-55) — Stats aggregation (totalSpent, totalOnChainTransactions)
  - `packages/dashboard/app/page.tsx` (Lines 90-100) — Stats state, passes liveCost prop
- **Actions**:
  1. Redesign `EconomicChart.tsx`:
     - Top section: Live counters with animated numbers
       ```
       💰 Live Economic Proof
       Arc (actual):     $0.085  ████████░░░  2.0%
       L2 (estimated):   $2.100  ████████████░  49.4%
       Stripe (min):     $4.250  ██████████████ 100%
       ✓ You saved 98.0% vs traditional payments
       Based on 17 real on-chain transactions
       ```
     - Bottom section: Keep existing bar chart but with live data
  2. Wire real data:
     - `arcCost = parseFloat(liveCost.replace("$", ""))`
     - `txCount = stats.totalOnChainTransactions`
     - `stripeCost = txCount × 0.30` (Stripe minimum fee per transaction)
     - `l2Cost = txCount × 0.10` (L2 average gas cost)
     - `savings = ((1 - arcCost / stripeCost) × 100).toFixed(1)%`
  3. Add animated counter using requestAnimationFrame:
     ```typescript
     function useAnimatedCounter(target: number, duration = 1000) {
       const [current, setCurrent] = useState(0);
       useEffect(() => {
         const start = current;
         const diff = target - start;
         const startTime = performance.now();
         const animate = (now: number) => {
           const elapsed = now - startTime;
           const progress = Math.min(elapsed / duration, 1);
           setCurrent(start + diff * easeOutCubic(progress));
           if (progress < 1) requestAnimationFrame(animate);
         };
         requestAnimationFrame(animate);
       }, [target]);
       return current;
     }
     ```
  4. Pass both `liveCost` and `totalOnChainTransactions` as props
- **Success**:
  - [ ] Cost comparison updates in real-time as transactions complete
  - [ ] Numbers animate smoothly using requestAnimationFrame
  - [ ] Savings percentage shows undeniable proof (98%+ vs Stripe)
  - [ ] Bar chart scales dynamically based on actual costs
  - [ ] "Based on X real on-chain transactions" shows real count
- **Research References**:
  - `packages/dashboard/components/EconomicChart.tsx` (Lines 5-40) — Current scenarios array with hardcoded cost50 values
  - #file:../research/20260416-agentwork-ultimate-blueprint.md (Lines 15-35) — Economic comparison table (Arc $0.001 vs Stripe $0.30)
- **Dependencies**:
  - Task A.2 completed (Demo Launcher produces transactions that generate cost data)

### Task B.3: HF-5 — Transaction Evidence Gallery

Create a dedicated `/evidence` page that displays all verified on-chain transactions in a filterable table with arcscan verification links.

- **Files**:
  - **NEW** `packages/dashboard/app/evidence/page.tsx` — Full-page evidence gallery
  - **NEW** `packages/dashboard/app/api/evidence/route.ts` — Query task_events, filter real hashes
  - `packages/dashboard/app/page.tsx` (Lines 185-200) — Add "📊 View Evidence" link in header
- **Actions**:
  1. Create `app/api/evidence/route.ts`:
     - Query `task_events` from Supabase
     - Filter: only include records where `gateway_tx` exists AND does NOT start with "MOCK_"
     - Support query params: `?agent=research&status=completed&from=2026-04-20`
     - Return: `{ transactions: [...], summary: { total, totalAmount, agents, timeRange } }`
  2. Create `app/evidence/page.tsx`:
     - Hero section: "XX Verified On-Chain Transactions" large counter
     - Summary cards: Total Amount, Unique Agents, Time Span, Avg Cost/Txn
     - Filterable table columns: Tx Hash (→ arcscan link), Agent, Amount, Status, Timestamp
     - Filter bar: Agent type dropdown, Status dropdown, Date range
     - "Download CSV" button that constructs CSV from the API response
     - Empty state: "Awaiting on-chain transactions. Run the demo to generate evidence."
  3. Add link in `page.tsx` header:
     ```tsx
     <a href="/evidence" className="text-xs text-arc-purple hover:text-arc-blue transition-colors">
       📊 View Evidence
     </a>
     ```
- **Success**:
  - [ ] `/evidence` page loads and shows real transaction data from Supabase
  - [ ] Only real (non-MOCK_) hashes displayed
  - [ ] Each tx hash links to `https://testnet.arcscan.io/tx/{hash}`
  - [ ] Filters work for agent type, status, and date range
  - [ ] CSV export produces downloadable file
  - [ ] Empty state shows when no real transactions exist yet
- **Research References**:
  - `packages/dashboard/app/api/task-status/route.ts` (Lines 40-55) — Pattern for querying task_events with Supabase
  - AGENTS.md §10.3 — Explorer URL pattern: `https://testnet.arcscan.io/tx/${txHash}`
- **Dependencies**:
  - Task A.2 completed (Demo Launcher produces transactions that become evidence)
  - Supabase with `task_events` table populated

### Task B.4: HF-6 — Agent Performance Metrics

Enhance AgentCard with real performance metrics from actual task runs. Uses a FREE internal API route (not paywalled).

- **Files**:
  - **NEW** `packages/dashboard/app/api/agent-metrics/route.ts` — Free route, no withGateway
  - `packages/dashboard/components/AgentCard.tsx` (Lines 1-80) — Agent card component
  - `packages/dashboard/app/page.tsx` (Lines 90-110) — Agent state management
- **Actions**:
  1. Create `app/api/agent-metrics/route.ts`:
     ```typescript
     // FREE internal endpoint — no withGateway payment required
     // Aggregates per-agent metrics from task_events table
     export async function GET() {
       const supabase = getSupabase();
       if (!supabase) return NextResponse.json({ metrics: [] });

       const { data: tasks } = await supabase
         .from("task_events")
         .select("agent_type, status, amount");

       // Group by agent_type
       const metrics = groupBy(tasks, "agent_type").map(([type, events]) => ({
         agentType: type,
         tasksCompleted: events.filter(e => e.status === "completed").length,
         totalEarnings: events
           .filter(e => e.status === "completed")
           .reduce((sum, e) => sum + parseFloat((e.amount || "0").replace("$", "")), 0),
         successRate: events.length > 0
           ? ((events.filter(e => e.status === "completed").length / events.length) * 100).toFixed(0)
           : "0",
       }));

       return NextResponse.json({ metrics });
     }
     ```
  2. Modify `AgentCard.tsx`:
     - Add metrics section below description:
       ```tsx
       <div className="grid grid-cols-3 gap-2 mt-2">
         <div className="text-center">
           <p className="text-xs text-slate-500">Tasks</p>
           <p className="text-sm font-bold text-white">{metrics.tasksCompleted}</p>
         </div>
         <div className="text-center">
           <p className="text-xs text-slate-500">Earned</p>
           <p className="text-sm font-bold text-green-400">${metrics.totalEarnings.toFixed(3)}</p>
         </div>
         <div className="text-center">
           <p className="text-xs text-slate-500">Success</p>
           <p className="text-sm font-bold text-cyan-400">{metrics.successRate}%</p>
         </div>
       </div>
       ```
  3. Fetch metrics in `page.tsx` useEffect alongside agent health checks
  4. Pass metrics to each AgentCard via props
- **M2 Compliance**: Skip response time metric. Do NOT add `started_at` column to task_events schema. Only display: tasks completed, total earnings, success rate.
- **Success**:
  - [ ] Each agent card shows real task count, earnings, and success rate from actual runs
  - [ ] Data updates when new tasks complete (fetched on same interval as agent health)
  - [ ] No withGateway payment required (free internal endpoint)
  - [ ] Zero values show gracefully when no tasks have been run yet
- **Research References**:
  - `packages/dashboard/components/AgentCard.tsx` (Lines 30-45) — Already shows earnings and tasksCompleted from static data
  - `packages/dashboard/app/api/agent-stats/route.ts` — Existing paywalled route (keep as-is, create separate free route)
- **Dependencies**:
  - Supabase with `task_events` table
  - Task A.2 completed (Demo Launcher populates task_events with real data)

---

## Phase C: Contracts + Polish (Day 2, April 22, ~5.5h)

### Task C.1: HF-7 — Smart Contract Deployment

Deploy IdentityRegistry and ReputationRegistry Vyper contracts to Arc testnet. Pre-validate toolchain on Windows first (M4).

- **Files**:
  - `packages/contracts/script/deploy.py` (Lines 1-50) — Moccasin deploy script, deploy_all()
  - `packages/contracts/script/deploy_contracts.py` — Core deployment logic
  - `packages/contracts/src/IdentityRegistry.vy` — ERC-721 + agent metadata
  - `packages/contracts/src/ReputationRegistry.vy` — giveFeedback, getSummary, WAD normalization
  - `packages/orchestrator/src/contracts.ts` — Contract interaction wrappers
  - `packages/orchestrator/src/config.ts` (Lines 24-35) — CONTRACT_ADDRESSES, isContractDeployed()
  - `.env` — Fill deployed contract addresses
- **Actions**:
  1. **Pre-validate Moccasin/Vyper on Windows (M4)**:
     - Run: `pip install moccasin vyper && moccasin --version`
     - If fails: try WSL: `wsl pip install moccasin vyper && wsl moccasin --version`
     - If both fail: create Docker-based fallback:
       ```yaml
       deploy-contracts:
         build: packages/contracts
         command: moccasin run script/deploy.py --network arc_testnet
       ```
     - Document which approach works in /memories/repo/contracts.md
  2. **Deploy contracts** (if toolchain works):
     - Deploy order: `IdentityRegistry` → `ReputationRegistry(identity.address)`
     - Run: `cd packages/contracts && moccasin run script/deploy.py --network arc_testnet`
     - Script outputs contract addresses (already implemented in deploy.py)
  3. **Update .env** with deployed addresses:
     - `IDENTITY_REGISTRY_ADDRESS=0x...`
     - `REPUTATION_REGISTRY_ADDRESS=0x...`
  4. **Verify on arcscan.io**:
     - Navigate to `https://testnet.arcscan.io/address/{address}`
     - Confirm contract code is visible
  5. **Wire orchestrator**:
     - `isContractDeployed("identityRegistry")` returns true
     - `contracts.ts` calls real contract instead of mock fallback
- **Success**:
  - [ ] Moccasin/Vyper validated on Windows (or Docker fallback confirmed)
  - [ ] IdentityRegistry deployed to Arc testnet with visible code on arcscan
  - [ ] ReputationRegistry deployed, initialized with IdentityRegistry address
  - [ ] .env updated with both contract addresses
  - [ ] Orchestrator detects deployed contracts and uses real interactions
  - [ ] If deployment fails: mock fallback continues to work (no regression)
- **Research References**:
  - #file:../research/20260416-hackathon-concept-comparative-analysis.md (Lines 20-30) — vyperlang/erc-8004-vyper repo details, deploy order
  - `packages/contracts/script/deploy.py` (Lines 1-50) — Complete deploy script with .env output
  - AGENTS.md §10.6 — Deploy order: IdentityRegistry → ReputationRegistry(identity.address)
- **Dependencies**:
  - Funded wallet with sufficient USDC for gas
  - Moccasin + Vyper installed (pip install moccasin vyper)
  - Arc RPC accessible from host machine

### Task C.2: HF-8 — Demo Video Infrastructure

Create a scene-by-scene demo video script and recording automation helper.

- **Files**:
  - **NEW** `docs/demo-video-script.md` — Scene-by-scene script with timing and talking points
  - **NEW** `scripts/record-demo.ps1` — PowerShell script to automate demo recording setup
- **Actions**:
  1. Create `docs/demo-video-script.md`:
     ```
     Scene 1: Hook (0:00-0:15)
     - "What if AI agents could pay each other $0.005 per task?"
     - Show: Dashboard overview, agents online, "Run Demo" button

     Scene 2: Architecture (0:15-0:45)
     - Quick architecture diagram: Orchestrator → 4 Agents → Circle Gateway → Arc L1
     - Highlight: x402 nanopayment protocol, USDC native gas

     Scene 3: Live Demo (0:45-1:45)
     - Click "Run Demo" button
     - Watch transactions animate in waterfall
     - Show agent responses (real LLM if configured)
     - Highlight arcscan verification links

     Scene 4: Evidence (1:45-2:15)
     - Navigate to /evidence page
     - Show 60+ verified on-chain transactions
     - Click arcscan links to verify independently

     Scene 5: Economics (2:15-2:45)
     - Show Live Economic Proof: "Arc: $0.085 vs Stripe: $4.50 — 98% savings"
     - Animated counter updating in real-time
     - "This is why Arc wins for agentic payments"

     Scene 6: Future (2:45-3:00)
     - Deployed contracts (IdentityRegistry, ReputationRegistry)
     - ERC-8004 agent identity standard
     - Multi-agent DAG orchestration
     - Call to action: "AgentWork — The Agentic Economy on Arc"
     ```
  2. Create `scripts/record-demo.ps1`:
     - Start Docker containers (or local agents)
     - Wait for health checks to pass
     - Open browser to dashboard
     - Auto-trigger demo launch
     - Capture screenshots at key moments
  3. Add YouTube chapter markers
- **Success**:
  - [ ] Script covers all 6 scenes in under 3 minutes
  - [ ] Each scene has specific screen actions and talking points
  - [ ] Recording helper script starts all required services
  - [ ] YouTube chapters defined for navigation
- **Research References**:
  - #file:../research/20260416-agentwork-ultimate-blueprint.md (Lines 1-15) — Problem framing and core argument
  - AGENTS.md §15 — Timeline: Day 4 is "Demo + Submission"
- **Dependencies**:
  - All TIER 1 + TIER 2 features implemented (they're what gets recorded)
  - HF-1 through HF-7 should be working before recording

### Task C.3: Buffer / TIER 3 Features (Optional)

Implement optional jaw-dropper features based on time remaining. Follow cut priority order.

- **Files (if implemented)**:
  - **HF-9**: **NEW** `packages/dashboard/components/TaskDAG.tsx` — SVG DAG visualization
  - **HF-10**: **NEW** `packages/dashboard/app/api/arc-health/route.ts`, **NEW** `packages/dashboard/components/ArcHealth.tsx`
  - **HF-11**: **NEW** `packages/dashboard/components/AgentChat.tsx` — Chat bubble interface
- **Actions**:
  - **HF-9 (DAG, 2.5h, 6/10)**: Hand-code SVG for 4 nodes (research → code/test → review). No D3/dagre. Color-coded by agent type. Animate as tasks complete.
  - **HF-10 (Arc Health, 1.5h, 4/10)**: Server-side cache (10s). Fetch eth_blockNumber + eth_gasPrice from Arc RPC. Show in small component.
  - **HF-11 (Agent Chat, 2.0h, 7/10)**: Chat bubbles with typing animation. Mock responses (no x402 from browser). Left-aligned orchestrator, right-aligned agents.
- **Cut Priority**: HF-10 first (4/10) → HF-9 second (6/10) → keep HF-11 (7/10) if time permits
- **Success**:
  - [ ] Selected TIER 3 feature(s) implemented and working
  - [ ] TypeScript compiles clean after additions
  - [ ] No regression to existing features
- **Research References**:
  - `packages/orchestrator/src/decomposer.ts` — Subtask.dependsOn provides DAG structure
  - `packages/dashboard/components/AgentCard.tsx` (Lines 5-8) — Agent color scheme for DAG nodes
  - AGENTS.md §2 — ARC_RPC_URL for health monitor
- **Dependencies**:
  - Phase B completed
  - Time remaining in budget (these are optional)

---

## Dependencies

### Required (Must Have Before Starting)

- **Arc Testnet wallet funded** — `ORCHESTRATOR_PRIVATE_KEY` in .env, funded via https://faucet.circle.com
- **Supabase** — NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env, `task_events` table created
- **Node.js workspace** — `npm install` from project root
- **Python agents** — `pip install -r requirements.txt` in each agent directory
- **LLM_API_KEY** — Optional for HF-3, agents fall back to hardcoded without it

### Optional (Nice to Have)

- **Moccasin + Vyper** — `pip install moccasin vyper` for HF-7 contract deployment
- **Docker** — For HF-7 fallback if Moccasin doesn't work on Windows
- **OBS Studio or Loom** — For recording the demo video (HF-8)

## Success Criteria

- [ ] TypeScript compiles clean in both dashboard and orchestrator (`npx tsc --noEmit`)
- [ ] Demo Launcher button triggers full orchestrator pipeline from dashboard
- [ ] 60+ transactions visible in Evidence Gallery with arcscan links
- [ ] Economic Proof shows real-time savings (98%+ vs Stripe)
- [ ] Agent responses are context-aware when LLM_API_KEY is set
- [ ] Transaction Waterfall animates new payments with verification badges
- [ ] Agent metrics show real task counts and earnings
- [ ] Contracts deployed to Arc testnet (or documented why not)
- [ ] Demo video script covers all highlights in 3 minutes
- [ ] No hardcoded secrets in source code
- [ ] All feature additions are additive (no regressions to existing features)