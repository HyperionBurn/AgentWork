# Demo Evidence

Screenshots, arcscan links, and terminal output for hackathon submission.

## Required Evidence (PRD-05, PRD-06)

| Evidence | File | Source |
|----------|------|--------|
| Dashboard with 60+ transactions | `dashboard-60plus.png` | http://localhost:3000 |
| ArcScan transaction list | `arcscan-txns.png` | https://testnet.arcscan.io |
| Orchestrator terminal output | `orchestrator-output.log` | `DEMO_RUNS=15 npx tsx src/index.ts` |
| Agent health checks | `agent-health.log` | `curl localhost:4021/health` |
| Economic comparison chart | `economic-chart.png` | Dashboard EconomicChart component |
| Docker stack running | `docker-stack.png` | `docker ps` |
| Full task feed | `task-feed.png` | Dashboard TaskFeed component |

## Naming Convention

- Screenshots: `{component}-{description}.png`
- Text output: `{component}-{description}.log`
- ArcScan links: `arcscan-{tx-hash}.png` or collect in `arcscan-links.txt`

## How to Capture

```bash
# 1. Run orchestrator with 15 iterations (produces 60+ payments)
DEMO_RUNS=15 npm run dev:orchestrator

# 2. Take dashboard screenshot
# Open http://localhost:3000 and capture full page

# 3. Capture ArcScan links
# For each tx hash in orchestrator output, visit:
# https://testnet.arcscan.io/tx/{hash}

# 4. Save agent health output
curl http://localhost:4021/health > agent-health-research.log
curl http://localhost:4022/health > agent-health-code.log
curl http://localhost:4023/health > agent-health-test.log
curl http://localhost:4024/health > agent-health-review.log
```
