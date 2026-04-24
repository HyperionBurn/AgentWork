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
[![TypeScript](https://img.shields.io/badge/Lang-TypeScript-3178C6?style=flat-square)](https://www.typescriptlang.org)

<br/>

**Built for the [Agentic Economy on Arc](https://lablab.ai/event/agentic-economy-on-arc) Hackathon · April 2026**

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
| **Landing Page** | Vite · React Three Fiber · Framer Motion | `3000` | 3D glassmorphism landing page |

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

## ✅ Hackathon Submission

| # | Requirement | Status | Evidence |
|:---:|:---|:---:|:---|
| PRD-01 | Orchestrator deposits USDC → pays 4 agents | ✅ | [`executor.ts`](packages/orchestrator/src/executor.ts) |
| PRD-02 | Each `gateway.pay()` produces on-chain tx | ✅ | [`gateway-settlement.ts`](packages/orchestrator/src/gateway-settlement.ts) |
| PRD-03 | Dashboard shows real-time payment feed | ✅ | [`PlaygroundTab.tsx`](newgemdashboard/src/components/dashboard/tabs/PlaygroundTab.tsx) |
| PRD-04 | Agent health checks (online/offline) | ✅ | [`AgentsTab.tsx`](newgemdashboard/src/components/dashboard/tabs/AgentsTab.tsx) |
| PRD-05 | 60+ on-chain transactions in demo | ✅ | `npm run demo:10` → 260+ txns |
| PRD-06 | Explorer links to arcscan.app | ✅ | All receipts link to `testnet.arcscan.app/tx/` |
| PRD-07 | Economic comparison chart | ✅ | [`EconomyTab.tsx`](newgemdashboard/src/components/dashboard/tabs/EconomyTab.tsx) |
| PRD-08 | Deploy AgentEscrow.vy | ✅ | [`0x5714...07F3`](https://testnet.arcscan.app) |
| PRD-09 | Deploy PaymentSplitter.vy | ✅ | [`0xc239...aa30`](https://testnet.arcscan.app) |
| PRD-10 | ERC-8004 identity registration | ✅ | [`IdentityRegistry.vy`](packages/contracts/src/IdentityRegistry.vy) |
| PRD-11 | ReputationRegistry feedback | ✅ | [`ReputationRegistry.vy`](packages/contracts/src/ReputationRegistry.vy) |
| PRD-12 | SpendingLimiter rate limiting | ✅ | [`SpendingLimiter.vy`](packages/contracts/src/SpendingLimiter.vy) |
| PRD-13 | Circle Product Feedback | ✅ | [`circle-product-feedback.md`](docs/circle-product-feedback.md) |

---

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%">

### Blockchain Layer
- **Arc L1** — EVM-compatible, Chain ID 5042002
- **USDC** — Native gas token (6 decimals)
- **Circle Gateway** — x402 / EIP-3009 batching
- **Vyper 0.4.x** — Smart contracts

</td>
<td width="50%">

### Application Layer
- **Next.js 14** — API backend + dashboard
- **React 19 + Vite** — Modern frontend
- **TypeScript** — Strict mode, ES modules
- **Supabase** — Realtime event streaming

</td>
</tr>
<tr>
<td width="50%">

### Agent Infrastructure
- **Express** — Unified agent gateway
- **@circle-fin/x402-batching v2.1.0** — Official Circle SDK
- **@x402/core + @x402/evm** — Protocol primitives

</td>
<td width="50%">

### Dev Tools
- **Docker Compose** — One-command deploy
- **Moccasin** — Vyper deployment framework
- **Zustand** — State management
- **Framer Motion** — Animations

</td>
</tr>
</table>

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
| [💰 Margin Analysis](docs/MARGIN_ANALYSIS.md) | Detailed economic comparison |
| [📝 Circle Product Feedback](docs/circle-product-feedback.md) | SDK feedback ($500 bonus prize) |
| [📋 Submission Details](docs/SUBMISSION.md) | Full hackathon submission |
| [🤖 LLM Provider Setup](docs/llm-provider-setup.md) | Multi-provider AI configuration |

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
