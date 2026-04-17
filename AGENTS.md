# AgentWork — Agent Instructions

> **🧠 MANDATORY: Read this entire file into context before taking any action.**
> Every section contains hard-won constraints from active development.
> Violating these constraints causes real money loss on Arc testnet.

---

## 0. Boot Sequence (DO THIS FIRST)

Before writing a single line of code or answering any question, load the following into context in this exact order:

```
1. This file (AGENTS.md)                          ← you are here
2. .env.example                                   ← all constants and addresses
3. .copilot-tracking/research/20260416-agentwork-ultimate-blueprint.md  ← the plan
4. .copilot-tracking/research/20260416-hackathon-concept-comparative-analysis.md  ← verified patterns
5. package.json                                   ← workspace structure + scripts
6. /memories/                                     ← session + repo memory (if any)
```

**Never assume.** If a file in the boot sequence doesn't exist yet, note it and continue. If a constant is referenced that you can't find, search the codebase before guessing.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Name** | AgentWork |
| **Purpose** | AI agent marketplace with nanopayments on Arc L1 |
| **Hackathon** | Agentic Economy on Arc (lablab.ai, April 20–26, 2026) |
| **Prize** | $10,000 USDC + $500 Circle Product Feedback bonus |
| **Status** | Scaffolding complete · Day 0 starts April 20 |
| **Tech Stack** | Next.js 14 · TypeScript · Vyper · Python/Flask · Supabase · Docker |
| **Blockchain** | Arc L1 (EVM-compatible, Chain ID 5042002, USDC native gas) |

---

## 2. Arc Blockchain Constants (NEVER hardcode alternatives)

These are verified addresses. Do not invent alternatives.

```typescript
// Arc Testnet
ARC_CHAIN_ID      = 5042002
ARC_RPC_URL       = "https://rpc.testnet.arc.network"
ARC_USDC          = "0x3600000000000000000000000000000000000000"  // 6 decimals
ARC_GATEWAY       = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9"
ARC_EXPLORER      = "https://testnet.arcscan.io/tx/"
ARC_FAUCET        = "https://faucet.circle.com"
GATEWAY_API       = "https://gateway-api-testnet.circle.com"
```

```typescript
// SDK Chain Name (the ONLY valid value for GatewayClient)
chain: "arcTestnet"  // NOT "arc", NOT "arc-testnet", NOT 5042002
```

```typescript
// x402 Protocol Constants
X402_SCHEME       = "exact"
X402_NETWORK      = "eip155:5042002"
BATCH_NAME        = "GatewayWalletBatched"
BATCH_VERSION     = "1"
```

---

## 3. Architecture Map

```
packages/
├── dashboard/       Next.js 14 + Tailwind + Supabase
│   ├── app/             Pages + API routes
│   ├── components/      AgentCard · TaskFeed · TxList · EconomicChart
│   └── lib/             x402.ts (withGateway) · supabase.ts
├── orchestrator/    TypeScript + @circle-fin/x402-batching
│   └── src/             config · decomposer · executor · contracts · index
└── contracts/       Vyper smart contracts (Moccasin framework)
    ├── src/             AgentEscrow · PaymentSplitter · SpendingLimiter
    │                    IdentityRegistry · ReputationRegistry
    ├── script/          deploy.py
    └── tests/

agents/
├── research-agent/  Flask + circlekit · port 4021 · $0.005/call
├── code-agent/      Flask + circlekit · port 4022 · $0.005/call
├── test-agent/      Flask + circlekit · port 4023 · $0.005/call
└── review-agent/    Flask + circlekit · port 4024 · $0.005/call
```

### SDK Ownership Matrix

| Layer | SDK | Import Path | Key Classes |
|-------|-----|-------------|-------------|
| **Buyer (orchestrator)** | `@circle-fin/x402-batching` | `/client` | `GatewayClient` |
| **Seller (dashboard routes)** | `@circle-fin/x402-batching` | `/server` | `BatchFacilitatorClient`, `createGatewayMiddleware` |
| **Seller (Python agents)** | `circlekit` | `circlekit` | `create_gateway_middleware`, `GatewayClient` |
| **Contracts** | Vyper + Moccasin | `packages/contracts/src/` | `.vy` files |

---

## 4. Verified SDK API Surface (v2.1.0)

These types were verified by building against the actual npm package. **Do not guess at API methods.**

### GatewayClient (buyer-side, orchestrator)

