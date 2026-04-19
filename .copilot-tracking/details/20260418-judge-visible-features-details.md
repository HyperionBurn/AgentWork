<!-- markdownlint-disable-file -->

# Task Details: Judge-Visible Impact Features

## Research Reference

**Source Research**: #file:../research/20260418-judge-visible-features-research.md

---

## Phase 1: Real-Time Charts (recharts)

### Task 1.1: Install recharts dependency

Install the recharts charting library and its types.

- **Files**:
  - `packages/dashboard/package.json` — Add `recharts` to dependencies
- **Success**:
  - `recharts` appears in package.json dependencies
  - `npm install` completes without errors
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 57-80) — Chart gap analysis
- **Dependencies**:
  - None

### Task 1.2: Create `/api/stats-timeseries` endpoint

New API route that returns time-bucketed transaction data for charts. Groups task_events by minute, returns `{ timestamp, count, totalAmount }[]`.

- **Files**:
  - `packages/dashboard/app/api/stats-timeseries/route.ts` — NEW
- **Success**:
  - GET returns array of `{ timestamp: string, count: number, totalAmount: number }`
  - Buckets by minute for last 60 minutes
  - Returns empty array when Supabase unavailable
  - Free endpoint (no withGateway payment)
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 82-95) — Data sources for charts
- **Dependencies**:
  - Task 1.1 completion (recharts not needed for API, but logical grouping)

### Task 1.3: Create `DashboardCharts.tsx` with 4 recharts visualizations

Build a composite chart component with 4 panels:
1. **Transaction Volume** (LineChart) — txns per minute over time
2. **Cost Accumulation** (ComposedChart) — Arc vs Stripe vs L2 cost lines
3. **Agent Throughput** (BarChart) — tasks completed per agent type
4. **Cumulative Savings** (AreaChart) — $ saved vs Stripe growing over time

- **Files**:
  - `packages/dashboard/components/DashboardCharts.tsx` — NEW
- **Success**:
  - 4 recharts components render in a 2×2 grid
  - Uses `"use client"` directive (Critic C2: SSR compatibility)
  - Responsive container for each chart
  - Arc purple/blue color theme matching tailwind config
  - Fallback empty state when no data
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 57-95) — Chart gap + data sources
- **Dependencies**:
  - Task 1.1 (recharts installed)
  - Task 1.2 (timeseries API endpoint)

### Task 1.4: Wire charts into page.tsx

Replace the EconomicChart bar-width section with DashboardCharts. Keep EconomicChart component for the economy page later.

- **Files**:
  - `packages/dashboard/app/page.tsx` — Add DashboardCharts import, add to layout
- **Success**:
  - DashboardCharts appears on homepage
  - Fetches from `/api/stats-timeseries` and `/api/agent-metrics`
  - EconomicChart still exists (not deleted) for later economy page
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 15-30) — Current page.tsx structure
- **Dependencies**:
  - Task 1.3 (DashboardCharts component)

### Task 1.5: TypeScript validation

Run `npx tsc --noEmit` in packages/dashboard.

- **Files**:
  - All modified/new files in Phase 1
- **Success**:
  - Zero TypeScript errors
  - All recharts components properly typed
- **Dependencies**:
  - All Phase 1 tasks complete

---

## Phase 2: Multi-Page Navigation

### Task 2.1: Create `NavSidebar.tsx` component

A persistent sidebar with route links, icons, active highlighting, and connection status.

- **Files**:
  - `packages/dashboard/components/NavSidebar.tsx` — NEW
- **Success**:
  - Renders vertically on desktop (left side, fixed)
  - Renders as bottom tabs on mobile (< 768px)
  - Routes: Home, Agents, Economy, Evidence, Governance, Settings, Submit
  - Active route highlighted with arc-purple
  - Connection status indicator (online/offline)
  - AgentWork logo at top
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 97-130) — Multi-page navigation analysis
- **Dependencies**:
  - None

### Task 2.2: Update `layout.tsx` with sidebar

Wrap `{children}` with NavSidebar in a flex layout. Add `usePathname` import.

- **Files**:
  - `packages/dashboard/app/layout.tsx` — Modify to include NavSidebar
- **Success**:
  - Sidebar visible on all pages
  - Content area scrollable independently
  - Mobile bottom tabs render correctly
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 97-130) — Navigation architecture
- **Dependencies**:
  - Task 2.1 (NavSidebar component)

### Task 2.3: Extract components into `app/agents/page.tsx`

Create the agents page with: AgentCard ×4, AgentRegistry, TaskDAGVisualization, AgentChat, AgentComparison.

- **Files**:
  - `packages/dashboard/app/agents/page.tsx` — NEW
