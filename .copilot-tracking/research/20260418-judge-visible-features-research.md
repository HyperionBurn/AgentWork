<!-- markdownlint-disable-file -->

# Research: Judge-Visible Impact Features

**Date**: 2026-04-18
**Scope**: Tier 1 (Judge-Visible), Tier 2 (Polish), Tier 3 (Technical Depth)
**Total Features**: 15

---

## 1. Current Dashboard Architecture

### 1.1 Single-Page Monolith (page.tsx)

`packages/dashboard/app/page.tsx` renders **22 components** in a single scroll:

```
Header (sticky)
  → Connection indicator, SessionExport, Evidence link, Arc Explorer link
Stats Grid (4 cards)
  → totalTasks, completed, totalSpent, totalOnChainTransactions
DemoLauncher
  → Configurable 1-25 runs, spawns orchestrator via child_process
Two-column layout (1/3 + 2/3):
  Left column:
    AgentCard ×4, EconomicChart, ArcHealthMonitor, GasDashboard, TierSelector,
    AgentStaking, WalletConnect, BridgeStatus, AgentRegistry, EscrowTimeline
  Right column:
    TaskDAGVisualization, TaskFeed, AgentChat, TxList, MarketplaceView,
    RevenueDashboard + SpendingBudget (2-col), AgentComparison, GovernancePanel, TaskTemplates
Footer
```

### 1.2 Routing Structure

```
/                    → page.tsx (22 components)
/evidence            → evidence/page.tsx (separate, works ✅)
/api/*               → 17 API routes
```

No other pages exist. `/agents`, `/economy`, `/governance`, `/settings`, `/submit` do NOT exist.

### 1.3 Component Dependency Graph

```
page.tsx
  ├── TaskFeed (tasks: TaskEvent[])
  ├── AgentCard ×4 (agent: AgentInfo, metrics?: AgentMetrics)
  ├── TxList (transactions: TxEntry[])
  ├── EconomicChart (liveCost?: string, totalTransactions?: number)
  ├── TaskDAGVisualization (fetches /api/task-dag)
  ├── ArcHealthMonitor (fetches RPC + Gateway directly)
  ├── AgentChat (self-contained demo)
  ├── DemoLauncher (POST /api/demo-launch)
  ├── SessionExport (export session data)
  └── [12 more components — each self-contained]
```

### 1.4 Data Flow

```
Supabase Realtime → subscribeToTasks() → fetchTasks() → setTasks → components
                      (100ms debounce)
Orchestrator → Supabase task_events → Realtime → Dashboard
                task_events table has: id, task_id, agent_type, status,
                gateway_tx, amount, result, error, created_at
```

---

## 2. Charting Gap Analysis

### 2.1 Current State: Zero Chart Libraries

`packages/dashboard/package.json` dependencies:
```json
{
  "@circle-fin/x402-batching": "^2.1.0",
  "@supabase/supabase-js": "^2.49.0",
  "@x402/core": "^2.10.0",
  "@x402/evm": "^2.10.0",
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "viem": "^2.22.0"
}
```

No `recharts`, `chart.js`, `d3`, `nivo`, or any visualization library.

### 2.2 Current EconomicChart Implementation

`EconomicChart.tsx` uses:
- `useAnimatedCounter` hook with `requestAnimationFrame` + `easeOutCubic` for number animation
- Plain `<div>` bars with `style={{ width: percentage }}` for comparison
- Static props: `liveCost?: string`, `totalTransactions?: number`
- Computes: `arcCost`, `stripeCost = txCount × 0.30`, `l2Cost = txCount × 0.10`

This is clever but limited — no time series, no multi-series, no interactivity.

### 2.3 Recommended Library: recharts

**Why recharts**: React-native, declarative, small bundle, widely used, composable.

```bash
npm install recharts
```

Key chart types needed:
1. `LineChart` — transaction volume over time
2. `AreaChart` — cumulative cost savings
3. `BarChart` — agent throughput comparison
4. `ComposedChart` — overlay cost curves

### 2.4 Data Sources for Charts

All available from existing API routes:

| Chart | Data Source | API Route |
|-------|------------|-----------|
| Tx Volume Over Time | task_events grouped by minute | `/api/task-status` (needs time-series extension) |
| Cost Accumulation | task_events.amount sum over time | `/api/task-status` + `/api/revenue` |
| Agent Throughput | task_events grouped by agent_type | `/api/agent-metrics` |
| Cumulative Savings | computed from cost data | Derived client-side |

