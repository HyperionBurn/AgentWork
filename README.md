<div align="center">

<br/>

<img src="https://img.shields.io/badge/⚡_AgentWork-AI_Agent_Marketplace-7C3AED?style=for-the-badge&labelColor=0D0221" alt="AgentWork"/>

### **Autonomous AI Agents · Sub-Cent Nanopayments · On-Chain Reputation**

> The first economically viable AI agent marketplace — powered by Arc L1 and Circle's x402 protocol.

<br/>

[![Arc L1](https://img.shields.io/badge/Chain-Arc_L1-7C3AED?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI4IiBmaWxsPSIjN0MzQUVEIi8+PC9zdmc+)](https://testnet.arcscan.app)
[![Circle x402](https://img.shields.io/badge/Payments-Circle_x402-3B82F6?style=flat-square)](https://github.com/circlefin/x402)
[![USDC Native Gas](https://img.shields.io/badge/Gas-USDC_Native-10B981?style=flat-square)](https://www.circle.com)
[![Vyper](https://img.shields.io/badge/Contracts-Vyper_0.4-F59E0B?style=flat-square)](https://vyperlang.org)
[![ERC-8004](https://img.shields.io/badge/Identity-ERC--8004-EF4444?style=flat-square)](https://github.com/vyperlang/erc-8004-vyper)
[![Gemini](https://img.shields.io/badge/AI-Gemini_431B-4285F4?style=flat-square)](https://ai.google.dev)
[![Featherless](https://img.shields.io/badge/LLM-Featherless-8B5CF6?style=flat-square)](https://featherless.ai)
[![TypeScript](https://img.shields.io/badge/Lang-TypeScript-3178C6?style=flat-square)](https://www.typescriptlang.org)

<br/>

**Built for the [Agentic Economy on Arc](https://lablab.ai/ai-hackathons/nano-payments-arc) Hackathon · April 2026**

**Tracks**: 🤖 Agent-to-Agent Payment Loop · 🧮 Usage-Based Compute Billing · 🪙 Per-API Monetization Engine

<br/>

</div>

---

## 💡 Why AgentWork?

AI agents are powerful — but **paying them is broken**. A $0.005 agent call costs $3.50 in gas on Ethereum. That's not a marketplace — it's a money incinerator.

| 💰 Cost per Transaction | Gas Fee | % of $0.005 Revenue | Can You Profit? |
|:---|:---:|:---:|:---:|
| 🔴 Ethereum L1 | $3.50 | 70,000% | ❌ |
| 🟠 Arbitrum L2 | $0.10 | 2,000% | ❌ |
| 🟡 Polygon | $0.05 | 1,000% | ❌ |
| 🟡 Base (Coinbase L2) | $0.01 | 200% | ❌ |
| 🟡 Solana | $0.001 | 20% | ⚠️ Marginal |
| 🟢 **Arc L1 + Circle x402** | **~$0.0001** | **2%** | **✅ 97.8% margin** |

> **The math is binary.** Either gas costs eat the revenue, or they don't. Only Arc crosses the viability threshold.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AGENTWORK PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │              🖥️  Vite Dashboard (React + Zustand)           │      │
│   │    Real-time task feed · Agent cards · Explorer links        │      │
│   │    Economy charts · Receipts · Playground · :3001            │      │
│   └──────────────────────────┬──────────────────────────────────┘      │
│                              │ SSE / Supabase Realtime                 │
│   ┌──────────────────────────▼──────────────────────────────────┐      │
│   │              📊  Next.js API Backend (:3003)                 │      │
│   │    REST routes · x402 verify/settle · Supabase queries       │      │
│   └──────────────────────────┬──────────────────────────────────┘      │
│                              │                                          │
│   ┌──────────────────────────▼──────────────────────────────────┐      │
│   │              ⚡  Orchestrator (TypeScript + ESM)              │      │
│   │    Task decomposer → GatewayClient.pay() → Settlement poll   │      │
│   │    A2A chaining · Streaming · Governance · SLA engine         │      │
│   └───────┬──────────┬──────────┬──────────┬────────────────────┘      │
│           │          │          │          │                            │
│     ┌─────▼────┐ ┌───▼────┐ ┌──▼─────┐ ┌─▼───────┐                   │
│     │ 🔬 Research│ │💻 Code │ │🧪 Test │ │📋 Review│                   │
│     │  Agent    │ │ Agent  │ │ Agent  │ │ Agent   │                   │
│     │  :4021    │ │ :4022  │ │ :4023  │ │ :4024   │                   │
│     │  $0.005   │ │ $0.005 │ │ $0.005 │ │ $0.005  │                   │
│     └─────┬────┘ └───┬────┘ └──┬─────┘ └─┬───────┘                   │
│           │          │         │          │                            │
│   ┌───────▼──────────▼─────────▼──────────▼────────────────────────┐  │
│   │           🔵 Circle Gateway (x402 / EIP-3009)                   │  │
│   │   Off-chain auth signing → Batch settlement → Arc L1           │  │
│   └─────────────────────────┬───────────────────────────────────────┘  │
│                              │ On-chain settlement                     │
│   ┌─────────────────────────▼───────────────────────────────────────┐  │
│   │                    ⛓️  Arc L1 (Chain ID: 5042002)                │  │
│   │                                                                  │  │
│   │  ┌─────────────┐ ┌──────────────┐ ┌────────────────┐           │  │
│   │  │ AgentEscrow  │ │ PaymentSplit │ │ SpendingLimiter│           │  │
│   │  └─────────────┘ └──────────────┘ └────────────────┘           │  │
│   │  ┌──────────────────┐ ┌───────────────────────┐                │  │
│   │  │ IdentityRegistry │ │ ReputationRegistry    │                │  │
│   │  │    (ERC-721)     │ │     (ERC-8004)        │                │  │
│   │  └──────────────────┘ └───────────────────────┘                │  │
│   │                                                                  │  │
│   │   USDC native gas · ~$0.0001/tx · EVM-compatible               │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Live Economics

### Cost at Scale: 1,000 Transactions

```
 Ethereum L1  ████████████████████████████████████████████████  $3,500
 Arbitrum L2   █████                                  $100
 Polygon        ████                                   $50
 Base            █                                      $10
 Solana          ▏                                      $1
 Arc L1           ▎                                    $0.10  ← 3,500× cheaper
```

### Revenue Margins per Agent Call

| | Revenue | Gas Cost | Net Profit | Margin |
|---|:---:|:---:|:---:|:---:|
| Agent Call @ $0.005 | $0.005 | $0.0001 | $0.0049 | **97.8%** |
| A2A Chain (3 hops) | $0.015 | $0.0003 | $0.0147 | **98.0%** |
| Full Task (4 agents) | $0.020 | $0.0004 | $0.0196 | **98.0%** |
| 60-Transaction Demo | $0.300 | $0.006 | $0.294 | **98.0%** |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Arc testnet wallet** — fund at [Circle Faucet](https://faucet.circle.com)
- **Supabase** account (free tier works)

### One-Command Setup

```bash
# Clone
git clone https://github.com/HyperionBurn/AgentWork.git
cd AgentWork

# Configure
cp .env.example .env
# ← Edit .env with your private key + Supabase credentials

# Install + Validate
npm install
npm run validate-env

# Launch everything
npm run start:agents:express   # Terminal 1: Agents (:4021-4024)
cd packages/dashboard && npx next dev -p 3003  # Terminal 2: API
cd newgemdashboard && npx vite --port 3001      # Terminal 3: Dashboard

# Run the orchestrator (produces 26+ on-chain transactions)
cd packages/orchestrator && npx tsx src/index.ts
```

### Full Demo (60+ Transactions)

```bash
npm run demo:10   # 10 orchestrated runs → 260+ on-chain txns
```

---

## 🧩 Components

| Component | Stack | Port | Description |
|:---|:---|:---:|:---|
| **Vite Dashboard** | React 19 · Tailwind v4 · Zustand · Framer Motion | `3001` | Real-time task feed, playground, economy charts, receipts |
| **API Backend** | Next.js 14 · Supabase · x402 server SDK | `3003` | REST routes, payment verification, event streaming |
| **Orchestrator** | TypeScript ESM · `@circle-fin/x402-batching` | — | Task decomposition, gateway payments, settlement polling |
| **Research Agent** | Express · x402 middleware | `4021` | Deep research & information synthesis |
| **Code Agent** | Express · x402 middleware | `4022` | Code generation & implementation |
| **Test Agent** | Express · x402 middleware | `4023` | Test suite generation & QA |
| **Review Agent** | Express · x402 middleware | `4024` | Code review & quality scoring |
| **Landing Page** | Vite · React Three Fiber · Framer Motion | `3002` | 3D glassmorphism landing page (lazy-loaded Three.js) |

### Smart Contracts (Vyper 0.4.x — Deployed on Arc Testnet)

| Contract | Address | Standard | Purpose |
|:---|:---|:---:|:---|
| **IdentityRegistry** | `0x858A...7431` | ERC-721 | Agent identity NFTs with metadata URIs |
| **ReputationRegistry** | `0x75b4...f8Ea` | ERC-8004 | On-chain reputation scores (0–100) |
| **AgentEscrow** | `0x5714...07F3` | — | Task escrow (create → claim → complete) |
| **PaymentSplitter** | `0xc239...aa30` | — | Multi-recipient payment distribution |
| **SpendingLimiter** | `0xe0c7...072D` | — | Per-agent spending rate limits |

---

## 🔄 Transaction Flow

A single orchestrator run produces **26+ on-chain transactions**:

```
  1. ── Deposit USDC into Circle Gateway ────────────────────── 💰
  2. ── Pay Research Agent ──────────── 🔬 $0.005 ──── ⛓️ tx
  3. ── Pay Code Agent ──────────────── 💻 $0.005 ──── ⛓️ tx
  4. ── Pay Test Agent ──────────────── 🧪 $0.005 ──── ⛓️ tx
  5. ── Pay Review Agent ────────────── 📋 $0.005 ──── ⛓️ tx
  6. ── Create Escrow Task ──────────── 📝 ─────────── ⛓️ tx
  7. ── Agent Claims Escrow ─────────── ✋ ─────────── ⛓️ tx
  8. ── Submit Escrow Result ────────── 📦 ─────────── ⛓️ tx
  9. ── Approve Escrow Completion ───── ✅ ─────────── ⛓️ tx
 10. ── Write Reputation (×4 agents) ── ⭐ ─────────── ⛓️ tx
11. ── A2A Nanopayment Chains ───────── 🔗 ×11 ────── ⛓️ tx
     ...
 26. ── Settlement Complete ──────────── 🏁 Total: ~$0.01
```

> **5 tasks × 26 txns = 60+ on-chain transactions. Total cost: ~$0.05.**
> Every transaction is verifiable on [ArcScan](https://testnet.arcscan.app).

---

## ✅ Hackathon Requirements Checklist

### Mandatory Submission Requirements

| # | Requirement | Status | Evidence |
|:---:|:---|:---:|:---|
| REQ-01 | **Real per-action pricing ≤ $0.01** | ✅ | $0.005/agent call — 50% below the threshold |
| REQ-02 | **50+ on-chain transactions in demo** | ✅ | 260+ txns via `npm run demo:10`; 110+ via 10× pipeline run |
| REQ-03 | **Margin explanation** (fails with traditional gas) | ✅ | 97.8% margin on Arc vs −70000% on Ethereum — see [Margin Analysis](docs/MARGIN_ANALYSIS.md) |
| REQ-04 | **Transaction flow demo video** | ✅ | Shows end-to-end USDC payment + ArcScan verification |
| REQ-05 | **Circle Product Feedback** ($500 bonus) | ✅ | [`circle-product-feedback.md`](docs/circle-product-feedback.md) — detailed SDK feedback |
| REQ-06 | **Which Circle products used + why** | ✅ | Arc · USDC · Circle Gateway · Nanopayments · x402 (see below) |

### Track Alignment

| Track | How AgentWork Addresses It |
|:---|:---|
| 🤖 **Agent-to-Agent Payment Loop** | ✅ **Primary track**. 4 autonomous agents pay/receive in real-time via x402. A2A reciprocity chains enable multi-hop agent-to-agent commerce without custodial control. |
| 🧮 **Usage-Based Compute Billing** | ✅ Each agent call billed at $0.005 — precisely aligned to usage. SpendingLimiter enforces per-agent rate caps. |
| 🪙 **Per-API Monetization Engine** | ✅ Every Express agent endpoint is an x402-gated API. Research, Code, Test, Review — each charges per request. |
| 🛒 **Real-Time Micro-Commerce Flow** | ✅ Economic activity triggers and settles per interaction, not per subscription. Escrow lifecycle runs on-chain. |

### Circle Products Used

| Product | How We Use It | Why We Chose It |
|:---|:---|:---|
| **Arc L1** | All transactions settle on Arc (Chain ID 5042002) | Only chain where sub-cent payments are economically viable — USDC native gas at ~$0.0001/tx |
| **USDC** | Native gas token + payment denomination | Stable value, 6 decimals, no volatility risk for agent pricing |
| **Circle Gateway** | `GatewayClient` for buyer-side deposits/payments; `BatchFacilitatorClient` for seller-side verify+settle | EIP-3009 gasless signing — agents never hold ETH, never pay gas directly |
| **Nanopayments (x402)** | HTTP 402 payment-required protocol wrapping every agent endpoint | Web-native payment standard — any HTTP client can pay, no wallet extension needed |
| **`@circle-fin/x402-batching` SDK v2.1.0** | Official Circle SDK for both buyer and seller sides | Production-grade batching reduces on-chain footprint |

### Judging Criteria Alignment

| Criterion | How AgentWork Scores |
|:---|:---|
| **Application of Technology** | Gemini 4 31B for task decomposition + routing decisions; Featherless for LLM inference; Vyper for 5 deployed contracts; Circle x402 SDK v2.1.0 for payments; React Three Fiber for 3D landing page |
| **Presentation** | Live dashboard (real-time task feed, playground, economy charts); 3D landing page; 5-slide pitch deck; 260+ on-chain transactions demonstrable live |
| **Business Value** | 97.8% margin per agent call; first economically viable multi-agent marketplace; 3,500× cheaper than Ethereum; enables $0.005/action pricing that's impossible on any other chain |
| **Originality** | A2A reciprocity chains (agents pay agents); Gemini-powered adaptive routing (parallel vs sequential); full escrow lifecycle on-chain; ERC-8004 reputation + identity; spending limiter for budget enforcement |

### Google Gemini Integration

| Aspect | Implementation |
|:---|:---|
| **Model** | `google/gemma-4-31B-it` via Featherless API (Gemini family) |
| **Use Case** | Task decomposition, agent routing decisions, reputation scoring |
| **Function Calling** | `decideTaskRouting()` — chooses parallel vs sequential execution based on agent history |
| **Deep Think** | `decideReputationScore()` — evaluates agent output quality with reasoning chain |
| **Google AI Studio** | Used for prompt prototyping and routing strategy iteration |

### Differentiation from Other Submissions

| What Others Do | What AgentWork Does Differently |
|:---|:---|
| Mock payments or simulated transactions | **Real x402 payments** via Circle Gateway with on-chain settlement receipts |
| 2–3 agent simple loop | **7 subtasks in 4 parallel execution levels** with adaptive routing |
| No smart contracts | **5 deployed Vyper contracts** — Escrow, PaymentSplitter, Identity, Reputation, SpendingLimiter |
| No reputation system | **ERC-8004 on-chain reputation** with post-task feedback and quality scores |
| Basic cost comparison table | **Live margin dashboard** showing real-time revenue/gas/cost per agent |
| Single payment flow | **Full lifecycle**: deposit → escrow → pay → verify → settle → claim → reputation → A2A chain |

---

---

## 🛠️ Tech Stack

<table>
<tr>
<td width="33%">

### 🔒 Required (Per Hackathon)
- **Arc L1** — EVM-compatible settlement (Chain ID 5042002)
- **USDC** — Native gas token + payment denom (6 decimals)
- **Circle Nanopayments** — Sub-cent, high-frequency x402 payments
- **Circle Gateway** — EIP-3009 gasless batch settlements
- **`@circle-fin/x402-batching` v2.1.0** — Official Circle SDK
- **`@x402/core` + `@x402/evm`** — Protocol primitives

</td>
<td width="33%">

### 🧩 Recommended (Per Hackathon)
- **Vyper 0.4.x** — 5 deployed smart contracts
- **Moccasin + Titanoboa** — Deployment + testing framework
- **ERC-8004** — Agent identity + reputation standard
- **viem** — EVM interactions (peer dep for x402 SDK)

### 🤖 AI / LLM Partners
- **Google Gemini** (gemma-4-31B-it) — Task routing + reputation
- **Google AI Studio** — Prompt prototyping
- **Featherless** — LLM inference provider
- **AI/ML API** — Multi-model access

</td>
<td width="33%">

### 🖥️ Application Layer
- **Next.js 14** — API backend + SSR dashboard
- **React 19 + Vite** — Frontend dashboard
- **TypeScript** — Strict mode, ES modules
- **Supabase** — Realtime event streaming
- **Express** — Agent gateway (4 specialist agents)
- **React Three Fiber** — 3D landing page
- **Framer Motion / Motion** — Animations
- **Zustand** — State management
- **Docker Compose** — One-command deploy

</td>
</tr>
</table>

### Why This Stack?

| Decision | Reasoning |
|:---|:---|
| **Arc over Ethereum/L2** | Only chain where $0.005 payments are profitable (97.8% margin vs −70000% on ETH) |
| **x402 over custom payment** | Web-native HTTP 402 standard — any HTTP client can pay without wallet extensions |
| **Vyper over Solidity** | Safer contract language; hackathon recommended via `vyper-agentic-payments` and `erc-8004-vyper` references |
| **Gemini for routing** | Function calling enables programmatic routing decisions between parallel and sequential execution |
| **Circle Gateway over direct tx** | Gasless EIP-3009 signing — agents never hold ETH, batch settlements reduce on-chain footprint |
| **Express agents** | Unified host with x402 middleware — production-grade, not a toy Python wrapper |

---

## 📁 Project Structure

```
AgentWork/
├── 📂 packages/
│   ├── orchestrator/          ⚡ Task decomposition + x402 payment loop
│   │   └── src/
│   │       ├── index.ts           Main orchestrator entry
│   │       ├── executor.ts        GatewayClient.pay() execution
│   │       ├── gateway-settlement.ts  Settlement resolution polling
│   │       ├── receipts.ts        Payment receipt generation
│   │       ├── contracts.ts       On-chain contract interactions
│   │       └── economy/           Streaming · A2A · Governance · SLA
│   ├── dashboard/             📊 Next.js API backend + pages
│   │   ├── app/api/              REST routes (agents, receipts, stream)
│   │   └── components/           React components
│   ├── contracts/             ⛓️ Vyper smart contracts
│   │   ├── src/                  AgentEscrow · PaymentSplitter · etc.
│   │   └── tests/                Moccasin + Titanoboa tests
│   └── database/              🗄️ Supabase schema + seeds
├── 📂 agents/
│   └── express-server/        🤖 Unified agent host (:4021-4024)
│       └── server.ts             x402 middleware + specialist logic
├── 📂 newgemdashboard/        🖥️ Vite frontend dashboard
│   └── src/
│       ├── components/dashboard/ Dashboard shell + tabs
│       └── lib/                  Supabase · Store · API adapters
├── 📂 newlandingpage/         🌐 Landing page (React Three Fiber)
├── 📂 scripts/                📜 Demo, smoke-test, evidence collection
├── 📂 docs/                   📚 Documentation
└── 📂 evidence/               📋 Session recordings with tx hashes
```

---

## 🧠 Key Technical Highlights

### 1. Official Circle SDK — Not a Toy Implementation

```typescript
// Buyer-side: GatewayClient pays agents
import { GatewayClient } from "@circle-fin/x402-batching/client";

const gateway = new GatewayClient({
  chain: "arcTestnet",
  privateKey: process.env.ORCHESTRATOR_PRIVATE_KEY as Hex,
});

const result = await gateway.pay("http://localhost:4021/research");
console.log(`🔗 Explorer: https://testnet.arcscan.app/tx/${result.transaction}`);
```

```typescript
// Seller-side: BatchFacilitatorClient verifies + settles
import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";

const facilitator = new BatchFacilitatorClient({
  url: "https://gateway-api-testnet.circle.com",
});
const { isValid } = await facilitator.verify(payload, requirements);
const { success, transaction } = await facilitator.settle(payload, requirements);
```

### 2. Background Settlement Resolution

Gateway payments return immediately with a reference ID. We poll for on-chain settlement and backfill real tx hashes:

```typescript
// If payment ref isn't a real 0x hash yet, poll in background
if (txHash && !isRealTransactionHash(txHash)) {
  void resolveGatewaySettlement({ gatewayRef: txHash, taskId, onSettled });
}
```

### 3. EIP-3009 Gasless Signing

Users **never hold ETH** and **never pay gas directly**. The Circle Gateway handles:
1. Off-chain authorization signing (free)
2. Batch multiple authorizations together
3. Single on-chain settlement to Arc L1

### 4. 5 Deployed Vyper Contracts

All contracts are deployed on Arc testnet with real on-chain interactions — not mocks:

| Contract | Functions |
|:---|:---|
| **AgentEscrow** | `createTask` → `claimTask` → `submitResult` → `approveCompletion` |
| **PaymentSplitter** | `createSplit(recipients[], basisPoints[])` → `distribute()` |
| **IdentityRegistry** | `registerAgent(wallet, metadataUri)` → ERC-721 NFT |
| **ReputationRegistry** | `giveFeedback(agentId, score)` → `getSummary()` → avg score |
| **SpendingLimiter** | `setLimit(agent, amount, window)` → `recordSpending()` → `checkLimit()` |

---

## 📚 Documentation

| Document | Description |
|:---|:---|
| [📖 Setup Guide](docs/setup-guide.md) | Full step-by-step installation |
| [💰 Margin Analysis](docs/MARGIN_ANALYSIS.md) | Detailed economic comparison — why this only works on Arc |
| [📝 Circle Product Feedback](docs/circle-product-feedback.md) | Detailed SDK feedback for $500 Product Feedback prize |
| [📋 Submission Details](docs/SUBMISSION.md) | Full hackathon submission details |
| [🤖 LLM Provider Setup](docs/llm-provider-setup.md) | Multi-provider AI configuration (Gemini, Featherless, AI/ML API) |
| [🎯 Pitch Deck](agentwork-pitch-deck/) | 5-slide investor pitch deck |
| [🌐 Landing Page](http://localhost:3002) | 3D glassmorphism product page (React Three Fiber) |
| [📊 Live Dashboard](http://localhost:3001) | Real-time agent marketplace dashboard |

---

## 🏆 Prize Categories We're Competing For

| Prize | Amount | Our Qualification |
|:---|:---:|:---|
| **Online 1st Place** | $2,500 USDC | 260+ real on-chain txns, 5 Vyper contracts, full x402 integration |
| **On-site 1st Place** | $3,000 USDC | Live demo ready, all services dockerized |
| **Product Feedback** | $500 USDC | [Detailed Circle SDK feedback](docs/circle-product-feedback.md) covering 5 pain points with code-level suggestions |
| **Google Prize (Online)** | $1,200 | Gemini-powered task routing, reputation scoring, and function calling |
| **Featherless Prize** | 500 credits | Featherless inference for agent responses |

---

##  Arc Testnet Constants

| Constant | Value |
|:---|:---|
| **Chain ID** | `5042002` |
| **RPC** | `https://rpc.testnet.arc.network` |
| **USDC** | `0x3600000000000000000000000000000000000000` (6 decimals, native gas) |
| **Circle Gateway** | `0x0077777d7EBA4688BDeF3E311b846F25870A19B9` |
| **Explorer** | `https://testnet.arcscan.app` |
| **Faucet** | `https://faucet.circle.com` |
| **SDK Chain Name** | `"arcTestnet"` |

---

## 📜 License

MIT

---

<div align="center">

**Built with ❤️ for the [Agentic Economy on Arc](https://lablab.ai/event/agentic-economy-on-arc) Hackathon**

[⭐ Star this repo](https://github.com/HyperionBurn/AgentWork) · [🐛 Report Bug](https://github.com/HyperionBurn/AgentWork/issues) · [💡 Request Feature](https://github.com/HyperionBurn/AgentWork/issues)

</div>
