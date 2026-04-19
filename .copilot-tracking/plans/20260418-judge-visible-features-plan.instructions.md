---
applyTo: ".copilot-tracking/changes/20260418-judge-visible-features-changes.md"
---

<!-- markdownlint-disable-file -->

# Task Checklist: Judge-Visible Impact Features

## Overview

Transform the AgentWork dashboard from a single-page prototype with 22 components into a polished multi-page application with real-time charting, animated payment flow visualization, continuous demo mode, and a judge-facing submission page.

## Objectives

- Add recharts library with 4 live-updating charts (tx volume, cost accumulation, agent throughput, cumulative savings)
- Refactor page.tsx into 6 pages with shared navigation sidebar
- Create animated SVG payment flow visualization
- Implement continuous demo mode with live indicator
- Build judge-facing /submit page with dynamic metrics
- All TypeScript compiles clean after each phase

## Research Summary

### Project Files

- `packages/dashboard/app/page.tsx` — Current 22-component monolith, all data fetching logic
- `packages/dashboard/components/EconomicChart.tsx` — Bar-width only, no real charts
- `packages/dashboard/package.json` — Zero chart libraries currently
- `packages/dashboard/app/layout.tsx` — Plain layout, no navigation
- `packages/dashboard/app/api/demo-launch/route.ts` — One-shot orchestrator spawner
- `packages/dashboard/app/api/stream/route.ts` — SSE endpoint with mock events
- `packages/dashboard/app/api/task-status/route.ts` — Task data source, no time-series
- `packages/dashboard/tailwind.config.js` — Arc color theme

### External References

- #file:../research/20260418-judge-visible-features-research.md - Full codebase analysis, chart gap assessment, SVG animation patterns, API surface audit
- recharts.org — Declarative React charting library (~45KB gzipped)
- Next.js App Router — File-based routing with layout.tsx nesting

### Standards References

- #file:../../AGENTS.md - Project constants, SDK constraints, hackathon timeline
- Arc testnet: Chain ID 5042002, USDC at 0x3600..., Explorer at testnet.arcscan.io

## Implementation Checklist

### [ ] Phase 1: Real-Time Charts (recharts)

- [ ] Task 1.1: Install recharts dependency
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 1-45)

- [ ] Task 1.2: Create `/api/stats-timeseries` endpoint
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 46-95)

- [ ] Task 1.3: Create `DashboardCharts.tsx` with 4 recharts visualizations
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 96-155)

- [ ] Task 1.4: Wire charts into page.tsx, replacing EconomicChart bar-width section
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 156-185)

- [ ] Task 1.5: TypeScript validation
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 186-200)

### [ ] Phase 2: Multi-Page Navigation

- [ ] Task 2.1: Create `NavSidebar.tsx` component with route links + active highlighting
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 201-250)

- [ ] Task 2.2: Update `layout.tsx` with sidebar wrapping `{children}`
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 251-280)

- [ ] Task 2.3: Extract components into `app/agents/page.tsx`
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 281-320)

- [ ] Task 2.4: Extract components into `app/economy/page.tsx`
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 321-355)

- [ ] Task 2.5: Extract components into `app/governance/page.tsx`
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 356-385)

- [ ] Task 2.6: Extract components into `app/settings/page.tsx`
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 386-415)

- [ ] Task 2.7: Simplify `app/page.tsx` to Hero + Feed + Launcher only
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 416-450)

- [ ] Task 2.8: TypeScript validation
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 451-465)

### [ ] Phase 3: Submission Page + Animated Flow + Continuous Mode

- [ ] Task 3.1: Create `app/submit/page.tsx` with judge-facing content
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 466-520)

- [ ] Task 3.2: Create `PaymentFlowAnimation.tsx` with SVG animation
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 521-575)

- [ ] Task 3.3: Extend `DemoLauncher.tsx` with continuous mode toggle
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 576-625)

- [ ] Task 3.4: Extend `demo-launch/route.ts` for continuous mode
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 626-665)

- [ ] Task 3.5: TypeScript validation + final integration check
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 666-690)

### [ ] Phase 4: Polish (Sound + Keyboard + Mobile)

- [ ] Task 4.1: Add sound effects via Web Audio API hook
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 691-730)

- [ ] Task 4.2: Add keyboard shortcuts with `?` overlay
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 731-765)

- [ ] Task 4.3: Mobile responsive audit + fixes
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 766-805)

- [ ] Task 4.4: Final TypeScript validation + changes tracking
  - Details: .copilot-tracking/details/20260418-judge-visible-features-details.md (Lines 806-820)

## Dependencies

- recharts ^2.12.0 (npm package)
- Next.js 14 App Router (already installed)
- All existing API routes (task-status, agent-metrics, evidence, revenue)
- Supabase task_events table with time-series data

## Success Criteria

- [ ] `npx tsc --noEmit` passes in packages/dashboard after each phase
- [ ] Dashboard has 6+ navigable pages with sidebar
- [ ] 4 recharts visualizations render with live data
- [ ] Animated SVG payment flow visible on homepage
- [ ] Continuous demo mode runs indefinitely with stop button
- [ ] /submit page shows all key metrics and architecture diagram
- [ ] All 22 existing components preserved with zero functionality loss
- [ ] Critic conditions C1-C6 addressed