**Gap**: No time-series API endpoint exists. Need `/api/stats-timeseries` that returns `{ timestamp, count, totalAmount }[]` grouped by minute.

---

## 3. Multi-Page Navigation Analysis

### 3.1 Next.js App Router Structure

Current:
```
app/
  layout.tsx
  page.tsx          ← 22 components, monolith
  globals.css
  evidence/
    page.tsx        ← separate page ✅
  api/
    [17 routes]
```

Proposed:
```
app/
  layout.tsx         ← Add navigation sidebar/tabs
  page.tsx           ← Hero + Feed + Launcher only
  agents/page.tsx    ← Agent cards + metrics + DAG + chat
  economy/page.tsx   ← EconomicChart + Revenue + Spending + Gas + Tiers
  evidence/page.tsx  ← Already exists ✅
  governance/page.tsx ← Governance + Staking + Wallet
  settings/page.tsx  ← Bridge + Export + Templates
  submit/page.tsx    ← Judge-facing submission page
```

### 3.2 Shared State Strategy

Problem: Each page needs access to `tasks`, `agents`, `stats`, `agentMetrics`.
Options:
- **A) URL state + fetch per page** — simplest, each page fetches own data
- **B) React Context** — shared provider, data fetched once
- **C) Zustand/Jotai** — global state store

Recommendation: **Option A** for hackathon speed. Each page calls existing API routes. No shared state complexity.

### 3.3 Navigation Component

A `NavSidebar` or `NavTabs` component in `layout.tsx`:
- Fixed sidebar on desktop (left)
- Bottom tabs on mobile
- Icons + labels for each route
- Active route highlight
- Connection status indicator

---

## 4. Animated Payment Flow

### 4.1 SVG Animation Approach

Create a `PaymentFlowAnimation.tsx` component:
- SVG with fixed nodes: Orchestrator → Gateway → Arc → Agent
- Animated circles (USDC "coins") following `<path>` elements
- CSS `@keyframes` or `requestAnimationFrame` for coin movement
- Trigger animation when new task event arrives (via TaskFeed data)
- Agent endpoint lights up when active

### 4.2 Implementation Pattern

```tsx
// Simplified pattern:
<svg viewBox="0 0 800 120">
  {/* Connection lines */}
  <line x1="100" y1="60" x2="300" y2="60" className="stroke-gray-600" />
  <line x1="300" y1="60" x2="500" y2="60" className="stroke-gray-600" />
  <line x1="500" y1="60" x2="700" y2="60" className="stroke-gray-600" />

  {/* Nodes */}
  <circle cx="100" cy="60" r="30" /> {/* Orchestrator */}
  <circle cx="300" cy="60" r="30" /> {/* Gateway */}
  <circle cx="500" cy="60" r="30" /> {/* Arc */}
  <circle cx="700" cy="60" r="30" /> {/* Agent */}

  {/* Animated coin */}
  <circle r="6" fill="#7C3AED">
    <animateMotion dur="2s" repeatCount="indefinite" path="M100,60 L300,60 L500,60 L700,60" />
  </circle>
</svg>
```

---

## 5. Live Continuous Mode

### 5.1 Current DemoLauncher

`DemoLauncher.tsx` flow:
1. User clicks "Run Demo" with configurable runs (1-25)
2. POST `/api/demo-launch` → spawns `npx tsx src/index.ts` with `DEMO_RUNS=N`
3. Orchestrator runs N iterations, writes to Supabase, exits
4. Dashboard polls GET `/api/demo-launch` every 3s until idle

### 5.2 Continuous Mode Extension

Add a toggle: "One-Shot" vs "Continuous" mode.

**Continuous mode**:
- POST `/api/demo-launch` with `{ mode: "continuous", interval: 10000 }`
- API route spawns orchestrator with `DEMO_RUNS=1`, then on exit, waits interval, spawns again
- Loop until user clicks "Stop"
- Dashboard shows pulsing "🔴 LIVE" indicator

### 5.3 API Route Changes

```typescript
// In demo-launch/route.ts:
interface ContinuousState {
  mode: "oneshot" | "continuous";
  interval: number;  // ms between runs
  iterations: number; // total completed
  running: boolean;
}
```

