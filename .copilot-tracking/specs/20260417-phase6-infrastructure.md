# SPEC: Phase 6 — Infrastructure Files
## Status: DONE
## Owner: RALPLAN Consensus (Planner + Architect + Critic)
## Created: 2026-04-17
## Updated: 2026-04-17

### Problem
Phases 1–5 implemented all code but left infrastructure gaps: missing Moccasin config, no seed data, no Supabase Realtime, no wallet generator, no documentation for demo/submission, and incomplete Docker/CI configuration.

### Acceptance Criteria
- [x] `moccasin.toml` with verified Arc testnet network config
- [x] `seed.sql` with 4 agent rows (ON CONFLICT DO NOTHING)
- [x] `schema.sql` has Supabase Realtime on payment_events + task_events
- [x] `generate-wallet.ts` produces Arc testnet wallet
- [x] `package.json` has `generate-wallet` script
- [x] `docker-compose.yml` documents orchestrator as batch job
- [x] `.gitignore` excludes `packages/contracts/build/` but keeps `.gitkeep`
- [x] `docs/demo-script.md` covers PRD-01→PRD-07 with DEMO_RUNS=15
- [x] `docs/circle-product-feedback.md` cites verified pain points
- [x] `docs/setup-guide.md` has copy-paste commands
- [x] `docs/evidence/` directory with README
- [x] `packages/contracts/build/.gitkeep` for Moccasin output

### Technical Design

Task Groups (per RALPLAN consensus):
- TG1: Moccasin config (moccasin.toml)
- TG2: Database (schema.sql Realtime, seed.sql)
- TG3: Wallet generator (generate-wallet.ts + package.json script)
- TG4: Evidence directory (docs/evidence/.gitkeep + README)
- TG5: Circle Product Feedback document
- TG6: Demo script (3-min walkthrough, DEMO_RUNS=15)
- TG7: Setup guide (consolidated)
- TG8: Docker + gitignore updates

### Dependencies
- Phases 1–5 complete (all code files exist)
- AGENTS.md §2 (Arc constants), §4 (SDK API), §13 (Known Issues)

### Risks
| Risk | Mitigation |
|------|-----------|
| Moccasin.toml format wrong | Verified against framework docs, Architect corrected |
| Realtime on wrong table | Critic confirmed: only payment_events + task_events |
| seed.sql ignored by dashboard | Marked P2 — dashboard uses hardcoded AGENTS array |

### Changes Tracking
| Date | Change | Reason |
|------|--------|--------|
| 2026-04-17 | Initial spec created | RALPLAN Phase 6 planning |
| 2026-04-17 | All 14 files implemented | Consensus approved by 3 subagents |
