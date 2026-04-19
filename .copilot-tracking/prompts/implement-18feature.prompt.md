---
mode: agent
model: Claude Sonnet 4
---

<!-- markdownlint-disable-file -->

# Implementation Prompt: 18-Feature Economy/QoL/Arc Mega-Implementation

## Implementation Instructions

### Step 1: Create Changes Tracking File

You WILL create `20260418-18feature-changes.md` in #file:../changes/ if it does not exist.

### Step 2: Execute Implementation

You WILL follow #file:../../.github/instructions/task-implementation.instructions.md if it exists.
You WILL systematically implement #file:../plans/20260418-18feature-plan.instructions.md task-by-task
You WILL follow ALL project standards from #file:../../AGENTS.md

**CRITICAL**: Follow the Phase ordering strictly:
- Phase 1 (P0) FIRST — these are standalone features with no dependencies
- Phase 2 (P1) SECOND — these depend on existing + P0 modules
- Phase 3 (P2) LAST — these are stretch goals

**CRITICAL**: Every new module MUST:
1. Have mock fallback (MOCK_0x hash prefix pattern)
2. Check `isContractDeployed()` before on-chain calls
3. Be feature-flag gated via `FEATURES.useX` in config.ts
4. Follow barrel export pattern from module's index.ts
5. Stay under 300 lines per file

**CRITICAL**: If ${input:phaseStop:true} is true, you WILL stop after each Phase for user review.
**CRITICAL**: If ${input:taskStop:false} is true, you WILL stop after each Task for user review.

### Key Files to Read Before Implementation

1. #file:../../AGENTS.md — Project constraints, Arc constants, coding standards
2. #file:../specs/20260418-18feature-ralplan-spec.md — Full feature specifications
3. #file:../details/20260418-18feature-details.md — Per-task implementation details

### Existing Patterns to Follow

- **Mock fallback**: See `packages/orchestrator/src/contracts.ts` — every contract call checks `isContractDeployed()` then falls back to `mockInteraction()`
- **Feature flags**: See `packages/orchestrator/src/config.ts` — `FEATURES.useX` pattern
- **Economy module**: See `packages/orchestrator/src/economy/` — barrel export from index.ts
- **Dashboard component**: See `packages/dashboard/components/RevenueDashboard.tsx` — "use client", fetch from API routes
- **API route**: See `packages/dashboard/app/api/revenue/route.ts` — GET with action param pattern

### Step 3: Cleanup

When ALL Phases are checked off (`[x]`) and completed you WILL do the following:

1. You WILL provide a markdown style link and a summary of all changes from #file:../changes/20260418-18feature-changes.md to the user:

   - You WILL keep the overall summary brief
   - You WILL add spacing around any lists
   - You MUST wrap any reference to a file in a markdown style link

2. You WILL provide markdown style links to .copilot-tracking/plans/20260418-18feature-plan.instructions.md, .copilot-tracking/details/20260418-18feature-details.md, and .copilot-tracking/specs/20260418-18feature-ralplan-spec.md documents. You WILL recommend cleaning these files up as well.
3. **MANDATORY**: You WILL attempt to delete .copilot-tracking/prompts/implement-18feature.prompt.md

## Success Criteria

- [ ] Changes tracking file created
- [ ] All 18 plan items implemented with working code
- [ ] All detailed specifications satisfied
- [ ] Project conventions followed (mock-first, feature-flag, barrel exports)
- [ ] TypeScript passes on both orchestrator and dashboard
- [ ] Changes file updated continuously
