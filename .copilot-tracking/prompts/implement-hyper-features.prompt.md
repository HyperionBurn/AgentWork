---
mode: agent
model: Claude Sonnet 4
---

<!-- markdownlint-disable-file -->

# Implementation Prompt: AgentWork Hyper Features — Hackathon Landslide Win

## Implementation Instructions

### Step 1: Create Changes Tracking File

You WILL create `20260418-hyper-features-changes.md` in #file:../changes/ if it does not exist.

### Step 2: Execute Implementation

You WILL follow #file:../../.github/instructions/task-implementation.instructions.md
You WILL systematically implement #file:../plans/20260418-hyper-features-plan.instructions.md task-by-task
You WILL follow ALL project standards and conventions

**CRITICAL CONTEXT — Read BEFORE starting**:

1. **AGENTS.md** (#file:../../AGENTS.md) — Project identity, Arc blockchain constants, SDK API surface, coding standards
2. **Verified SDK Patterns** — GatewayClient uses chain: "arcTestnet", PayResult uses `.transaction` (NOT `.transactionHash`), Balances uses `balances.gateway.formattedAvailable`
3. **USDC on Arc** — 6 decimals, $0.005 = 5000 atomic units, use dollar-prefixed strings with SDK
4. **Explorer URL** — `https://testnet.arcscan.io/tx/{hash}` (NOT arcscan.app)
5. **Feature Flags** — All features behind `FEATURES.useX` in `packages/orchestrator/src/config.ts`
6. **Mock Fallback Pattern** — All contract interactions check `isContractDeployed()` first, fall back to `MOCK_0x` prefixed tx hashes
7. **Barrel Export** — `packages/orchestrator/src/economy/index.ts` re-exports all sub-modules

**5 MANDATORY MODIFICATIONS (from RALPLAN consensus)**:

- **M1**: Demo Launcher = local-dev-only, no Docker cross-container spawn. Use `child_process.spawn` with sanitization and AbortSignal.
- **M2**: Skip response time metric in Agent Performance Metrics. No `started_at` schema migration.
- **M3**: Use `<pre>` blocks for agent response rendering. Do NOT add `react-markdown` or `remark-gfm`.
- **M4**: Pre-validate Moccasin/Vyper on Windows BEFORE committing 3h to contract deployment.
- **M5**: Run 1 test orchestrator execution FIRST to verify tx hash count before building visual features.

**Implementation Phases**:

- **Phase A (Day 0)**: M5 Validation → HF-3 Real LLM → HF-2 Demo Launcher
- **Phase B (Day 1)**: HF-1 Waterfall → HF-4 Economic Proof → HF-5 Evidence Gallery → HF-6 Agent Metrics
- **Phase C (Day 2)**: HF-7 Contract Deployment → HF-8 Video Script → TIER 3 buffer
- **Phase D (Day 3-4)**: Record video → Stress test → Polish → Submit

**CRITICAL**: If ${input:phaseStop:true} is true, you WILL stop after each Phase for user review.
**CRITICAL**: If ${input:taskStop:false} is true, you WILL stop after each Task for user review.

### Phase A: Foundation + Validation

#### Task A.0: M5 Validation (0.5h)
- Run orchestrator with DEMO_RUNS=1
- Count unique tx hashes in output
- Document findings: real vs MOCK_, unique hash count, strategy for 60+

#### Task A.1: HF-3 Real Agent Intelligence (2.5h)
- Add `openai>=1.0.0` to each agent's `requirements.txt`
- Enhance `agents/*/llm_client.py` system prompts per agent type
- Modify `TaskFeed.tsx` — render responses in `<pre className="whitespace-pre-wrap text-xs">` (M3)
- Add collapsible detail panel for long responses
- Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 57-120)

#### Task A.2: HF-2 One-Click Demo Launcher (4.0h)
- Create `app/api/demo-launch/route.ts` — POST spawns orchestrator, singleton tracker, AbortSignal
- Create `components/DemoLauncher.tsx` — Button with idle→running→complete states
- Add to `page.tsx` hero stats area
- Security: input sanitization `/^[\w\s.,!?-]+$/`, no `shell: true`
- Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 122-210)

