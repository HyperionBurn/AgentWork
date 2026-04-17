# AgentWork — Ultimate Hackathon Blueprint

> **Hackathon**: Agentic Economy on Arc (lablab.ai)  
> **Dates**: April 20–26, 2026  
> **Prize Pool**: $10,000 USDC  
> **Submission**: Demo video + GitHub repo + written submission  
> **Bonus**: $500 USDC for best Circle Product Feedback

---

## 1. THE HOOK — Problem Framing

> *"AI agents are trapped by unit economics, not engineering capability."*

Every autonomous agent system hits the same wall: **the cost of routing value between agents exceeds the value the agents create.** A $0.03 API call wrapped in $2.00 of payment infrastructure, gas fees, escrow smart contracts, and settlement delays kills the business case before the first customer.

**AgentWork** proves that on-chain nanopayments via the Arc L1 + Circle Gateway can make multi-agent task decomposition economically viable at scale. We don't just claim this — we demonstrate it with 60+ live on-chain transactions, a real-time dashboard, and a three-scenario economic proof.

### The Core Argument (15 seconds)

| | Fiat (Stripe/PayPal) | L2 (Arbitrum/Base) | **Arc + Circle Gateway** |
|---|---|---|---|
| Min transaction | $0.30 | $0.05–$0.50 gas | **$0.001** |
| Settlement | 1–3 days | 12 sec–2 min | **<5 sec** |
| Inter-agent routing | Impossible | Expensive | **Native** |
| Cost for 50-agent task | $15.00+ | $2.50–$25.00 | **$0.05–$0.50** |

**Net margin improvement: 30–300x over existing alternatives.**

---

## 2. WHAT WE'RE BUILDING

### One-Sentence Pitch

A marketplace where an orchestrator agent decomposes tasks, hires specialist agents via x402 nanopayments on Arc, and settles results through on-chain escrow with ERC-8004 reputation — all visible on a real-time dashboard.

### Architecture (High-Level)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Task Input │  │ Real-Time    │  │ Arc Block        │  │
│  │ Panel      │  │ Dashboard    │  │ Explorer Links   │  │
│  └─────┬─────┘  └──────┬───────┘  └──────────────────┘  │
│        │               │  (Supabase real-time)          │
├────────┼───────────────┼────────────────────────────────┤
│        ▼               ▼                                │
│  ┌─────────────────────────────────────┐                │
│  │       ORCHESTRATOR AGENT (TS)       │                │
│  │  LangChain + @circle-fin/x402       │                │
│  │  Task decomposer → payment loop     │                │
│  └──────┬──────┬──────┬──────┬────────┘                │
│         │      │      │      │                          │
│    ┌────▼──┐ ┌─▼───┐ ┌▼────┐ ┌▼────┐                   │
│    │Research│ │Code │ │Test │ │Rev. │  ← Python Agents │
│    │Agent  │ │Agent│ │Agent│ │Agent│    (circlekit)    │
│    │ :4021 │ │:4022│ │:4023│ │:4024│                   │
│    └───────┘ └─────┘ └─────┘ └─────┘                   │
│         │      │      │      │                          │
│         ▼      ▼      ▼      ▼                          │
│  ┌─────────────────────────────────────┐                │
│  │         CIRCLE GATEWAY              │                │
│  │  EIP-3009 authorizations → Arc L1   │                │
│  └─────────────────┬───────────────────┘                │
│                    ▼                                     │
│  ┌─────────────────────────────────────┐                │
│  │     ARC L1 (Chain ID: 5042002)     │                │
│  │  USDC native gas · ~$0.001/tx      │                │
│  │  AgentEscrow · PaymentSplitter      │                │
│  │  IdentityRegistry · ReputationReg   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

### Components (What to Actually Build)