```typescript
import { GatewayClient } from "@circle-fin/x402-batching/client";

const client = new GatewayClient({
  chain: "arcTestnet",              // SupportedChainName
  privateKey: "0x..." as Hex,       // MUST cast string → Hex
  rpcUrl?: "https://...",           // optional override
});

// Methods:
client.deposit(amount: string): Promise<DepositResult>
  // DepositResult { depositTxHash: Hex, amount: bigint, formattedAmount: string }

client.pay(url: string, init?: RequestInit): Promise<PayResult>
  // PayResult { data: T, amount: bigint, formattedAmount: string, transaction: string }
  // ⚠️ field is .transaction NOT .transactionHash

client.getBalances(): Promise<Balances>
  // Balances { wallet: { balance, formatted }, gateway: { total, available, formattedAvailable, ... } }
  // ⚠️ use balances.gateway.formattedAvailable NOT balances.available

client.withdraw(args: { amount: string, chain?, recipient?, maxFee? }): Promise<WithdrawResult>
```

### BatchFacilitatorClient (seller-side, dashboard)

```typescript
import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";

const facilitator = new BatchFacilitatorClient({
  url?: string;                      // default: https://gateway-api-testnet.circle.com
  createAuthHeaders?: () => Promise<{ verify, settle, supported }>;
  // ⚠️ NO chain, NO privateKey — server-side only
});

// Two-step verify + settle:
facilitator.verify(payload, requirements): Promise<{ isValid, invalidReason?, payer? }>
facilitator.settle(payload, requirements): Promise<{ success, errorReason?, transaction, network, payer? }>
```

### PaymentRequirements Shape

```typescript
const requirements = {
  scheme: "exact",
  network: "eip155:5042002",
  asset: "0x3600000000000000000000000000000000000000",
  amount: "$0.005",           // dollar-prefixed string
  payTo: sellerWallet,
  maxTimeoutSeconds: 60,
  extra: {
    name: "GatewayWalletBatched",
    version: "1",
    verifyingContract: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
  },
};
```

---

## 5. Spec-Driven Development Rules

### 5.1 The Spec is Law

Every feature starts with a spec. No code is written until the spec is written and reviewed.

**Spec Template** (store in `.copilot-tracking/specs/`):

```markdown
# SPEC: [Feature Name]
## Status: [DRAFT | APPROVED | IMPLEMENTING | DONE]
## Owner: [who owns this feature]
## Created: [date]
## Updated: [date]

### Problem
[1-2 sentences about what problem this solves]

### Acceptance Criteria
- [ ] Criterion 1 (testable)
- [ ] Criterion 2 (testable)

### Technical Design
[Pseudocode or interface definitions — NO implementation]

### Dependencies
- [Other specs or external services this depends on]

### Risks
- [What could go wrong]

### Changes Tracking
| Date | Change | Reason |
|------|--------|--------|
| [date] | [what changed] | [why] |
```

### 5.2 Implementation Sequence

```
SPEC (write first) → REVIEW (verify against blueprint) → IMPLEMENT → TEST → UPDATE SPEC STATUS
```

Never implement without an approved spec. Never approve a spec without checking it against the blueprint (§3 verified patterns) and the comparative analysis.

### 5.3 Change Tracking Protocol

Every non-trivial code change gets tracked:

1. **Before changing code**: Check `/memories/repo/` for relevant notes
2. **During change**: Update the spec's Changes Tracking table
3. **After change**: Write a memory note to `/memories/repo/` with what was learned
4. **Breaking changes**: Update this AGENTS.md file's affected sections

---

## 6. PRD (Product Requirements Document) — Hackathon Scope

### 6.1 MVP Requirements (Must-Have for Submission)

| ID | Requirement | Priority | Spec Status |
|----|-------------|----------|-------------|
| PRD-01 | Orchestrator deposits USDC → pays 4 agents sequentially | P0 | — |
| PRD-02 | Each `gateway.pay()` produces visible on-chain tx hash | P0 | — |
| PRD-03 | Dashboard shows real-time payment feed from Supabase | P0 | — |
| PRD-04 | Agent health checks (online/offline) on dashboard | P0 | — |
| PRD-05 | 60+ on-chain transactions demonstrable in demo | P0 | — |
| PRD-06 | Explorer links to arcscan.io for every payment | P0 | — |
| PRD-07 | Economic comparison chart (Fiat vs L2 vs Arc) | P0 | — |

### 6.2 Stretch Requirements (Nice-to-Have)