### Phase B: Visual + Proof

#### Task B.1: HF-1 Live Transaction Waterfall (2.5h)
- Add `waterfall-slide` + `waterfall-glow` CSS keyframes to `globals.css`
- Modify `TaskFeed.tsx` — animated cascade, green ✅/amber ⏳ badges
- Debounce Supabase Realtime inserts (100ms batch)
- Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 212-275)

#### Task B.2: HF-4 Economic Proof Engine (1.5h)
- Redesign `EconomicChart.tsx` — Live Economic Proof with animated counters
- Wire real data: arcCost, stripeCost, l2Cost from tx count
- Add `useAnimatedCounter` hook with requestAnimationFrame
- Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 277-330)

#### Task B.3: HF-5 Transaction Evidence Gallery (2.0h)
- Create `app/evidence/page.tsx` — Full-page evidence with filterable table
- Create `app/api/evidence/route.ts` — Query task_events, filter real hashes
- Add "📊 View Evidence" link in header
- Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 332-390)

#### Task B.4: HF-6 Agent Performance Metrics (1.5h)
- Create `app/api/agent-metrics/route.ts` — FREE route, no withGateway
- Modify `AgentCard.tsx` — 3-column metrics grid (tasks, earnings, success rate)
- No response time (M2), no schema migration
- Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 392-450)

### Phase C: Contracts + Polish

#### Task C.1: HF-7 Smart Contract Deployment (3.0h ±1.5h)
- Pre-validate Moccasin/Vyper on Windows: `moccasin --version` (M4)
- If works: deploy IdentityRegistry → ReputationRegistry
- If fails: try WSL or Docker fallback
- Update .env with addresses
- Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 452-520)

#### Task C.2: HF-8 Demo Video Script (1.0h)
- Create `docs/demo-video-script.md` — 6 scenes, 3 minutes
- Create `scripts/record-demo.ps1` — Recording helper
- Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 522-570)

#### Task C.3: TIER 3 Buffer (remaining time)
- Pick from HF-9 (DAG), HF-10 (Arc Health), HF-11 (Agent Chat)
- Cut priority: HF-10 first → HF-9 second → keep HF-11
- Details: .copilot-tracking/details/20260418-hyper-features-details.md (Lines 572-650)

### Step 3: Cleanup

When ALL Phases are checked off (`[x]`) and completed you WILL do the following:

1. You WILL provide a markdown style link and a summary of all changes from #file:../changes/20260418-hyper-features-changes.md to the user:

   - You WILL keep the overall summary brief
   - You WILL add spacing around any lists
   - You MUST wrap any reference to a file in a markdown style link

2. You WILL provide markdown style links to .copilot-tracking/plans/20260418-hyper-features-plan.instructions.md, .copilot-tracking/details/20260418-hyper-features-details.md, and .copilot-tracking/research/20260416-agentwork-ultimate-blueprint.md documents. You WILL recommend cleaning these files up as well.

3. **MANDATORY**: You WILL attempt to delete .copilot-tracking/prompts/implement-hyper-features.prompt.md

## Success Criteria

- [ ] Changes tracking file created and updated throughout implementation
- [ ] All TIER 1 features implemented (HF-1, HF-2, HF-3, HF-4)
- [ ] All TIER 2 features implemented (HF-5, HF-6, HF-7, HF-8)
- [ ] TypeScript compiles clean: `npx tsc --noEmit` passes in both dashboard and orchestrator
- [ ] All 5 mandatory modifications (M1-M5) incorporated
- [ ] No hardcoded private keys or API tokens in source
- [ ] All new constants use env vars from .env.example
- [ ] Existing features unbroken (no regressions)
- [ ] Feature flags added for significant runtime behavior changes
- [ ] Project conventions followed (strict TS, named exports, no `any` types)