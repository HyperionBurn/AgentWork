# AgentWork — Demo Script (3 Minutes)

> Target audience: Hackathon judges at "Agentic Economy on Arc" (lablab.ai)
> Prize: $10,000 USDC + $500 Circle Product Feedback bonus

---

## 0:00–0:15 — Hook + The Problem

**Goal**: Make judges feel the payment infrastructure pain in 15 seconds.

> "AI agents are transforming software development, but **paying them is broken**."

- Show the economic comparison table:

| Method | Min Transaction | 50-Agent Cost |
|--------|----------------|---------------|
| Stripe/PayPal | $0.30 | $15.00+ |
| L2 (Arbitrum/Base) | $0.05–$0.50 | $2.50–$25.00 |
| **Arc + Circle Gateway** | **$0.001** | **$0.05–$0.50** |

> "A 50-agent pipeline costs $15 on Stripe. On Arc? **Twenty-two cents.**"

---

## 0:15–0:45 — Architecture Overview

**Goal**: Show the architecture and what we built.

- Show architecture diagram (dashboard slide or live):
  ```
  Dashboard → Orchestrator → 4 Specialist Agents → Circle Gateway → Arc L1
  ```

- Key points (quick):
  - Orchestrator decomposes tasks and routes to specialist agents
  - Each agent call costs $0.005 via x402 nanopayment protocol
  - Payments settle on-chain in under 5 seconds via Circle Gateway
  - Smart contracts provide escrow and reputation (ERC-8004)
  - 5 Vyper contracts: AgentEscrow, PaymentSplitter, SpendingLimiter, IdentityRegistry, ReputationRegistry

---

## 0:45–1:45 — Live Demo (The Core)

**Goal**: Prove PRD-01 through PRD-07 with real on-chain transactions.

### Step 1: Show Dashboard (PRD-03, PRD-04) — 15 sec
- Open http://localhost:3000
- Point out: 4 agent cards showing online status (green indicators)
- Point out: Gateway balance widget showing available USDC
- Point out: Economic comparison chart showing Arc vs alternatives

### Step 2: Trigger Task Execution (PRD-01, PRD-02) — 10 sec
- Run command (pre-prepared in terminal):
  ```bash
  npm run demo
  ```
- Or if already running: `npm run demo:10` for 10 runs

### Step 3: Watch Payments Flow (PRD-05, PRD-06) — 30 sec
- Task feed shows real-time payment events as agents get paid
- Each event shows: agent type, amount ($0.005), status, arcscan link
- Click an arcscan link → opens `testnet.arcscan.io/tx/{hash}`
- Point out: "That's a **real on-chain transaction**. Half a cent settled in seconds."
- Show animated task rows sliding in (new Phase 1 feature)

### Step 4: Show Results (PRD-05, PRD-07) — 15 sec
- Dashboard counter shows 60+ transactions
- ArcScan shows full transaction list
- Economic chart shows 30–300x cost reduction vs alternatives
- Run `npm run collect-evidence` to generate the evidence summary

---

## 1:45–2:15 — Smart Contracts (If Time Permits)

**Goal**: Show the Vyper contracts are real and ready for deployment.

- Brief walkthrough of `packages/contracts/src/`:
  - `AgentEscrow.vy` — create → claim → submit → approve lifecycle
  - `PaymentSplitter.vy` — multi-recipient distribution
  - `IdentityRegistry.vy` — ERC-721 agent identity NFTs
  - `ReputationRegistry.vy` — ERC-8004 on-chain reputation
  - `SpendingLimiter.vy` — per-agent rate limiting
- Note: Contracts are written and tested locally (Moccasin + titanoboa)
- Deployment to Arc testnet is ready: `cd packages/contracts && moccasin run script/deploy.py --network arc_testnet`

---

## 2:15–2:45 — Economic Proof + Close

> "60+ on-chain transactions. Total cost: about $0.22. Settlement: under 5 seconds."

- Show the cost comparison table from orchestrator output:
  ```
  Arc (actual):     $0.22
  L2 (Arbitrum):    $6.00    (saves 96%)
  Stripe/PayPal:    $18.00   (saves 99%)
  ```