| ID | Requirement | Priority | Spec Status |
|----|-------------|----------|-------------|
| PRD-08 | Deploy AgentEscrow.vy to Arc testnet | P1 | — |
| PRD-09 | Deploy PaymentSplitter.vy to Arc testnet | P1 | — |
| PRD-10 | ERC-8004 identity registration for agents | P2 | — |
| PRD-11 | ReputationRegistry post-task feedback | P2 | — |
| PRD-12 | SpendingLimiter per-agent rate limiting | P2 | — |
| PRD-13 | Circle Product Feedback document ($500 bonus) | P1 | — |

### 6.3 Explicit Non-Goals

- 51 Circle Developer Wallets (use viem `generatePrivateKey()` instead)
- zkML / TEE validation (ValidationRegistry is simple 0–100 scores)
- Real LLM calls in demo (hardcode responses for reliability)
- Mobile app or browser extension
- Mainnet deployment

---

## 7. Memory System

### 7.1 Memory Hierarchy

```
/memories/
├── debugging.md          ← persistent debugging insights (auto-loaded)
├── patterns.md           ← recurring code patterns that work
├── crypto.md             ← blockchain/contract lessons learned
├── session/              ← current conversation only (cleared after)
│   ├── plan.md           ← what we're doing right now
│   └── progress.md       ← what's done vs pending
└── repo/                 ← repo-scoped facts (persist in workspace)
    ├── architecture.md   ← structural decisions
    └── contracts.md      ← deployed addresses, ABIs, tx hashes
```

### 7.2 Memory Write Rules

| Trigger | Action | Location |
|---------|--------|----------|
| SDK API surface discovered | Write type signature + source | `/memories/repo/architecture.md` |
| Contract deployed | Write address + tx hash + ABI path | `/memories/repo/contracts.md` |
| Debugging session >5 min | Write root cause + fix | `/memories/debugging.md` |
| Pattern used 3+ times | Extract to reusable pattern | `/memories/patterns.md` |
| Build break + fix | Write error + resolution | `/memories/debugging.md` |
| Crypto/chain lesson | Write specific finding | `/memories/crypto.md` |

### 7.3 Memory Read Rules

