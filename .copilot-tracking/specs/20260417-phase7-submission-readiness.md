# SPEC: Phase 7 — Submission Readiness

## Status: IMPLEMENTING
## Owner: AgentWork Team
## Created: 2026-04-17
## Updated: 2026-04-17

### Problem

The hackathon submission deadline is April 24. We need CI, env validation, smoke tests, and polished documentation to ensure the demo runs reliably and the submission is complete.

### Acceptance Criteria

- [x] `npm run validate-env` validates all env vars with tiered feedback (P0 TG1)
- [x] CI pipeline runs on push/PR to main with tsc + secret scan (P0 TG2)
- [x] Dry-run script tests full flow without blockchain (P1 TG3)
- [x] Contract tests for IdentityRegistry, ReputationRegistry, AgentEscrow (P1 TG4)
- [x] README has CI badge, demo video placeholder, submission checklist (P0 TG5)
- [x] Smoke-test script verifies all services post-launch (P1 TG6)
- [x] Smoke-test reads *_AGENT_URL from env for Docker mode (Critic M1/M7)
- [x] CI uses setup-python@v5 for contract tests (Critic C5)
- [x] README edits are additive-only, 0 lines deleted from existing sections (Critic C1)

### Technical Design

```
scripts/
├── validate-env.ts    ← Tiered env var validation (critical/optional/advisory)
├── smoke-test.ts      ← Post-launch health + 402 + Supabase checks
└── dry-run.ts         ← Mock servers on 4021-4024, test decomposer + 402 flow

.github/workflows/
└── ci.yml             ← tsc dashboard + orchestrator, validate-env --schema-only, secret scan

packages/contracts/tests/
└── test_contracts.py  ← 5 test classes: IdentityRegistry, ReputationRegistry, AgentEscrow

README.md              ← CI badge + demo video + submission checklist (additive only)
```

### Dependencies

- Phase 6 complete (all runtime code + infrastructure docs)
- `.env.example` must be current source of truth for env var names
- `@circle-fin/x402-batching` v2.1.0 installed in orchestrator

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Vyper contract tests fail on titanoboa | Medium | Low | Contracts are P1, skip if needed |
| CI badge shows failing until repo pushed | High | Low | Update org/repo name after fork |
| Mock servers conflict with running agents | Medium | Low | dry-run checks EADDRINUSE |

### Changes Tracking

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-17 | Created spec | RALPLAN consensus (Planner + Architect + Critic) |
| 2026-04-17 | Implemented validate-env.ts | P0 TG1 — env validation |
| 2026-04-17 | Implemented ci.yml | P0 TG2 — CI pipeline |
| 2026-04-17 | Implemented smoke-test.ts | P1 TG6 — health checks |
| 2026-04-17 | Implemented dry-run.ts | P1 TG3 — mock flow test |
| 2026-04-17 | Implemented test_contracts.py | P1 TG4 — Vyper tests |
| 2026-04-17 | Updated README.md | P0 TG5 — CI badge + checklist |
| 2026-04-17 | Updated package.json | Added validate-env, smoke-test, dry-run scripts |