- **Success**:
  - Page fetches own data from `/api/agent-health`, `/api/agent-metrics`, `/api/task-dag`
  - Each component receives correct props (Critic C1: independent data fetching)
  - `"use client"` directive
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 32-55) — Component dependency graph
- **Dependencies**:
  - Task 2.2 (layout with sidebar)

### Task 2.4: Extract components into `app/economy/page.tsx`

Create the economy page with: EconomicChart, RevenueDashboard, SpendingBudget, GasDashboard, TierSelector.

- **Files**:
  - `packages/dashboard/app/economy/page.tsx` — NEW
- **Success**:
  - Page fetches own data from `/api/task-status`, `/api/revenue`, `/api/gas-costs`
  - EconomicChart receives `liveCost` and `totalTransactions` props
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 32-55) — Component dependency graph
- **Dependencies**:
  - Task 2.2 (layout with sidebar)

### Task 2.5: Extract components into `app/governance/page.tsx`

Create the governance page with: GovernancePanel, AgentStaking, WalletConnect.

- **Files**:
  - `packages/dashboard/app/governance/page.tsx` — NEW
- **Success**:
  - Page fetches own data from `/api/governance`, `/api/staking`
  - WalletConnect receives correct props
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 32-55) — Component dependency graph
- **Dependencies**:
  - Task 2.2 (layout with sidebar)

### Task 2.6: Extract components into `app/settings/page.tsx`

Create the settings page with: BridgeStatus, SessionExport, TaskTemplates, ArcHealthMonitor.

- **Files**:
  - `packages/dashboard/app/settings/page.tsx` — NEW
- **Success**:
  - Page fetches own data from `/api/bridge-status`
  - ArcHealthMonitor self-contained (fetches directly)
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 32-55) — Component dependency graph
- **Dependencies**:
  - Task 2.2 (layout with sidebar)

### Task 2.7: Simplify `app/page.tsx` to Hero + Feed + Launcher only

Remove all components that were extracted to sub-pages. Keep only: Header stats grid, DemoLauncher, TaskFeed, TxList, PaymentFlowAnimation (Phase 3), DashboardCharts.

- **Files**:
  - `packages/dashboard/app/page.tsx` — Remove extracted component imports and JSX
- **Success**:
  - Homepage is clean: stats → launcher → charts → feed → tx list
  - All 22 components still exist somewhere (no deletions)
  - Navigation sidebar provides access to all sub-pages
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 15-30) — Current page.tsx structure
- **Dependencies**:
  - Tasks 2.3-2.6 (all sub-pages created)

### Task 2.8: TypeScript validation

Run `npx tsc --noEmit` in packages/dashboard.

- **Files**:
  - All modified/new files in Phase 2
- **Success**:
  - Zero TypeScript errors
  - All new pages compile correctly
- **Dependencies**:
  - All Phase 2 tasks complete

---

## Phase 3: Submission Page + Animated Flow + Continuous Mode

### Task 3.1: Create `app/submit/page.tsx` with judge-facing content

Build a polished submission page with: project summary, architecture diagram (SVG), key metrics, team info, evidence links, video embed placeholder.

- **Files**:
  - `packages/dashboard/app/submit/page.tsx` — NEW
- **Success**:
  - Fetches live metrics from `/api/task-status`, `/api/agent-metrics`, `/api/evidence`
  - Falls back to hardcoded defaults when data unavailable (Critic C5)
  - Architecture diagram rendered as inline SVG
  - Arc contract addresses displayed (even if empty/undeployed)
  - "What We Built" narrative section
  - Link to demo video placeholder
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 175-205) — Submission page structure
- **Dependencies**:
  - Phase 2 complete (navigation to reach /submit)

### Task 3.2: Create `PaymentFlowAnimation.tsx` with SVG animation

Animated SVG showing USDC coins flowing Orchestrator → Gateway → Arc → Agent.

- **Files**:
  - `packages/dashboard/components/PaymentFlowAnimation.tsx` — NEW
- **Success**:
  - 4 horizontal nodes with connecting paths
  - Animated coin circles following SVG paths
  - Subtle pulse mode by default (Critic C4)
  - Agent node branches to 4 sub-nodes (research/code/test/review)
  - Accepts `activeAgent` prop to highlight active agent
  - Responsive (works on mobile)
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 132-165) — SVG animation approach
- **Dependencies**:
  - None (can be built independently)

### Task 3.3: Extend `DemoLauncher.tsx` with continuous mode toggle

Add a toggle between "One-Shot" and "Live" modes. Live mode shows pulsing "🔴 LIVE" indicator and stop button.

- **Files**:
  - `packages/dashboard/components/DemoLauncher.tsx` — Modify
- **Success**:
  - Toggle between "One-Shot" (current behavior) and "Live" (continuous)
  - Live mode: shows red pulsing indicator, interval selector (5s/10s/15s)
  - Stop button kills the continuous process
  - State persists across mode switches
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 167-195) — Continuous mode extension
- **Dependencies**:
  - Task 3.4 (API route support)

