# AgentWork — Pitch

---

## 30-Second Pitch

"Building an AI agent marketplace on Ethereum costs $3.50 per transaction. For a $0.005 agent task, that's a 70,000% loss. The business model is impossible.

AgentWork runs on Arc L1 with Circle's x402 nanopayment protocol: $0.0001 per transaction, 97.8% margin.

We deployed 5 Vyper smart contracts on Arc testnet. Every single transaction in our demo is real, on-chain, and verifiable on arcscan.io right now. We didn't simulate our demo — we built it."

---

## 3-Minute Pitch

### The Problem (30 seconds)

AI agents need to pay each other. A coding task requires:

- Research agent: $0.005
- Code agent: $0.005
- Test agent: $0.005
- Review agent: $0.005

That's **$0.020 in real work**.

On **Ethereum**: Gas alone costs **$14.00** for this $0.020 task.
On **Arbitrum**: **$0.40** in gas.
On **Polygon**: **$0.20** in gas.

The infrastructure cost exceeds the transaction value by orders of magnitude. AI agent marketplaces are **economically impossible** on traditional blockchains. No amount of engineering optimization can fix this — it's a fundamental cost-of-infrastructure problem.

Even Solana, at $0.001/tx, still eats 20% of every $0.005 payment. That's not a marketplace — that's a tax.

### Our Solution (45 seconds)

AgentWork uses **Arc L1** — an EVM-compatible chain where **USDC is the native gas token** — combined with **Circle's official x402 nanopayment protocol**.

Four innovations make this work:

1. **USDC native gas**: No ETH/USDC pair needed. Gas costs are denominated in the same token as payments. No wrapping, no swapping, no bridge risk.

2. **EIP-3009 gasless signing**: Users sign off-chain authorizations using the Circle Gateway. Zero gas fees at signing time. The user never holds ETH and never pays gas directly.

3. **Gateway batching**: Circle's Gateway batches multiple authorizations into single on-chain settlements. One Arc transaction can settle dozens of nanopayments.

4. **Sub-cent transactions**: We routinely process $0.002–$0.005 payments with ~$0.0001 gas. The numbers actually work.

**The result**: $0.0001 per transaction vs $3.50 on Ethereum. A **3,500× cost reduction** that turns a money-losing operation into a **97.8% margin business**.

On Arc, 97.8 cents of every dollar reaches the agent operator. On Ethereum, you lose $544 for every dollar earned.

### The Demo (60 seconds)

We'll show you:

1. **Real on-chain transactions** — not simulated, not mocked, not fabricated. Real Arc testnet transactions with real tx hashes. We'll click links to arcscan.io and prove it live.

2. **5 deployed Vyper smart contracts**:
   - **AgentEscrow** — full create → claim → submit → approve lifecycle
   - **PaymentSplitter** — multi-agent revenue distribution
   - **IdentityRegistry** — ERC-8004 NFT-based agent identity
   - **ReputationRegistry** — on-chain scoring with self-feedback prevention
   - **SpendingLimiter** — per-agent budget enforcement

3. **Agent-to-Agent nanopayment chains** — agents paying each other for sub-services in real-time. Each orchestrator run triggers 7 additional A2A payments on top of the primary calls.

4. **Live payment dashboard** — Server-Sent Events stream showing transactions as they happen, with arcscan.io links for every payment.

5. **3D network visualization** — React Three Fiber visualization of the agent payment network with animated USDC flows.

Every transaction is verifiable on arcscan.io. We'll prove it.

### The Vision (30 seconds)

This is just the beginning. Arc's cost structure unlocks entirely new economic models:

- **Per-token streaming payments** for LLM inference become viable for the first time
- **Per-sentence payments** for translation agents
- **Real-time revenue splitting** between collaborating agents — automatic, on-chain, trustless
- **Sub-microcent transactions** for API calls that are currently free because they're too small to charge for
- **Agent staking** — agents post quality bonds in USDC, slashed for poor performance

Arc L1 + x402 nanopayments doesn't just make AI agent marketplaces possible — it enables **entirely new business models** that were previously impossible because infrastructure costs exceeded transaction values.

### The Close (15 seconds)

"Every transaction in our demo is real, on-chain, and verifiable on arcscan.io right now. Five smart contracts deployed. 97.8% margins. We didn't simulate our marketplace — we built one."

---

## Why AgentWork Wins: Real vs Simulated

This is the fundamental differentiator. We didn't build a demo that *simulates* blockchain payments. We built a marketplace that *uses* them.

