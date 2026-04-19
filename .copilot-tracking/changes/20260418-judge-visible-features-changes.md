# Changes Tracking: Judge-Visible Impact Features

**Plan**: .copilot-tracking/plans/20260418-judge-visible-features-plan.instructions.md
**Details**: .copilot-tracking/details/20260418-judge-visible-features-details.md
**Started**: 2026-04-18
**Status**: PLANNED — RALPLAN consensus approved, awaiting implementation

## Phase 1: Real-Time Charts

- [x] Task 1.1: Install recharts
- [x] Task 1.2: Create /api/stats-timeseries endpoint
- [x] Task 1.3: Create DashboardCharts.tsx (4 charts)
- [x] Task 1.4: Wire charts into page.tsx
- [x] Task 1.5: TypeScript validation ✅

## Phase 2: Multi-Page Navigation

- [ ] Task 2.1: Create NavSidebar.tsx
- [ ] Task 2.2: Update layout.tsx with sidebar
- [ ] Task 2.3: Create app/agents/page.tsx
- [ ] Task 2.4: Create app/economy/page.tsx
- [ ] Task 2.5: Create app/governance/page.tsx
- [ ] Task 2.6: Create app/settings/page.tsx
- [ ] Task 2.7: Simplify page.tsx
- [ ] Task 2.8: TypeScript validation

## Phase 3: Submission + Animated Flow + Continuous Mode

- [ ] Task 3.1: Create app/submit/page.tsx
- [ ] Task 3.2: Create PaymentFlowAnimation.tsx
- [ ] Task 3.3: Extend DemoLauncher with continuous mode
- [ ] Task 3.4: Extend demo-launch/route.ts for continuous mode
- [ ] Task 3.5: TypeScript validation

## Phase 4: Polish

- [ ] Task 4.1: Sound effects hook
- [ ] Task 4.2: Keyboard shortcuts + overlay
- [ ] Task 4.3: Mobile responsive audit
- [ ] Task 4.4: Final validation + tracking

## RALPLAN Consensus Notes

- **Critic C1**: Each page fetches independently (no shared state)
- **Critic C2**: recharts uses "use client" (SSR safe)
- **Critic C3**: NavSidebar wraps all pages equally
- **Critic C4**: PaymentFlowAnimation subtle pulse default
- **Critic C5**: /submit page falls back to hardcoded metrics
- **Critic C6**: Continuous mode has AbortSignal cleanup