### Task 3.4: Extend `demo-launch/route.ts` for continuous mode

Support `{ mode: "continuous", interval: 10000 }` in POST body. Orchestrator loops internally.

- **Files**:
  - `packages/dashboard/app/api/demo-launch/route.ts` — Modify
- **Success**:
  - POST accepts `mode: "continuous"` with configurable `interval` (min 5000ms)
  - Continuous mode spawns orchestrator with loop flag
  - GET returns `{ status: "running", mode: "continuous", iterations: N }`
  - DELETE or POST `{ action: "stop" }` kills the continuous process
  - AbortSignal cleanup on client disconnect (Critic C6)
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 167-195) — Continuous mode design
- **Dependencies**:
  - None (API route change is independent)

### Task 3.5: TypeScript validation + final integration check

Validate all Phase 3 code compiles and pages render.

- **Files**:
  - All modified/new files in Phase 3
- **Success**:
  - Zero TypeScript errors
  - `/submit` renders with live metrics
  - PaymentFlowAnimation visible on homepage
  - Continuous mode works end-to-end
- **Dependencies**:
  - All Phase 3 tasks complete

---

## Phase 4: Polish (Sound + Keyboard + Mobile)

### Task 4.1: Add sound effects via Web Audio API hook

Create a `useSoundEffect` hook and add subtle audio cues for payment completion, agent processing, and pipeline finish.

- **Files**:
  - `packages/dashboard/hooks/useSoundEffect.ts` — NEW
  - `packages/dashboard/public/sounds/` — Directory for audio files (or use Web Audio API synthesis)
- **Success**:
  - Hook accepts sound name, plays on trigger
  - 3 sound effects: ka-ching (payment), whoosh (agent start), fanfare (pipeline complete)
  - Sound toggle button in NavSidebar (default: off)
  - Uses Web Audio API oscillator for zero-file-size sounds
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 207-215) — Sound effects approach
- **Dependencies**:
  - Phase 2 complete (NavSidebar exists)

### Task 4.2: Add keyboard shortcuts with `?` overlay

Create a `useKeyboardShortcuts` hook and shortcut overlay.

- **Files**:
  - `packages/dashboard/hooks/useKeyboardShortcuts.ts` — NEW
  - `packages/dashboard/components/ShortcutOverlay.tsx` — NEW
- **Success**:
  - Shortcuts: Space (run demo), E (evidence), 1-4 (agents page, focus agent), ? (show overlay)
  - Overlay shows all available shortcuts
  - Disabled when typing in input fields
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 217-225) — Keyboard shortcuts
- **Dependencies**:
  - Phase 2 complete (navigation routes exist)

### Task 4.3: Mobile responsive audit + fixes

Audit all pages for mobile rendering and add fixes.

- **Files**:
  - `packages/dashboard/components/NavSidebar.tsx` — Bottom tab bar for mobile
  - `packages/dashboard/app/page.tsx` — Stack layout on mobile
  - `packages/dashboard/app/agents/page.tsx` — Card stack on mobile
  - `packages/dashboard/app/economy/page.tsx` — Chart stacking on mobile
  - `packages/dashboard/app/globals.css` — Mobile breakpoint utilities
- **Success**:
  - All pages render correctly at 375px width (iPhone SE)
  - Bottom tab navigation works on touch devices
  - Charts resize responsively
  - No horizontal scroll on any page
- **Research References**:
  - #file:../research/20260418-judge-visible-features-research.md (Lines 227-235) — Mobile responsive approach
- **Dependencies**:
  - Phase 2 complete (all pages exist)

### Task 4.4: Final TypeScript validation + changes tracking

Full validation pass and update changes tracking file.

- **Files**:
  - All files across all phases
  - `.copilot-tracking/changes/20260418-judge-visible-features-changes.md`
- **Success**:
  - `npx tsc --noEmit` passes in packages/dashboard
  - All changes tracked in changes file
  - All plan items checked off
- **Dependencies**:
  - All Phase 4 tasks complete

---

## Dependencies

- recharts ^2.12.0
- Next.js 14 App Router (already installed)
- All existing API routes (task-status, agent-metrics, evidence, revenue)
- Supabase task_events table with time-series data

## Success Criteria

- [ ] `npx tsc --noEmit` passes in packages/dashboard after each phase
- [ ] Dashboard has 7 navigable pages (/ + /agents + /economy + /evidence + /governance + /settings + /submit)
- [ ] 4 recharts visualizations render with live data
- [ ] Animated SVG payment flow visible on homepage
- [ ] Continuous demo mode runs indefinitely with stop button
- [ ] /submit page shows all key metrics and architecture diagram
- [ ] All 22 existing components preserved with zero functionality loss
- [ ] Critic conditions C1-C6 all addressed