| # | Component | Tech | Source | Priority |
|---|-----------|------|--------|----------|
| 1 | **Dashboard** | Next.js + Supabase | Fork `circlefin/arc-nanopayments` | P0 |
| 2 | **Orchestrator** | TypeScript + LangChain | Modify `agent.mts` from arc-nanopayments | P0 |
| 3 | **Research Agent** | Python + Flask + circlekit | Fork `examples/agent-marketplace/server.py` | P0 |
| 4 | **Code Agent** | Python + Flask + circlekit | Clone Research Agent, change logic | P0 |
| 5 | **Test Agent** | Python + Flask + circlekit | Clone Research Agent, change logic | P1 |
| 6 | **Review Agent** | Python + Flask + circlekit | Clone Research Agent, change logic | P1 |
| 7 | **AgentEscrow** | Vyper | Deploy from `vyper-agentic-payments` | P1 |
| 8 | **PaymentSplitter** | Vyper | Deploy from `vyper-agentic-payments` | P1 |
| 9 | **SpendingLimiter** | Vyper | Deploy from `vyper-agentic-payments` | P2 |
| 10 | **IdentityRegistry** | Vyper | Deploy from `erc-8004-vyper` | P2 |
| 11 | **ReputationRegistry** | Vyper | Deploy from `erc-8004-vyper` | P2 |

---

## 3. TECHNICAL FOUNDATION (Verified Code Patterns)

### 3.1 Constants & Addresses

```typescript
const ARC_CHAIN_ID = 5042002;
const ARC_USDC = "0x3600000000000000000000000000000000000000";
const ARC_GATEWAY = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
const ARC_RPC = "https://rpc.testnet.arc.network";
const ARC_EXPLORER = "https://testnet.arcscan.io/tx/";
const ARC_FAUCET = "https://faucet.circle.com";
```

### 3.2 x402 Server — Python Agent (circlekit + Flask)

```python
from flask import Flask, request, jsonify
from circlekit import create_gateway_middleware
from circlekit.x402 import PaymentInfo
import asyncio

app = Flask(__name__)

# Configure gateway middleware
gateway_middleware = create_gateway_middleware(
    seller_address="0x_YOUR_WALLET",
    chain="arcTestnet",
)
_loop = asyncio.new_event_loop()
asyncio.set_event_loop(_loop)

def require_payment(price: str) -> PaymentInfo | dict:
    """Returns PaymentInfo on success, or 402 response dict."""
    payment_header = request.headers.get("Payment-Signature")
    future = asyncio.run_coroutine_threadsafe(
        gateway_middleware.process_request(
            payment_header=payment_header,
            path=request.path,
            price=price,
        ),
        _loop,
    )
    result = future.result(timeout=10)
    if isinstance(result, PaymentInfo):
        return result
    return result  # 402 challenge response

@app.route("/")
def index():
    """Free endpoint — agent metadata (ERC-8004 style discovery)."""
    return jsonify({
        "name": "research-agent",
        "version": "1.0.0",
        "description": "Deep research and information synthesis specialist",
        "pricing": {"/api/research": "$0.005"},
        "capabilities": ["web_search", "summarization", "citation"],
    })

@app.route("/api/research")
def research():
    """Paywalled endpoint — $0.005 per call."""
    payment = require_payment("$0.005")
    if not isinstance(payment, PaymentInfo):
        resp = jsonify(payment.get("body", payment))
        resp.status_code = payment.get("status", 402)
        return resp
    
    topic = request.args.get("topic", "default")
    # TODO: actual agent logic here
    return jsonify({
        "success": True,
        "paid_by": payment.payer,
        "amount": payment.amount,
        "result": f"Research on '{topic}' completed",
    })
```

### 3.3 x402 Client — Orchestrator (TypeScript + LangChain)

```typescript
import { GatewayClient } from "@circle-fin/x402-batching/client";

const gateway = new GatewayClient({
  chain: "arcTestnet",
  privateKey: process.env.ORCHESTRATOR_KEY!,
});

async function callAgent(url: string, price: string) {
  const result = await gateway.pay(url, { method: "GET" });
  console.log(`✅ Paid ${result.formattedAmount} USDC | TX: ${result.transactionHash}`);
  console.log(`   Explorer: https://testnet.arcscan.io/tx/${result.transactionHash}`);
  return result;
}

// Example: Decompose a task into subtasks, call each agent
async function executeTask(task: string) {
  await gateway.deposit("1"); // Fund with 1 USDC
  
  const subtasks = decompose(task); // LLM-based decomposition
  
  for (const sub of subtasks) {
    const agentUrl = AGENT_URLS[sub.agentType];
    const url = `${agentUrl}/api/${sub.endpoint}?input=${encodeURIComponent(sub.input)}`;
    await callAgent(url, sub.price);
    // Each call = 1 on-chain transaction with visible gateway_tx hash
  }
}
```

### 3.4 x402 Server — Next.js Dashboard (withGateway middleware)

```typescript
import { withGateway } from "@/lib/x402";
import { NextRequest, NextResponse } from "next/server";

