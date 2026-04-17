---
mode: agent
model: Claude Sonnet 4
---

<!-- markdownlint-disable-file -->

# Implementation Prompt: 5-Phase Improvement Plan

## Implementation Instructions

### Step 1: Create Changes Tracking File

You WILL create `20260417-5phase-improvement-changes.md` in #file:../changes/ if it does not exist.

### Step 2: Execute Implementation

You WILL follow #file:../../.github/instructions/task-implementation.instructions.md
You WILL systematically implement #file:../plans/20260417-5phase-improvement-plan.instructions.md task-by-task
You WILL follow ALL project standards and conventions per AGENTS.md

**CRITICAL CONSTRAINTS** (from RALPLAN consensus):

1. **Zero regressions** — Every phase is independently deployable. The app must work after each phase.
2. **Feature flags** — Phase 3 (contracts) uses `isContractDeployed()` to toggle real vs mock behavior. Never assume contracts are deployed.
3. **Additive agent responses** — Phase 2 agent upgrades add new fields to existing response shapes. Never remove or rename existing fields.
4. **Backward-compatible executor** — Phase 2.4 (context passing) adds optional `context` param. If an agent doesn't use it, nothing breaks.
5. **Evidence files gitignored** — Phase 4.2 writes to `evidence/` which must be in .gitignore.
6. **Polling fallback** — Phase 1.1 (Realtime) keeps 3s polling as degraded-mode fallback.

**CRITICAL**: If ${input:phaseStop:true} is true, you WILL stop after each Phase for user review.
**CRITICAL**: If ${input:taskStop:false} is true, you WILL stop after each Task for user review.

### Phase Execution Order

Execute phases strictly in order (1 → 2 → 3 → 4 → 5) as later phases depend on earlier ones.

**Phase 1**: Dashboard Real-Time + UI Polish (5 tasks)
- Wire Supabase Realtime subscriptions
- Add live gateway balance
- Upgrade AgentCard with live data
- Add task flow animations
- Update EconomicChart with live cost

**Phase 2**: Agent Intelligence Layer (4 tasks)
- Define shared response types
- Upgrade Flask agents with structured outputs
- Add context-aware task chaining
- Update executor for context passing

**Phase 3**: Real Contract Integration (4 tasks)
- Add isContractDeployed() feature flag
- Deploy contracts to Arc testnet
- Wire real contract calls
- Update orchestrator escrow lifecycle

**Phase 4**: Demo Resilience + Metrics (4 tasks)
- Add retry logic to executor
- Add session recorder
- Create one-click demo launch
- Add cost accumulator

**Phase 5**: Submission Excellence (4 tasks)
- Create evidence collector
- Write Circle Product Feedback
- Update README
- Create judge-ready demo script

### Step 3: Cleanup

When ALL Phases are checked off (`[x]`) and completed you WILL do the following:

1. You WILL provide a markdown style link and a summary of all changes from #file:../changes/20260417-5phase-improvement-changes.md to the user:

   - You WILL keep the overall summary brief
   - You WILL add spacing around any lists
   - You MUST wrap any reference to a file in a markdown style link

2. You WILL provide markdown style links to .copilot-tracking/plans/20260417-5phase-improvement-plan.instructions.md, .copilot-tracking/details/20260417-5phase-improvement-details.md documents. You WILL recommend cleaning these files up as well.
3. **MANDATORY**: You WILL attempt to delete .copilot-tracking/prompts/implement-5phase-improvement.prompt.md

## Success Criteria

- [ ] Changes tracking file created
- [ ] All 21 plan items implemented with working code
- [ ] All detailed specifications satisfied
- [ ] TypeScript compiles clean in both packages
- [ ] No regressions in existing functionality
- [ ] Each phase is independently deployable
- [ ] Project conventions followed per AGENTS.md