---
mode: agent
model: Claude Sonnet 4
---

<!-- markdownlint-disable-file -->

# Implementation Prompt: Judge-Visible Impact Features

## Implementation Instructions

### Step 1: Create Changes Tracking File

You WILL create `20260418-judge-visible-features-changes.md` in #file:../changes/ if it does not exist.

### Step 2: Execute Implementation

You WILL follow #file:../../.github/instructions/task-implementation.instructions.md
You WILL systematically implement #file:../plans/20260418-judge-visible-features-plan.instructions.md task-by-task
You WILL follow ALL project standards and conventions in #file:../../AGENTS.md

**CRITICAL CONSTRAINTS FROM RALPLAN CONSENSUS**:

1. **Critic C1**: Each new page fetches its own data from existing API routes. NO shared global state.
2. **Critic C2**: All recharts components MUST use `"use client"` directive. NO SSR imports.
3. **Critic C3**: NavSidebar wraps ALL pages equally including /evidence. No special-case layouts.
4. **Critic C4**: PaymentFlowAnimation uses subtle pulse mode by default. Full animation only on last 5 txns.
5. **Critic C5**: /submit page falls back to hardcoded metrics when Supabase is empty/unreachable.
6. **Critic C6**: Continuous mode has AbortSignal cleanup. On client disconnect, send SIGTERM.

**SDK CONSTRAINTS** (from AGENTS.md §2, §4):
- `chain: "arcTestnet"` (NOT "arc")
- `result.transaction` (NOT `.transactionHash`)
- `balances.gateway.formattedAvailable` (NOT `.available`)
- USDC has 6 decimals (NOT 18)
- Explorer URL: `https://testnet.arcscan.io/tx/`

**FEATURE ORDER**: Phase 1 (Charts) → Phase 2 (Navigation) → Phase 3 (Submit+Flow+Continuous) → Phase 4 (Polish)

**CRITICAL**: If ${input:phaseStop:true} is true, you WILL stop after each Phase for user review.
**CRITICAL**: If ${input:taskStop:false} is true, you WILL stop after each Task for user review.

### Phase 1: Real-Time Charts

1. Install recharts: `cd packages/dashboard && npm install recharts`
2. Create `app/api/stats-timeseries/route.ts` — Time-bucketed tx data (free endpoint)
3. Create `components/DashboardCharts.tsx` — 4 recharts in 2×2 grid:
   - Transaction Volume (LineChart) — txns/minute
   - Cost Accumulation (ComposedChart) — Arc vs Stripe vs L2
   - Agent Throughput (BarChart) — per agent type
   - Cumulative Savings (AreaChart) — $ saved vs Stripe
4. Wire into `page.tsx` — Replace EconomicChart bar section, keep component
5. Validate: `npx tsc --noEmit`

### Phase 2: Multi-Page Navigation

1. Create `components/NavSidebar.tsx` — Desktop sidebar + mobile bottom tabs
2. Update `layout.tsx` — Wrap children with NavSidebar
3. Create `app/agents/page.tsx` — AgentCard×4, AgentRegistry, TaskDAG, AgentChat, AgentComparison
4. Create `app/economy/page.tsx` — EconomicChart, RevenueDashboard, SpendingBudget, GasDashboard, TierSelector, DashboardCharts (move charts here)
5. Create `app/governance/page.tsx` — GovernancePanel, AgentStaking, WalletConnect
6. Create `app/settings/page.tsx` — BridgeStatus, SessionExport, TaskTemplates, ArcHealthMonitor
7. Simplify `page.tsx` — Keep only: stats grid, DemoLauncher, PaymentFlowAnimation (Phase 3), TaskFeed, TxList
8. Validate: `npx tsc --noEmit`

### Phase 3: Submission + Animated Flow + Continuous Mode

1. Create `app/submit/page.tsx` — Judge-facing with live metrics + fallback (C5)
2. Create `components/PaymentFlowAnimation.tsx` — SVG with coin animation (C4: subtle pulse default)
3. Extend `DemoLauncher.tsx` — Continuous mode toggle + stop button
4. Extend `demo-launch/route.ts` — Continuous mode with AbortSignal (C6)
5. Validate: `npx tsc --noEmit`

### Phase 4: Polish

1. Create `hooks/useSoundEffect.ts` — Web Audio API synthesis (ka-ching, whoosh, fanfare)
2. Create `hooks/useKeyboardShortcuts.ts` + `ShortcutOverlay.tsx` — Space, E, 1-4, ?
3. Mobile responsive audit — Test all pages at 375px, fix layouts
4. Final validation + changes tracking update

### Step 3: Cleanup

When ALL Phases are checked off (`[x]`) and completed you WILL do the following:

1. You WILL provide a markdown style link and a summary of all changes from #file:../changes/20260418-judge-visible-features-changes.md to the user:

   - You WILL keep the overall summary brief
   - You WILL add spacing around any lists
   - You MUST wrap any reference to a file in a markdown style link

2. You WILL provide markdown style links to .copilot-tracking/plans/20260418-judge-visible-features-plan.instructions.md, .copilot-tracking/details/20260418-judge-visible-features-details.md, and .copilot-tracking/research/20260418-judge-visible-features-research.md documents. You WILL recommend cleaning these files up as well.
3. **MANDATORY**: You WILL attempt to delete .copilot-tracking/prompts/implement-judge-visible-features.prompt.md

## Success Criteria

- [ ] Changes tracking file created
- [ ] All plan items implemented with working code
- [ ] All detailed specifications satisfied
- [ ] Project conventions followed (AGENTS.md)
- [ ] Critic conditions C1-C6 all addressed
- [ ] TypeScript compiles clean after each phase