// Paywalled dashboard data endpoint
export const GET = withGateway(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agent");
    // Fetch real-time stats from Supabase
    return NextResponse.json({ agentId, status: "active", earnings: "0.05" });
  },
  "$0.001",
  "/api/agent-stats",
);
```

### 3.5 ERC-8004 Contract Deployment

```python
# Using Moccasin framework
from contracts import IdentityRegistry, ReputationRegistry

def deploy_contracts():
    identity = IdentityRegistry.deploy(sender=deployer)
    reputation = ReputationRegistry.deploy(identity.address, sender=deployer)
    
    # Register our agents
    identity.registerAgent("research-agent", "0x...", metadata_uri="ipfs://...", sender=deployer)
    identity.registerAgent("code-agent", "0x...", metadata_uri="ipfs://...", sender=deployer)
    
    return identity, reputation
```

### 3.6 Vyper Contract Addresses (Deploy Day 1-2)

```
# Arc Testnet — deployed contracts (fill in after deploy)
IDENTITY_REGISTRY=0x_
REPUTATION_REGISTRY=0x_
AGENT_ESCROW=0x_
PAYMENT_SPLITTER=0x_
SPENDING_LIMITER=0x_
```

---

## 4. TRANSACTION FLOW — How We Hit 60+ On-Chain Transactions

### Single Task Execution (12 transactions)

| # | Action | Type | Contract/Protocol | Cost |
|---|--------|------|-------------------|------|
| 1 | Orchestrator deposits USDC into Gateway | Deposit | Circle Gateway | Free |
| 2 | Pay Research Agent — initial query | x402 Payment | Circle Gateway | $0.005 |
| 3 | Pay Research Agent — follow-up | x402 Payment | Circle Gateway | $0.005 |
| 4 | Pay Code Agent — implementation | x402 Payment | Circle Gateway | $0.005 |
| 5 | Pay Test Agent — test suite | x402 Payment | Circle Gateway | $0.005 |
| 6 | Pay Review Agent — quality check | x402 Payment | Circle Gateway | $0.005 |
| 7 | Pay Code Agent — fix iteration 1 | x402 Payment | Circle Gateway | $0.005 |
| 8 | Pay Test Agent — re-test | x402 Payment | Circle Gateway | $0.005 |
| 9 | Create escrow task | Contract Call | AgentEscrow.vy | $0.001 |
| 10 | Agent claims escrow task | Contract Call | AgentEscrow.vy | $0.001 |
| 11 | Approve escrow completion | Contract Call | AgentEscrow.vy | $0.001 |
| 12 | Submit reputation feedback | Contract Call | ReputationRegistry.vy | $0.001 |

**Subtotal: 12 on-chain transactions, $0.044 total cost**

### Demo Strategy — Run 5 Tasks in Sequence

```
5 tasks × 12 transactions = 60 on-chain transactions
Total cost: $0.22
Total demo time: ~90 seconds (with 1-2 second delays between payments)
```

### ⚠️ CRITICAL VERIFICATION (Day 1, First Hour)

Before building anything, verify that each `gateway.pay()` call produces a **distinct on-chain transaction hash** visible on `testnet.arcscan.io`:

```typescript
// Verification script — run this FIRST
const result = await gateway.pay("http://localhost:4021/api/research?topic=test");
console.log(result.transactionHash); // Must be a non-null hash
// Open https://testnet.arcscan.io/tx/${result.transactionHash} — must show on explorer
```

If batch settlement collapses multiple payments into one transaction, **pivot strategy**: use more contract calls (escrow create/claim/complete per subtask) and identity registrations to ensure 50+ distinct on-chain transactions.

---

## 5. FIVE-DAY BUILD PLAN

### Day 0 (April 20, Sunday) — Foundation

**Goal**: Everything compiles, everything connects, first payment flows end-to-end.

| Hour | Task | Deliverable |
|------|------|-------------|
| 0-1 | Fork `circlefin/arc-nanopayments`, install deps | Repo builds with `npm run dev` |
| 1-2 | Set up Supabase project, configure env vars | `.env.local` with all keys |
| 2-3 | Fund wallets from Arc faucet | 2+ USDC in orchestrator wallet |
| 3-4 | **Verify single x402 payment on explorer** | Transaction hash visible on arcscan |
| 4-5 | Set up Python envs for agent servers | `pip install circlekit flask` works |
| 5-6 | Run first Python agent (research), pay from orchestrator | Payment logged in Supabase |
| 6-8 | Create GitHub repo, push initial code | Clean repo history |

**Risk**: If x402 payment doesn't produce on-chain tx, investigate Gateway settlement behavior immediately.

### Day 1 (April 21, Monday) — Agents + Payments

**Goal**: All 4 agents running, orchestrator calling them sequentially, payments flowing.

| Hour | Task | Deliverable |
|------|------|-------------|
| 0-2 | Build Research Agent (Flask + circlekit) | `GET /` returns metadata, `/api/research` paywalled |
| 2-3 | Clone → Code Agent | `/api/generate` paywalled endpoint |
| 3-4 | Clone → Test Agent | `/api/test` paywalled endpoint |
| 4-5 | Clone → Review Agent | `/api/review` paywalled endpoint |
| 5-7 | Build orchestrator decomposition logic | Takes task string → array of agent calls |
| 7-9 | End-to-end: orchestrator → 4 agents → 12 txns | All txns visible on arcscan |
| 9-10 | Add tx hashes to Supabase for dashboard | Dashboard shows live payments |

### Day 2 (April 22, Tuesday) — Smart Contracts + Reputation

**Goal**: ERC-8004 identity + reputation deployed, Vyper escrow contracts live.

| Hour | Task | Deliverable |
|------|------|-------------|
| 0-2 | Deploy IdentityRegistry + ReputationRegistry | Contract addresses in `.env` |
| 2-3 | Register all 4 agents on-chain | Agent NFTs minted |
| 3-4 | Deploy AgentEscrow.vy | Contract address confirmed |
| 4-5 | Deploy PaymentSplitter.vy | Revenue split configured |
| 5-6 | Integrate escrow into orchestrator flow | createTask → claimTask → completeTask |
| 6-7 | Post-task reputation feedback flow | giveFeedback() called after completion |
| 7-8 | Run full task with escrow + reputation | 15+ on-chain transactions per task |
| 8-10 | Dashboard shows contract interactions | Explorer links for every action |

### Day 3 (April 23, Wednesday) — Polish + Scale

**Goal**: Dashboard looks professional, run 5 tasks to hit 60+ transactions, optimize UX.

| Hour | Task | Deliverable |
|------|------|-------------|
| 0-2 | Dashboard redesign — agent cards, task feed, tx list | Polished UI |
| 2-3 | Real-time Supabase subscriptions for live updates | Payments appear instantly |
| 3-4 | Agent metadata endpoint (ERC-8004 discovery format) | Standardized `/` endpoint on all agents |
| 4-5 | Run 5 sequential tasks | 60+ on-chain transactions confirmed |
| 5-6 | Screenshot all 60+ transactions on arcscan | Evidence folder created |
| 6-7 | Add error handling, retries, edge cases | Graceful failure modes |
| 7-8 | Economic comparison section for submission | Three-scenario table with real numbers |
| 8-10 | Start writing submission document | Draft 80% complete |

### Day 4 (April 24, Thursday) — Demo + Submission

**Goal**: Demo video recorded, submission finalized, Product Feedback written.

| Hour | Task | Deliverable |
|------|------|-------------|
| 0-2 | Write and rehearse demo script | 3-minute walkthrough |
| 2-3 | Record demo video (screen capture + voiceover) | MP4, under 5 minutes |
| 3-4 | Finalize written submission document | PDF with all sections |
| 4-5 | Write Circle Product Feedback ($500 bonus) | Specific, actionable, architectural |
| 5-6 | Submit to lablab.ai | Confirmation receipt |
| 6-8 | Buffer for fixes, re-recording, final polish | Everything submitted |
| 8-10 | Rest. Do not add features. | Sleep |

### Day 5 (April 25, Saturday) — Judging Buffer

- Monitor for judge questions
- Fix any demo issues
- **Do not add new features**

---

## 6. DEMO SCRIPT (3 Minutes)

### Hook (30 seconds)

> "Right now, AI agents can do incredible work — but paying them is broken. Stripe charges $0.30 minimum. Ethereum gas costs $2-50 per transaction. This makes multi-agent systems economically impossible."
>
> "AgentWork solves this with Arc L1 nanopayments. Watch what happens when we decompose a real task."

### Live Demo (90 seconds)

1. **Show dashboard** — "This is our task marketplace. I'll submit a task: *Build a REST API with tests and documentation*."
2. **Watch payments flow** — "The orchestrator decomposes this into 5 subtasks and routes them to specialist agents. Each payment is $0.005 — half a cent."
3. **Show arcscan** — "Every single payment is a real on-chain transaction on Arc. Here's the block explorer — 60 transactions, total cost under $0.25."
4. **Show reputation** — "After completion, the reviewer agent submits on-chain feedback via ERC-8004. This builds a trust history that's immutable and portable."

### Close (30 seconds)

> "The same task on Stripe would cost $15. On Ethereum, $50-100. On Arc? Twenty-two cents. That's a 70x cost reduction that makes autonomous agent economies viable for the first time."

---

## 7. RISK REGISTER

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| 1 | **x402 payments batch into few on-chain txns** | Medium | **Critical** | Verify Day 0. Pivot: add more escrow/identity contract calls per task to hit 50+ |
| 2 | **Arc faucet runs dry or rate-limited** | Low | High | Request faucet funds early (Day 0). Keep backup wallet funded. |
| 3 | **circlekit Python SDK breaks or missing deps** | Medium | High | Have TypeScript fallback for all agents. Test `pip install` Day 0. |
| 4 | **Vyper contract deployment fails** | Low | Medium | Smart contracts are P1, not P0. Demo works without them. |
| 5 | **Supabase real-time doesn't work as expected** | Low | Low | Poll as fallback. Dashboard is nice-to-have, not required. |
| 6 | **Demo video tech issues (OBS, audio)** | Medium | Medium | Record on Day 4, leaving Day 5 for re-recording. Use simple screen capture. |
| 7 | **LLM API rate limits during demo** | Medium | Medium | Hardcode demo responses. Never depend on live LLM in demo. |
| 8 | **Other teams build similar project** | High | Low | Execution quality differentiates. Our verified code patterns give us a 2-day head start. |

---

## 8. JUDGING STRATEGY

### Hackathon Criteria (from lablab.ai)

| Criterion | Weight | Our Play |
|-----------|--------|----------|
| Innovation | High | Nanopayment marketplace is novel. Economic proof makes it tangible. |
| Technical Complexity | High | 4 agent servers + orchestrator + 5 Vyper contracts + x402 + ERC-8004 |
| On-Chain Activity | **Critical** | 60+ transactions, all linked on arcscan with explorer proofs |
| UX / Presentation | Medium | Real-time dashboard, clean demo, arcscan integration |
| Use of Circle/Arc Stack | High | Gateway, x402, USDC gas, nanopayments — full stack utilization |

### Past Winner DNA Analysis

| Winner | What Made Them Win | Our Application |
|--------|-------------------|-----------------|
| **ClawRouter** | Solved real routing problem with clean UI | We solve real unit economics problem with dashboard |
| **ClawShield** | Security focus + working prototype | Our escrow + spending limiter = security focus |
| **MoltDAO** | Strong on-chain activity proofs | Our 60+ txns with arcscan links |
| **AisaEscrow** | Escrow + reputation on Arc | Our AgentEscrow + ReputationRegistry |
| **Agentic Markets** | Agent marketplace concept | We build the actual working version |

### The $500 Product Feedback Bonus

Write specific, architectural feedback to Circle:

1. **WebSocket support for Gateway events** — Currently polling. Real-time payment notifications would improve UX dramatically for agent orchestration loops.
2. **ERC-8004 + x402 middleware integration** — Agent discovery (ERC-8004) and payment (x402) should be unified in a single middleware. Currently they're separate concerns.
3. **Batch settlement visibility** — Clarify in docs whether each `pay()` produces one on-chain txn or if they're aggregated. Add a `settlementStatus` field to payment responses.

---

## 9. PROJECT STRUCTURE

```
agentwork/
├── packages/
│   ├── dashboard/          # Next.js + Supabase (fork arc-nanopayments)
│   │   ├── app/
│   │   │   ├── page.tsx          # Main dashboard
│   │   │   └── api/
│   │   │       ├── agent-stats/  # Paywalled stats endpoint
│   │   │       └── task-status/  # Task progress endpoint
│   │   ├── components/
│   │   │   ├── TaskFeed.tsx      # Live task stream
│   │   │   ├── AgentCard.tsx     # Agent info + earnings
│   │   │   ├── TxList.tsx        # On-chain transaction list
│   │   │   └── EconomicChart.tsx # Fiat vs L2 vs Arc comparison
│   │   ├── lib/
│   │   │   ├── x402.ts           # withGateway middleware
│   │   │   └── supabase.ts       # Real-time subscriptions
│   │   └── .env.local
│   │
│   ├── orchestrator/        # TypeScript + LangChain
│   │   ├── src/
│   │   │   ├── decomposer.ts     # Task → subtask decomposition
│   │   │   ├── executor.ts       # Payment loop over agents
│   │   │   ├── escrow.ts         # On-chain escrow integration
│   │   │   └── reputation.ts     # Post-task feedback
│   │   └── package.json
│   │
│   └── contracts/          # Vyper (from vyper-agentic-payments + erc-8004-vyper)
│       ├── src/
│       │   ├── AgentEscrow.vy
│       │   ├── PaymentSplitter.vy
│       │   ├── SpendingLimiter.vy
│       │   ├── IdentityRegistry.vy
│       │   └── ReputationRegistry.vy
│       ├── script/
│       │   └── deploy.py
│       └── tests/
│
├── agents/                 # Python agent servers
│   ├── research-agent/
│   │   ├── server.py       # Flask + circlekit
│   │   ├── agent_logic.py  # Actual research capability
│   │   └── requirements.txt
│   ├── code-agent/
│   │   ├── server.py
│   │   ├── agent_logic.py
│   │   └── requirements.txt
│   ├── test-agent/
│   │   ├── server.py
│   │   ├── agent_logic.py
│   │   └── requirements.txt
│   └── review-agent/
│       ├── server.py
│       ├── agent_logic.py
│       └── requirements.txt
│
├── .env                    # Shared secrets
├── docker-compose.yml      # One command to run everything
└── README.md               # Setup instructions + demo video link
```

---

## 10. SUBMISSION CHECKLIST

- [ ] GitHub repo with clean README and setup instructions
- [ ] Demo video (under 5 minutes, uploaded to YouTube/unlisted)
- [ ] 60+ on-chain transactions with arcscan explorer links
- [ ] Written submission: problem statement, architecture, economic proof
- [ ] Three-scenario economic comparison (Fiat vs L2 vs Arc)
- [ ] Real-time dashboard screenshot
- [ ] Circle Product Feedback document (for $500 bonus)
- [ ] `docker-compose up` runs the full stack
- [ ] All env vars documented in `.env.example`
- [ ] Code comments explaining x402 flow

---

## 11. WHAT WE'RE NOT BUILDING (Scope Exclusions)

| Excluded | Why |
|----------|-----|
| 51 Circle Developer Wallets | Too slow to provision. Use viem `generatePrivateKey()` for agent wallets. |
| Custom escrow contract design | Use existing `AgentEscrow.vy` — battle-tested, 108+ tests. |
| zkML / TEE validation | ValidationRegistry is simple 0-100 scores. Don't fabricate capabilities. |
| 50 parallel HTTP requests | Sequential payments with visible tx hashes are more convincing. |
| All 5 Vyper contracts in critical path | SpendingLimiter + IdentityRegistry are P2. Core demo works without them. |
| Real LLM calls in demo | Hardcode responses for reliability. Live LLM = demo failure risk. |
| Mobile app or browser extension | Web dashboard only. Don't split focus. |

---

## 12. WINNING FORMULA

```
TECHNICAL FOUNDATION  (from Agent Bazaar / our research)
  ↓ fork arc-nanopayments, use circlekit, verified code patterns
  +
EXECUTION DISCIPLINE   (from AgentWork)
  ↓ Day 1 infra-first, risk register, hardcoded demo, 59-txn counting
  +
JUDGING OPTIMIZATION   (from OmniContext)
  ↓ three-scenario economic proof, past winner DNA, Product Feedback strategy
  =
AGENTWORK ULTIMATE BLUEPRINT
```

**Our unfair advantage**: We're not starting from scratch. We're forking `circlefin/arc-nanopayments` (a working x402 demo with dashboard) and `vyperlang/vyper-agentic-payments` (working agent marketplace with Flask + circlekit). Our competitors are writing boilerplate — we're wiring together proven components.

---

*"The best hackathon submissions don't invent new technology. They combine existing pieces in a way that makes judges say: 'Why doesn't this exist already?'"*
