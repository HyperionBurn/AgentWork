# AgentWork — Demo Script (3 Minutes)

> Target audience: Hackathon judges at "Agentic Economy on Arc" (lablab.ai)
> Prize: $10,000 USDC + $500 Circle Product Feedback bonus

---

## 0:00–0:30 — The Problem

**Goal**: Make judges feel the payment infrastructure pain.

> "AI agents are transforming software development, but **paying them is broken**."

- Show the economic comparison table:

| Method | Min Transaction | 50-Agent Cost |
|--------|----------------|---------------|
| Stripe/PayPal | $0.30 | $15.00+ |
| L2 (Arbitrum/Base) | $0.05–$0.50 | $2.50–$25.00 |
| **Arc + Circle Gateway** | **$0.001** | **$0.05–$0.50** |

> "A 50-agent pipeline costs $15 on Stripe. On Arc? **Twenty-two cents.**"

---

## 0:30–1:00 — What We Built

**Goal**: Show the architecture in 30 seconds.

- Show architecture diagram (dashboard slide or live):
  ```
  Dashboard → Orchestrator → 4 Specialist Agents → Circle Gateway → Arc L1
  ```

- Key points (quick):
  - Orchestrator decomposes tasks and routes to specialist agents
  - Each agent call costs $0.005 via x402 nanopayment protocol
  - Payments settle on-chain in under 5 seconds via Circle Gateway
  - Smart contracts provide escrow and reputation (ERC-8004)

---

## 1:00–2:30 — Live Demo

**Goal**: Prove PRD-01 through PRD-07 with real on-chain transactions.

### Step 1: Show Dashboard (PRD-03, PRD-04)
- Open http://localhost:3000
- Point out: 4 agent cards showing online status (green indicators)
- Point out: Economic comparison chart showing Arc vs alternatives

### Step 2: Trigger Task Execution (PRD-01, PRD-02)
- Run command:
  ```bash
  DEMO_RUNS=15 npm run dev:orchestrator
  ```
- Or trigger from pre-running orchestrator

### Step 3: Watch Payments Flow (PRD-05, PRD-06)
- Task feed shows real-time payment events as agents get paid
- Each event shows: agent type, amount ($0.005), status, arcscan link
- Click an arcscan link → opens `testnet.arcscan.io/tx/{hash}`
- Point out: "That's a **real on-chain transaction**. Half a cent settled in seconds."

### Step 4: Show Results (PRD-05, PRD-07)
- Dashboard counter shows 60+ transactions
- ArcScan shows full transaction list
- Economic chart shows 30–300x cost reduction vs alternatives

---

## 2:30–3:00 — Close + What's Next

> "60+ on-chain transactions. Total cost: about $0.22. Settlement: under 5 seconds."

**What's next** (stretch goals shown on dashboard):
- Smart contracts deployed (AgentEscrow, PaymentSplitter, SpendingLimiter)
- ERC-8004 agent identity NFTs + on-chain reputation scoring
- Spending limits per agent with time-window enforcement

**The pitch**: "This proves that multi-agent AI economies are economically viable for the first time. Arc makes it possible."

---

## Backup Plan

If live demo fails:

1. **Pre-recorded video** (record Day 4 morning, have MP4 ready)
2. **Screenshots** in `docs/evidence/`:
   - `dashboard-60plus.png` — Dashboard with 60+ transactions
   - `arcscan-txns.png` — ArcScan transaction list
   - `orchestrator-output.log` — Full terminal output
3. **Never depend on live infrastructure** for a demo

---

## PRD Coverage Checklist

| PRD | Requirement | Demo Section | How Shown |
|-----|------------|-------------|-----------|
| PRD-01 | Orchestrator pays 4 agents | Step 2-3 | Terminal output + task feed |
| PRD-02 | On-chain tx hash per payment | Step 3 | ArcScan link clicks |
| PRD-03 | Real-time payment feed | Step 1, 3 | Dashboard TaskFeed |
| PRD-04 | Agent health checks | Step 1 | Agent cards with status |
| PRD-05 | 60+ on-chain transactions | Step 4 | Counter + ArcScan |
| PRD-06 | Explorer links for every payment | Step 3 | Clickable links in TxList |
| PRD-07 | Economic comparison chart | Step 1, 4 | EconomicChart component |