**What's next** (stretch goals shown on dashboard):
- Smart contracts deployed (AgentEscrow, PaymentSplitter, SpendingLimiter)
- ERC-8004 agent identity NFTs + on-chain reputation scoring
- Spending limits per agent with time-window enforcement

**The pitch**: "This proves that multi-agent AI economies are economically viable for the first time. Arc makes it possible."

---

## 2:45–3:00 — Q&A Buffer

Extra time for judge questions. See [Q&A Talking Points](#qa-talking-points) below.

---

## Fallback Procedures

### If the Gateway is slow or unresponsive
1. Show the pre-recorded demo video
2. Explain: "This is a live testnet — the Gateway batches transactions and sometimes settles take 10-30 seconds"
3. Switch to showing the evidence summary: `npm run collect-evidence` → open `evidence/summary.md`

### If an agent fails to start
1. Other agents continue working — the orchestrator has retry logic
2. Show terminal output where retry kicks in: "You can see the exponential backoff recovering from a transient failure"
3. This demonstrates production-ready resilience

### If the dashboard doesn't load
1. Show terminal output instead — it has all the same information
2. Open `evidence/summary.md` which has every transaction with ArcScan links
3. Show screenshots in `docs/evidence/` as last resort

### If everything fails
1. Play the pre-recorded backup video (record Day 4 morning, have MP4 ready)
2. Walk through `evidence/summary.md` — it's a static markdown file with all transactions
3. Show `docs/circle-product-feedback.md` — this alone is submission-worthy ($500 bonus)

---

## Q&A Talking Points

### "How do you handle agent failures?"
- Orchestrator has exponential backoff retry (3 attempts, 2s base delay)
- Failed payments don't block subsequent agent calls
- Session recorder tracks failures for post-mortem analysis

### "How is this different from just using Stripe?"
- Stripe's minimum is $0.30 per transaction — our payments are $0.005 (60x cheaper)
- Stripe settles in 1–3 business days — Arc settles in <5 seconds
- Stripe can't route payments between autonomous agents (no API for machine-to-machine)

### "What's the throughput of the system?"
- Circle Gateway batches EIP-3009 authorizations — not every `pay()` is a separate on-chain tx
- Our 60+ payments in the demo represent multiple on-chain settlements
- Arc's block time is ~2 seconds, Gateway batches within 5 seconds

### "How do agents prove they did the work?"
- Each agent returns structured results (research findings, code, test results, review scores)
- Session recorder captures all inputs and outputs
- AgentEscrow contract holds funds in escrow until work is verified
- ReputationRegistry tracks quality scores over time

### "Is this production-ready?"
- The payment infrastructure (Arc + Circle Gateway) is production-grade
- Agent marketplace features (discovery, pricing, arbitration) are future work
- Smart contracts are written and tested but not yet deployed to mainnet
- We'd need security audits before mainnet deployment

### "What would you build with more time?"
- Agent discovery marketplace (browse agents by capability)
- Dynamic pricing based on reputation and demand
- Cross-chain payments (Arc ↔ Base ↔ other USDC chains)
- TEE/zkML agent attestation for verified capabilities

---

## PRD Coverage Checklist

| PRD | Requirement | Demo Section | How Shown |
|-----|------------|-------------|-----------|
| PRD-01 | Orchestrator pays 4 agents | Step 2-3 | Terminal output + task feed |
| PRD-02 | On-chain tx hash per payment | Step 3 | ArcScan link clicks |
| PRD-03 | Real-time payment feed | Step 1, 3 | Dashboard TaskFeed with animations |
| PRD-04 | Agent health checks | Step 1 | Agent cards with status indicators |
| PRD-05 | 60+ on-chain transactions | Step 4 | Counter + ArcScan + `collect-evidence` |
| PRD-06 | Explorer links for every payment | Step 3 | Clickable links in TxList |
| PRD-07 | Economic comparison chart | Step 1, 4 | EconomicChart with live cost bar |
| PRD-08 | Deploy AgentEscrow.vy | Contracts | Code walkthrough + deploy command |
| PRD-13 | Circle Product Feedback | Close | `docs/circle-product-feedback.md` ($500 bonus) |
