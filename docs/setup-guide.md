# AgentWork — Setup Guide

> Complete step-by-step guide to run AgentWork locally for the hackathon demo.

---

## Prerequisites

- **Node.js** 18+ and npm
- **Docker** (optional, for full-stack)
- **Supabase CLI** (for local DB) or a Supabase cloud project

---

## 1. Clone and Install

```bash
git clone <repo-url>
cd arcagents

# Install Node.js workspaces (dashboard + orchestrator + agents)
npm install
```

## 2. Environment Setup

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` with your values:

```bash
# === Arc Blockchain ===
ARC_CHAIN_ID=5042002
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_USDC=0x3600000000000000000000000000000000000000
ARC_GATEWAY=0x0077777d7EBA4688BDeF3E311b846F25870A19B9
ARC_EXPLORER=https://testnet.arcscan.io/tx/

# === Wallet (generate with: npm run generate-wallet) ===
ORCHESTRATOR_PRIVATE_KEY=0x_your_private_key_here
SELLER_WALLET=0x_your_address_here

# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# === Agents ===
RESEARCH_AGENT_PORT=4021
CODE_AGENT_PORT=4022
TEST_AGENT_PORT=4023
REVIEW_AGENT_PORT=4024
```

## 3. Generate and Fund Wallet

```bash
# Generate a new Arc testnet wallet
npm run generate-wallet

# Copy the output to .env:
#   ORCHESTRATOR_PRIVATE_KEY=<private-key>
#   SELLER_WALLET=<address>

# Fund the wallet with testnet USDC
# Open https://faucet.circle.com and paste your address
```

## 4. Set Up Database

```bash
# Option A: Supabase Cloud
# 1. Create a project at https://supabase.com
# 2. Run schema.sql in the SQL editor
# 3. Run seed.sql in the SQL editor
# 4. Copy the URL and keys to .env

# Option B: Local Supabase
supabase init
supabase start
# Then apply migrations:
supabase db reset
```

Apply the schema:
```bash
# In Supabase SQL editor or via CLI:
# 1. Run packages/database/schema.sql
# 2. Run packages/database/seed.sql
```

## 5. Start Agent Gateway (Real Mode)

The Agent Gateway hosts all 4 specialist agents (Research, Code, Test, Review) and enforces real x402 payment verification using the official Circle SDK.

```bash
# Start the unified Express Gateway
npm run start:agents:express
```

Verify agents are running:
```bash
# All ports should return 200 OK
curl http://localhost:4021/health
curl http://localhost:4022/health
curl http://localhost:4023/health
curl http://localhost:4024/health
```

## 6. Start Dashboard

```bash
npm run dev:dashboard
# → http://localhost:3000
```

## 7. Run Orchestrator (Payment Demo)

```bash
# Single run (4 agent payments)
npm run dev:orchestrator

# Demo run with 15 iterations (60+ transactions)
# Set DEMO_RUNS=15 in .env or:
DEMO_RUNS=15 npm run dev:orchestrator
```

## 8. Verify On-Chain

```bash
# Check orchestrator output for tx hashes
# Each payment produces an arcscan link like:
# 🔗 Explorer: https://testnet.arcscan.io/tx/0xabc123...
```

---

## Docker (Alternative)

```bash
# Start all services
docker-compose up --build

# Stop
docker-compose down
```

Services:
- Dashboard: http://localhost:3000
- Agent Gateway: http://localhost:4021-4024
- Orchestrator: runs once and exits

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Module not found: @x402/evm` | `npm install @x402/core @x402/evm` in dashboard |
| `supabaseUrl is required` | Set `NEXT_PUBLIC_SUPABASE_URL` in `.env` |
| Agent rejects payment | Check `SELLER_WALLET` in `.env` matches the destination wallet |
| `balances.available undefined` | Use `balances.gateway.formattedAvailable` |
| No transactions on dashboard | Check Supabase Realtime is enabled on `payment_events` + `task_events` |
| Wallet has no USDC | Fund at https://faucet.circle.com |

---

## Vyper Contracts (Optional)

> [!NOTE]
> Smart contracts are optional for the core payment demo but recommended for the full AgentWork experience.

```bash
cd packages/contracts
# Requires Python for contract compilation/testing
pip install moccasin vyper snekmate

# Compile
moccasin compile

# Test locally
moccasin test

# Deploy to Arc testnet
moccasin run script/deploy.py --network arc_testnet
```