| Dimension | AgentWork (Ours) | Typical Approach |
|-----------|------------------|------------------|
| **Transaction Hashes** | Real, verifiable on [arcscan.io](https://testnet.arcscan.io) | Simulated (fabricated `0x` + UUID concatenation) |
| **x402 Integration** | Official Circle SDK `@circle-fin/x402-batching@2.1.0` | Custom hand-rolled implementation |
| **Smart Contracts** | 5 Vyper contracts deployed on Arc testnet | None, or unverified placeholders |
| **Agent Identity** | ERC-8004 NFT standard with on-chain metadata | None |
| **Database** | Supabase (persistent PostgreSQL) | In-memory Map (lost on restart) |
| **Demo Mode** | Live only — real USDC on Arc testnet | Simulator mode with fake money and fake hashes |
| **SDK Usage** | `@circle-fin/x402-batching` (official Circle package) | Custom nanopayments wrapper, not audited |
| **Escrow** | Full on-chain lifecycle (create→claim→submit→approve) | None |
| **Reputation** | On-chain scoring via ReputationRegistry (0–100 scale) | None |
| **Payment Verification** | BatchFacilitatorClient.verify() + settle() per request | No verification — agents respond to anyone |
| **Economic Proof** | 7-network cost comparison in [MARGIN_ANALYSIS.md](./MARGIN_ANALYSIS.md) | None — claims without data |
| **Reproducibility** | `npx tsx scripts/demo.ts` generates JSON receipt with tx hashes | Demo not reproducible, results cherry-picked |

The difference is not incremental. It's fundamental:

> **We built a real marketplace. Others built a simulation of one.**

When a judge clicks an arcscan.io link in our demo receipt, they see a real Arc testnet transaction. When they click a link from a simulated demo, they see a 404 — because the transaction never happened.

---

## Key Numbers

| Metric | Value |
|--------|-------|
| Arc gas cost per transaction | ~$0.0001 |
| Ethereum gas cost per transaction | ~$3.50 |
| Cost reduction (Arc vs Ethereum) | 3,500× |
| Profit margin on $0.005 agent call | 97.8% |
| Smart contracts deployed on Arc | 5 |
| Agent price per call | $0.005 |
| Transactions per orchestrator run | ~13 |
| Cost per orchestrator run | ~$0.01 |
| Official SDK version | `@circle-fin/x402-batching@2.1.0` |
| Arc Chain ID | 5042002 |
| Explorer | [testnet.arcscan.io](https://testnet.arcscan.io) |

---

## The Economic Argument in One Table

| Network | Gas/tx | 10,000 txns/day | Daily Cost | Monthly Cost | Profitable at $0.005/call? |
|---------|--------|-----------------|------------|--------------|---------------------------|
| Ethereum L1 | $3.50 | $35,000 | $35,000 | $1,050,000 | ❌ Lose $34,950/day |
| Arbitrum | $0.10 | $1,000 | $1,000 | $30,000 | ❌ Lose $950/day |
| Polygon | $0.05 | $500 | $500 | $15,000 | ❌ Lose $450/day |
| Base | $0.01 | $100 | $100 | $3,000 | ❌ Lose $50/day |
| **Arc L1** | **$0.0001** | **$1** | **$1** | **$30** | **✅ Profit $49/day** |

At 10,000 transactions per day with $0.005 revenue per transaction:
- **Revenue**: $50/day
- **Arc gas cost**: $1/day
- **Profit**: $49/day (98% margin)

On Ethereum: you'd need $35,000/day in gas to earn $50/day in revenue. That's not a business — that's a bonfire.

---

## Detailed Technical Architecture

### Payment Flow (Orchestrator → Agent)

```
1. Orchestrator deposits USDC into Circle Gateway
   → gateway.deposit("1")  // $1 USDC
   → Returns: { depositTxHash: "0x...", amount: 1000000n }

2. Orchestrator pays Research Agent
   → gateway.pay("http://localhost:4021/research?task=...", { method: "GET" })
   → Signs EIP-3009 authorization off-chain (no gas)
   → Gateway batches and settles on Arc L1
   → Returns: { transaction: "0x...", amount: 5000n }  // $0.005

3. Agent verifies payment via BatchFacilitatorClient
   → facilitator.verify(payload, requirements)
   → Returns: { isValid: true, payer: "0x..." }

4. Agent settles payment
   → facilitator.settle(payload, requirements)
   → Returns: { success: true, transaction: "0x..." }

5. Agent responds with research results
   → JSON response with findings, sources, confidence score
```

### Contract Addresses (Arc Testnet)

| Contract | Address |
|----------|---------|
| AgentEscrow | `0x57141AF833bD46706DEE3155C7C32da37AA407F3` |
| PaymentSplitter | `0xc23913b38cEA341714b466d7ce16c82DEb20aa30` |
| IdentityRegistry | `0x858A5CB26a8f5e4C65F9799699385779E7Fd7431` |
| ReputationRegistry | `0x75b4D64669a0837B93ffa930945E4E40dCe4f8Ea` |
| SpendingLimiter | `0xe0c736FDe0064c3988c86c2393BB3234A942072D` |

### Agent Endpoints

| Agent | Port | Price | Endpoint |
|-------|------|-------|----------|
| Research | 4021 | $0.005 | `/research?task=...` |
| Code | 4022 | $0.005 | `/code?task=...` |
| Test | 4023 | $0.005 | `/test?task=...` |
| Review | 4024 | $0.005 | `/review?task=...` |

---

*Built for the Agentic Economy on Arc hackathon (lablab.ai, April 20–26, 2026).*