---

## 6. Submission Page

### 6.1 Content Structure

A static page at `/submit` with:

```markdown
# AgentWork — Hackathon Submission

## Team
[team info]

## What We Built
[narrative]

## Architecture
[diagram + description]

## Key Metrics
- Transactions: XX
- Cost savings: XX%
- Agents: 4 specialist AI agents
- Smart contracts: 5 Vyper contracts

## Technical Highlights
- x402 nanopayment protocol
- ERC-8004 agent identity
- Circle Gateway batch settlement
- Real-time dashboard with Supabase

## Evidence
[links to arcscan, screenshots]

## Video
[embedded demo video]
```

### 6.2 Dynamic Metrics

The submission page should fetch real metrics:
- GET `/api/task-status` → total tx count
- GET `/api/agent-metrics` → per-agent stats
- GET `/api/evidence` → verified transactions
- GET `/api/revenue` → revenue summary

---

## 7. Tier 2 Features — Research

### 7.1 Sound Effects
- Use Web Audio API or simple `<audio>` elements
- Store small .mp3 files in `public/sounds/`
- Trigger via custom React hook: `useSoundEffect("ka-ching")`

### 7.2 Share Dashboard
- Serialize current dashboard state to JSON
- POST to Supabase `dashboard_snapshots` table
- Generate shareable URL: `/share/{uuid}`
- Public page reads snapshot and renders read-only view

### 7.3 Keyboard Shortcuts
- React hook: `useKeyboardShortcuts(map)`
- Listen for `keydown` events on `document`
- Show overlay with `?` key

### 7.4 Agent Response Streaming
- SSE endpoint `/api/stream` already exists (route.ts)
- Currently sends mock enriched events
- Could be extended to stream real agent responses
- Agent chat component already has progressive typing

### 7.5 Mobile Responsive
- Current: `grid-cols-1 lg:grid-cols-3`
- Need: Collapsible sections, bottom nav, touch-friendly cards
- Most impactful with the multi-page refactor (Feature 2)

---

## 8. Tier 3 Features — Research

### 8.1 Integration Test
- `scripts/dry-run.ts` exists with mock servers
- Need proper vitest integration test with assertions
- Test: start agents → run orchestrator → verify Supabase → check API routes

### 8.2 Performance Benchmarking
- New API route: `/api/benchmarks`
- Records timing data in task_events (agent response time, payment latency)
- New page: `/benchmarks` with comparison table

### 8.3 OpenAPI Spec
- Use `next-openapi` or manual swagger.json
- All 17 routes documented with request/response schemas

### 8.4 Multi-Task Templates
- Extend `DemoLauncher` with template selector
- Templates: REST API, Research Paper, Debug, Architecture, Documentation
- Each template sets `DEMO_TASK` env var differently

---

## 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| recharts bundle size slows dashboard | Low | Low | recharts is ~45KB gzipped, acceptable |
| Multi-page refactor breaks state | Medium | High | Each page fetches independently (Option A) |
| SVG animation perf on low-end | Low | Medium | Use CSS transforms, not JS animation |
| Continuous mode overwhelms Supabase | Low | Medium | Cap at 100 iterations, 5s minimum interval |
| Submission page looks unfinished | Low | High | Use polished template with screenshots |

---

## 10. Implementation Order Recommendation

Based on judge impact × implementation effort:

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | #1 Recharts + live charts | 2-3h | 🔴 Very High |
| P0 | #2 Multi-page navigation | 3-4h | 🔴 Very High |
| P0 | #5 Submission page | 1-2h | 🔴 High |
| P1 | #3 Animated payment flow | 2-3h | 🟡 High |
| P1 | #4 Live continuous mode | 1-2h | 🟡 High |
| P2 | #6 Mobile responsive | 2h | 🟡 Medium |
| P2 | #7 Sound effects | 0.5h | 🟡 Medium |
| P2 | #10 Keyboard shortcuts | 0.5h | 🟡 Medium |
| P3 | #8 Agent response quality | 2h | 🟢 Medium |
| P3 | #9 Share dashboard | 2h | 🟢 Medium |
| P3 | #14 Agent response streaming | 2h | 🟢 Medium |
| P4 | #11-13, #15 | 3-4h each | 🟢 Nice-to-have |