- **Always** check `/memories/` before starting any task
- **Always** check `/memories/session/` for in-progress state
- If a memory file contradicts this AGENTS.md, **trust the memory** (it's more recent)

---

## 8. Development Workflows

### 8.1 Daily Workflow (During Hackathon)

```
1. Load boot sequence (§0)
2. Check /memories/session/ for yesterday's state
3. Pick next item from 5-day plan (blueprint §5)
4. Write/update spec in .copilot-tracking/specs/
5. Implement against spec
6. Test locally (see §9)
7. Update memory + spec status
8. Git commit with conventional commit message
```

### 8.2 Git Commit Convention

```
type(scope): description

feat(orchestrator): add parallel payment execution
fix(dashboard): correct BatchFacilitatorClient config shape
spec(contracts): approve AgentEscrow deployment spec
docs(readme): add demo video link
chore(deps): bump @circle-fin/x402-batching to 2.1.0
```

Types: `feat` · `fix` · `spec` · `docs` · `chore` · `test` · `contract`

### 8.3 Branch Strategy

```
main          ← stable, always builds
├── day-0     ← foundation setup
├── day-1     ← agents + payments
├── day-2     ← contracts + reputation
├── day-3     ← polish + scale
└── day-4     ← demo + submission
```

Merge day-N into main at end of each day after verifying build passes.

### 8.4 PR Review Checklist (Self-Review Before Merge)

- [ ] TypeScript: `npx tsc --noEmit` passes in changed packages
- [ ] Dashboard: `npx next build` compiles (SSR errors from missing env are OK)
- [ ] No hardcoded private keys or API tokens
- [ ] All new constants use env vars from `.env.example`
- [ ] Spec status updated in `.copilot-tracking/specs/`
- [ ] Memory updated if something was learned

---

## 9. Testing & Validation Commands

```bash
# Type-check all TypeScript
npx tsc --noEmit -p packages/dashboard/tsconfig.json
npx tsc --noEmit -p packages/orchestrator/tsconfig.json

# Build dashboard (SSR errors from missing env vars are expected)
cd packages/dashboard && npx next build

# Start Python agents locally
python agents/research-agent/server.py  # → http://localhost:4021
python agents/code-agent/server.py      # → http://localhost:4022
python agents/test-agent/server.py      # → http://localhost:4023
python agents/review-agent/server.py    # → http://localhost:4024

# Health check all agents
curl http://localhost:4021/health
curl http://localhost:4022/health
curl http://localhost:4023/health
curl http://localhost:4024/health

# Run orchestrator demo (requires funded wallet + running agents)
cd packages/orchestrator && npx tsx src/index.ts

# Vyper contract tests (Moccasin framework)
cd packages/contracts && moccasin test

# Deploy contracts to Arc testnet
cd packages/contracts && moccasin run script/deploy.py --network arc_testnet

# Full stack with Docker
docker-compose up --build
```

---

## 10. Crypto & Blockchain Best Practices (2026)

### 10.1 Private Key Management

```
NEVER commit private keys to git (even testnet keys)
NEVER paste keys in chat/terminal output
ALWAYS use environment variables from .env (gitignored)
IF a key was exposed: revoke immediately, generate new, update .env
```

### 10.2 USDC on Arc

- USDC is the **native gas token** on Arc — no separate ETH/USDC pair needed
- USDC has **6 decimals** (not 18 like most ERC-20s)
- `$0.005` = `5000` atomic units (0.005 × 10^6)
- When displaying amounts: `BigInt(amount) / 1_000_000n` for human-readable
- When sending amounts: always use the dollar string (`"$0.005"`) with the SDK

### 10.3 Transaction Verification

Every on-chain action must be verified:

```typescript
// After any payment or contract call:
const txHash = result.transaction; // NOT result.transactionHash
const explorerUrl = `https://testnet.arcscan.io/tx/${txHash}`;

// ALWAYS log the explorer URL for demo evidence
console.log(`🔗 Explorer: ${explorerUrl}`);
```

### 10.4 Smart Contract Safety (Vyper)

- **Always** use `assert()` for invariants, `require()` for preconditions
- **Never** use `raw_call` unless absolutely necessary
- USDC approval: approve exact amounts, never `MAX_UINT256`
- Escrow pattern: funds locked in contract, released only on explicit approval
- Test with Moccasin + titanoboa before deploying to testnet
- Gas on Arc is ~$0.001/tx but still optimize — avoid loops over unbounded arrays

### 10.5 EIP-3009 (Gasless Transfers)

The Circle Gateway uses EIP-3009 `transferWithAuthorization`:

1. Orchestrator **signs** an off-chain authorization (no gas)
2. Gateway **batches** multiple authorizations
3. Gateway **submits** a single on-chain settlement to Arc
4. Each settlement may contain multiple authorizations but produces one tx hash

**Critical question** (resolve Day 0): Does each `gateway.pay()` produce a distinct on-chain tx hash, or are they batched into fewer settlements? This determines whether we hit 60+ txns via payments alone or need additional contract calls.

### 10.6 ERC-8004 (Agent Identity Standard)

```
IdentityRegistry (ERC-721)     → Mint NFT per agent, store metadata URI
ReputationRegistry             → giveFeedback(agentId, score, metadata)
                                 revokeFeedback(agentId, feedbackId)
                                 getSummary(agentId) → { total, count, average }
SpendingLimiter                → setLimit(agent, amount, timeWindow)
                                 recordSpending(agent, amount) → checkLimit(agent)
AgentEscrow                    → createTask → claimTask → submitResult → approveCompletion
PaymentSplitter                → createSplit(recipients[], basisPoints[]) → distribute()
```

Deploy order: `IdentityRegistry` → `ReputationRegistry(identity.address)` → rest

---

## 11. Tool Configuration

### 11.1 Package Manager

- **Node.js**: npm workspaces (defined in root `package.json`)
- **Python**: pip + venv per agent (no Poetry for speed during hackathon)
- **Vyper**: Moccasin framework (`pip install moccasin`)

### 11.2 Key Dependencies

```json
{
  "@circle-fin/x402-batching": "^2.1.0",   // ← verified version
  "@x402/core": "^2.3.0",                   // ← required peer dep
  "@x402/evm": "^2.3.0",                    // ← required peer dep
  "viem": "^2.0.0",                         // ← peer dep for x402-batching
  "next": "^14.2.0",
  "@supabase/supabase-js": "^2.0.0"
}
```

```txt
# Python agents
flask
circlekit              # graceful fallback if unavailable
python-dotenv
```

### 11.3 Environment Setup

```bash
# Node.js
npm install                          # installs all workspaces

# Python agents (per agent)
cd agents/research-agent
python -m venv .venv
.venv\Scripts\activate              # Windows
pip install -r requirements.txt

# Vyper contracts
cd packages/contracts
pip install moccasin vyper
```

---

## 12. Coding Standards

### 12.1 TypeScript / React

- **Strict mode** enabled in all tsconfig.json
- Use `as const` for all config objects
- Prefer `interface` over `type` for object shapes
- Named exports only (no default exports)
- Components: one component per file, PascalCase filename
- Hooks: `use` prefix, camelCase filename
- API routes: `app/api/[route]/route.ts` (Next.js App Router convention)

### 12.2 Python

- Python 3.11+ features OK (match/case, type hints, `X | Y` union syntax)
- Flask route functions: snake_case
- Error handling: always catch specific exceptions, never bare `except:`
- Type hints on all function signatures
- Docstrings on all public functions

### 12.3 Vyper

- Vyper 0.4.x syntax (not 0.3.x)
- State variables: `MAX_<NAME>` for constants
- Events: indexed first parameter for filtering
- Use `Snekmate` for ERC-20/721 base implementations
- All external functions: validate inputs with `assert()` at top

### 12.4 General

- **No `any` types** — use `unknown` and narrow
- **No `// @ts-ignore`** — fix the type error instead
- **No `TODO` without a ticket** — format: `TODO(prd-XX): description`
- **No commented-out code** — delete it, git has history
- **Max file length**: 300 lines. If longer, extract a module.

---

## 13. Known Issues & Lessons Learned

| Issue | Root Cause | Fix | Memory Location |
|-------|-----------|-----|-----------------|
| `@circle-fin/x402-batching@^0.1.0` not found | Package version was guessed | Use `^2.1.0` | Scaffolding session |
| `'chain' does not exist in BatchFacilitatorConfig` | Server-side facilitator takes only `url` + `createAuthHeaders` | Remove chain/privateKey from server config | `lib/x402.ts` rewrite |
| `result.transactionHash` undefined | DepositResult uses `depositTxHash`, PayResult uses `transaction` | Use correct field per type | `executor.ts` fixes |
| `balances.available` undefined | Balances is nested: `balances.gateway.formattedAvailable` | Use nested path | `index.ts` fixes |
| `@x402/evm/exact/server` module not found | Missing peer dependency `@x402/evm` | Install `@x402/core` + `@x402/evm` as peer deps | Dashboard build fix |
| Dashboard SSR fails "supabaseUrl is required" | No `NEXT_PUBLIC_SUPABASE_URL` at build time | Expected — only fails in CI without env vars | Not a bug |

---

## 14. Hackathon Timeline

| Day | Date | Focus | Key Deliverable |
|-----|------|-------|-----------------|
| 0 | April 20 | Foundation | Fork arc-nanopayments, Supabase, first x402 payment on explorer |
| 1 | April 21 | Agents + Payments | 4 agents running, orchestrator pays all, 12 txns visible |
| 2 | April 22 | Contracts + Reputation | Vyper contracts deployed, escrow flow, ERC-8004 identity |
| 3 | April 23 | Polish + Scale | 60+ txns, dashboard polish, economic proof |
| 4 | April 24 | Demo + Submission | Video recorded, submission posted, Product Feedback written |
| 5 | April 25 | Buffer | Judge questions, emergency fixes only |

---

## 15. Emergency Procedures

### If `gateway.pay()` returns no transaction hash

→ Check Gateway API status: https://status.circle.com
→ Try smaller amount: `$0.001` instead of `$0.005`
→ Check wallet has USDC: `client.getBalances()`
→ If balances show zero but you deposited, wait 30s for settlement
→ Pivot: add more contract calls (escrow lifecycle) to hit 50+ txns

### If Python agent won't start

→ Check circlekit installed: `python -c "import circlekit"`
→ If ImportError: agent runs in passthrough mode (no payment verification)
→ Still functional for demo — orchestrator gets responses without payments
→ Fix later: `pip install circlekit`

### If Vyper contract deployment fails

→ Smart contracts are P1 (nice-to-have), not P0 (required for demo)
→ Skip contract deployment, focus on x402 payment flow
→ Use mock contract interactions in orchestrator (`src/contracts.ts`)
→ Submit with mock contracts, note in submission that on-chain deployment is pending

### If demo fails live

→ Have a pre-recorded backup video ready (record Day 4 morning)
→ Have screenshots of 60+ transactions ready in `/docs/evidence/`
→ Dashboard screenshot, arcscan screenshots, terminal output logs
→ Never depend on live infrastructure for a demo

---

*Last updated: 2026-04-16 (scaffolding session)*
*Next review: 2026-04-20 (Day 0 start)*
