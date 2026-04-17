<div align="center">

# 🤖 AgentWork

### AI Agent Marketplace with Nanopayments on Arc L1

**Autonomous agents. Sub-cent payments. On-chain reputation.**

[![Arc](https://img.shields.io/badge/Chain-Arc%20L1-7C3AED)](https://testnet.arcscan.io)
[![Circle](https://img.shields.io/badge/Payments-Circle%20Gateway-3B82F6)](https://www.circle.com)
[![x402](https://img.shields.io/badge/Protocol-x402-10B981)](https://github.com/circlefin/x402)
[![ERC-8004](https://img.shields.io/badge/Standard-ERC--8004-F59E0B)](https://github.com/vyperlang/erc-8004-vyper)
[![CI](https://img.shields.io/github/actions/workflow/status/your-org/agentwork/ci.yml?branch=main&label=CI)](https://github.com/your-org/agentwork/actions)

---

**Built for the [Agentic Economy on Arc](https://lablab.ai/event/agentic-economy-on-arc) Hackathon**

</div>

## 🎥 Demo Video

[Watch the 3-minute demo](https://youtu.be/PLACEHOLDER) — See 60+ on-chain transactions, real-time payments, and live agent orchestration.

---

## The Problem

AI agents can do incredible work — but **paying them is broken**:

| Payment Method | Min Transaction | Settlement | Inter-Agent Routing |
|---|---|---|---|
| **Stripe / PayPal** | $0.30 | 1–3 days | ❌ Impossible |
| **L2 (Arbitrum/Base)** | $0.05–$0.50 | 12s–2min | 💸 Expensive |
| **Arc + Circle Gateway** | **$0.001** | **<5 sec** | ✅ **Native** |

A 50-agent task costs **$15+ on Stripe** and **$2-25 on L2s**. On Arc? **Under $0.50**.

## What We Built

AgentWork is a marketplace where an **orchestrator agent** decomposes tasks, hires **specialist agents** via x402 nanopayments on Arc, and settles results through **on-chain escrow** with **ERC-8004 reputation**.

```
┌──────────────────────────────────────────────┐
│              Dashboard (Next.js)              │
│   Real-time feed · Arc explorer links         │
├──────────────────────────────────────────────┤
│           Orchestrator (TypeScript)           │
│   Task decomposer → x402 payment loop         │
├──────┬──────┬──────┬──────┬─────────────────┤
│Research│ Code │ Test │Review│  Python Agents  │
│Agent  │Agent │Agent │Agent │  (Flask+circlekit)│
│ :4021 │ :4022│ :4023│ :4024│                 │
├──────┴──────┴──────┴──────┴─────────────────┤
│           Circle Gateway (x402)               │
│   EIP-3009 authorizations → Arc L1            │
├──────────────────────────────────────────────┤
│        Arc L1 · USDC Gas · $0.001/tx          │
│   AgentEscrow · PaymentSplitter · ERC-8004    │
└──────────────────────────────────────────────┘
```

## Architecture

### Components

| Component | Tech | Purpose |
|-----------|------|---------|
| **Dashboard** | Next.js + Supabase + Tailwind | Real-time task feed, agent cards, tx explorer |
| **Orchestrator** | TypeScript + @circle-fin/x402-batching | Task decomposition + payment execution |
| **Research Agent** | Python + Flask + circlekit | Deep research and information synthesis |
| **Code Agent** | Python + Flask + circlekit | Code generation and implementation |
| **Test Agent** | Python + Flask + circlekit | Test suite generation and QA |
| **Review Agent** | Python + Flask + circlekit | Code review and quality scoring |
| **AgentEscrow** | Vyper | On-chain task escrow (create→claim→complete) |
| **PaymentSplitter** | Vyper | Multi-recipient payment distribution |
| **SpendingLimiter** | Vyper | Per-agent spending rate limits |
| **IdentityRegistry** | Vyper (ERC-721) | Agent identity NFTs |
| **ReputationRegistry** | Vyper (ERC-8004) | On-chain reputation scoring |

### Transaction Flow

A single task execution produces **12+ on-chain transactions**:

1. Deposit USDC into Gateway
2. Pay Research Agent — initial query
3. Pay Research Agent — follow-up
4. Pay Code Agent — implementation
5. Pay Code Agent — fix iteration
6. Pay Test Agent — test suite
7. Pay Test Agent — re-test
8. Pay Review Agent — quality check
9. Create escrow task
10. Agent claims escrow
11. Approve escrow completion
12. Submit reputation feedback

**5 tasks × 12 txns = 60+ on-chain transactions. Total cost: ~$0.22**

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Python](https://python.org/) 3.11+
- Arc testnet wallet with USDC ([Faucet](https://faucet.circle.com))
- [Supabase](https://supabase.com/) account (for dashboard)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-org/agentwork.git
cd agentwork

# 2. Configure environment
cp .env.example .env
# Edit .env with your wallet keys and Supabase credentials

# 2b. Validate environment
npm run validate-env

# 3. Install dependencies
npm install                    # Node.js packages
pip install -r agents/*/requirements.txt  # Python packages

# 4. Fund your wallet from the Arc faucet
# https://faucet.circle.com

# 5. Start all services
docker-compose up
```

### Development (without Docker)

```bash
# Terminal 1: Start agents
python agents/research-agent/server.py &
python agents/code-agent/server.py &
python agents/test-agent/server.py &
python agents/review-agent/server.py &

# Terminal 2: Start orchestrator
npm run dev:orchestrator

# Terminal 3: Start dashboard
npm run dev:dashboard
```

### Run a Task

```bash
# Execute the demo task (produces 7+ on-chain payments)
npm run run-task --workspace=packages/orchestrator

# Or set a custom task
DEMO_TASK="Analyze the market for AI agents" npm run run-task --workspace=packages/orchestrator
```

## Smart Contracts

Deploy to Arc testnet:

```bash
cd packages/contracts
pip install moccasin
moccasin run script/deploy.py --network arc_testnet
```

## Demo

The demo shows:

1. **Task submission** — "Build a REST API with auth and tests"
2. **Real-time payment flow** — Each agent call = $0.005 on Arc
3. **Block explorer proof** — Every payment visible on [ArcScan](https://testnet.arcscan.io)
4. **On-chain reputation** — Post-task ERC-8004 feedback
5. **Economic comparison** — 30-300x cost reduction vs alternatives

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Arc L1 (EVM-compatible, Chain ID 5042002) |
| **Payments** | Circle Gateway + x402 protocol |
| **Gas Token** | USDC (native on Arc) |
| **Smart Contracts** | Vyper (AgentEscrow, PaymentSplitter, IdentityRegistry, ReputationRegistry) |
| **Dashboard** | Next.js 14 + Tailwind CSS + Supabase |
| **Orchestrator** | TypeScript + @circle-fin/x402-batching |
| **Agents** | Python + Flask + circlekit |
| **Infrastructure** | Docker + Docker Compose |

## Project Structure

```
agentwork/
├── packages/
│   ├── dashboard/          # Next.js real-time dashboard
│   ├── orchestrator/       # TypeScript payment executor
│   └── contracts/          # Vyper smart contracts
├── agents/
│   ├── research-agent/     # Flask server on :4021
│   ├── code-agent/         # Flask server on :4022
│   ├── test-agent/         # Flask server on :4023
│   └── review-agent/       # Flask server on :4024
├── docker-compose.yml      # One-command deployment
├── .env.example            # Configuration template
└── README.md               # This file
```

---

## ✅ Hackathon Submission Checklist

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| PRD-01 | Orchestrator deposits USDC → pays 4 agents sequentially | ✅ | `packages/orchestrator/src/executor.ts` |
| PRD-02 | Each `gateway.pay()` produces visible on-chain tx hash | ✅ | ArcScan links in orchestrator output |
| PRD-03 | Dashboard shows real-time payment feed from Supabase | ✅ | `packages/dashboard/components/TaskFeed.tsx` |
| PRD-04 | Agent health checks (online/offline) on dashboard | ✅ | `packages/dashboard/app/api/agent-health/route.ts` |
| PRD-05 | 60+ on-chain transactions demonstrable in demo | ✅ | `DEMO_RUNS=15 npm run dev:orchestrator` |
| PRD-06 | Explorer links to arcscan.io for every payment | ✅ | `packages/dashboard/components/TxList.tsx` |
| PRD-07 | Economic comparison chart (Fiat vs L2 vs Arc) | ✅ | `packages/dashboard/components/EconomicChart.tsx` |
| PRD-08 | Deploy AgentEscrow.vy to Arc testnet | 🔜 | `packages/contracts/src/AgentEscrow.vy` |
| PRD-09 | Deploy PaymentSplitter.vy to Arc testnet | 🔜 | `packages/contracts/src/PaymentSplitter.vy` |
| PRD-10 | ERC-8004 identity registration for agents | 🔜 | `packages/contracts/src/IdentityRegistry.vy` |
| PRD-11 | ReputationRegistry post-task feedback | 🔜 | `packages/contracts/src/ReputationRegistry.vy` |
| PRD-12 | SpendingLimiter per-agent rate limiting | 🔜 | `packages/contracts/src/SpendingLimiter.vy` |
| PRD-13 | Circle Product Feedback document ($500 bonus) | ✅ | `docs/circle-product-feedback.md` |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/setup-guide.md) | Full step-by-step installation instructions |
| [Demo Script](docs/demo-script.md) | 3-minute walkthrough for hackathon judges |
| [Circle Product Feedback](docs/circle-product-feedback.md) | SDK feedback for $500 bonus prize |
| [Smart Contracts](packages/contracts/README.md) | Vyper contract documentation |
| [Evidence Directory](docs/evidence/README.md) | Screenshot and log collection guide |

## Key Addresses (Arc Testnet)

| Contract | Address |
|----------|---------|
| USDC | `0x3600000000000000000000000000000000000000` |
| Circle Gateway | `0x0077777d7EBA4688BDeF3E311b846F25870A19B9` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.io` |

## License

MIT
