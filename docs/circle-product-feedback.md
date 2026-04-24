# AgentWork — Circle Product Feedback ($500 Bonus)

> Submitted for the Circle Product Feedback Prize at "Agentic Economy on Arc" hackathon.
> This document captures real pain points encountered while building with Circle's x402-batching SDK.

> **TL;DR**: The x402 protocol is genuine innovation — gasless EIP-3009 transfers via Gateway batching solve a real problem. The SDK needs DX polish: consistent naming, documented peer deps, and flatter response types.

---

## Summary

AgentWork is an AI agent marketplace that uses nanopayments on Arc L1 to enable economically viable multi-agent workflows. We built against `@circle-fin/x402-batching@2.1.0` for payment orchestration and `circlekit` (Python) for agent-side payment verification.

**Overall**: The SDK works as advertised — EIP-3009 gasless transfers via the Circle Gateway are a genuine innovation. However, the developer experience has several sharp edges that cost significant debugging time during a time-constrained hackathon.

---

## Pain Point 1: Asymmetric Configuration Between Buyer and Seller SDKs

### What We Expected
```typescript
// Expected: consistent config shape across buyer and seller
const config = { chain: "arcTestnet", privateKey: "0x...", rpcUrl: "..." };
```

### What We Found
The buyer-side `GatewayClient` requires `chain` and `privateKey`, while the seller-side `BatchFacilitatorClient` takes **only** `url` and `createAuthHeaders`. These are completely different shapes with no shared base type.

**Impact**: We initially passed `chain` + `privateKey` to `BatchFacilitatorClient`, which silently accepted them and then failed at runtime. TypeScript didn't catch this because the extra properties weren't flagged as errors.

**Suggestion**: 
1. Provide a shared `ClientConfig` base type
2. Or add explicit JSDoc warnings that seller-side clients don't need chain/privateKey
3. Consider runtime validation that rejects unknown properties

```typescript
// Proposed: shared base type with clear separation
interface BaseClientConfig {
  url?: string;  // Gateway API URL, defaults to testnet
}

interface BuyerConfig extends BaseClientConfig {
  chain: SupportedChainName;  // required for buyer
  privateKey: Hex;            // required for buyer
  rpcUrl?: string;
}

interface SellerConfig extends BaseClientConfig {
  createAuthHeaders?: () => Promise<AuthHeaders>;
  // TypeScript error if chain/privateKey are passed
}
```: Inconsistent Transaction Hash Field Names

### What We Found
```typescript
// DepositResult
result.depositTxHash   // ← "depositTxHash"

// PayResult  
result.transaction     // ← "transaction" (NOT "transactionHash")
```

Two result types, two different naming conventions for essentially the same concept (a transaction hash).

**Impact**: We wrote `result.transactionHash` based on the deposit result pattern and got `undefined`. This took ~30 minutes to debug because the field silently returned `undefined` instead of throwing.

**Suggestion**: Standardize on a single field name across all result types:
- `txHash` or `transactionHash` — consistent across `DepositResult`, `PayResult`, `WithdrawResult`

```typescript
// Current: different field names for the same concept
const deposit = await client.deposit("1");
console.log(deposit.depositTxHash);   // "depositTxHash"

const payment = await client.pay(url);
console.log(payment.transaction);      // "transaction"

// Proposed: consistent naming
const deposit = await client.deposit("1");
console.log(deposit.txHash);           // same field name

const payment = await client.pay(url);
console.log(payment.txHash);           // same field name
```: Deeply Nested Balance Response

### What We Expected
```typescript
balances.available  // ← flat, intuitive
```

### What We Found
```typescript
balances.gateway.formattedAvailable  // ← deeply nested, non-obvious
balances.wallet.balance              // ← wallet balance is separate
```

**Impact**: `balances.available` returned `undefined`, and we had to inspect the raw response object to discover the actual structure.

**Suggestion**: 
1. Add a top-level `available` convenience accessor
2. Or document the response shape more prominently with TypeScript types that make the nesting obvious at compile time

```typescript
// Current: must know the exact nesting path
const bal = await client.getBalances();
console.log(bal.gateway.formattedAvailable);  // non-obvious

// Proposed: convenience accessor at top level
const bal = await client.getBalances();
console.log(bal.available);  // delegates to gateway.formattedAvailable
console.log(bal.total);      // delegates to gateway.total
console.log(bal.wallet);     // wallet balance still accessible
```: Missing Peer Dependencies Not Documented

### What We Found
`@circle-fin/x402-batching` requires `@x402/core` and `@x402/evm` as peer dependencies, but:
- These aren't auto-installed
- The import paths reference `@x402/evm/exact/server` which doesn't exist without the peer dep
- The error message is "Module not found" — no indication that a peer dep is missing

**Impact**: ~45 minutes of debugging `Module not found` errors before discovering the missing peer dependencies.

**Suggestion**:
1. List peer dependencies prominently in README (not just in `package.json`)
2. Add a post-install check that warns about missing peers
3. Consider bundling the peer deps or making them direct dependencies

```typescript
// Proposed: post-install warning
// When running `npm install @circle-fin/x402-batching`:
// ⚠️  Missing peer dependencies detected:
//   - @x402/core@^2.3.0 (required)
//   - @x402/evm@^2.3.0 (required)
//   Install with: npm install @x402/core @x402/evm

// Or bundle them and eliminate the issue entirely:
import { GatewayClient } from "@circle-fin/x402-batching";
// All sub-dependencies resolved — no manual peer dep installation
```: Chain Name String Must Be Exact

### What We Found
```typescript
chain: "arcTestnet"   // ← ONLY valid value
// NOT "arc", "arc-testnet", "ARC_TESTNET", or 5042002
```

There's a `SupportedChainName` type, but the valid values aren't documented in the README. We had to inspect the package source to find `"arcTestnet"`.

**Impact**: Minor — we found it quickly, but others might try the chain ID number or variations.

**Suggestion**: Document all valid `SupportedChainName` values in the README or in the type's JSDoc.

```typescript
// Proposed: JSDoc with all valid values
/**
 * Supported chain names for GatewayClient.
 * - "arcTestnet" — Arc Testnet (chain ID 5042002)
 * - "baseSepolia" — Base Sepolia (chain ID 84532)
 * - "ethereumSepolia" — Ethereum Sepolia (chain ID 11155111)
 */
type SupportedChainName = "arcTestnet" | "baseSepolia" | "ethereumSepolia";

// Even better: runtime validation with helpful error
new GatewayClient({ chain: "arc" });
// Error: Invalid chain "arc". Did you mean "arcTestnet"?
//        Supported values: arcTestnet, baseSepolia, ethereumSepolia
```

---

## What Worked Well

Despite the friction above, several things genuinely impressed us:

1. **EIP-3009 gasless transfers** — The concept of signing off-chain authorizations and having the Gateway batch-settle them is elegant and works reliably
2. **Dollar-denominated amounts** — Using `"$0.005"` strings instead of raw BigInt arithmetic (`5000n`) is a thoughtful DX choice that eliminates an entire class of decimal-conversion bugs
3. **Gateway API reliability** — Zero downtime during our development window
4. **Arc testnet faucet** — Instant, generous USDC funding at `faucet.circle.com`
5. **Fast settlement** — Payments appear on-chain in under 5 seconds, even during batching
6. **TypeScript types shipped in-package** — The SDK includes proper TypeScript types (not a separate `@types` package), enabling autocompletion and compile-time safety out of the box

---

## Verdict

The x402 protocol and Circle Gateway are solving a real problem — nanopayments for AI agents. The core technology works. The rough edges are primarily in developer experience: inconsistent naming, undocumented peer deps, and asymmetric config shapes. Fixing these would dramatically reduce time-to-first-payment for new developers.

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Core Technology** | 9/10 | EIP-3009 + Gateway batching is genuinely innovative — gasless, sub-second, reliable |
| **Developer Experience** | 6/10 | Inconsistent naming, undocumented peer deps, silent failures on misconfiguration |
| **Overall** | **7.5/10** | Solid foundation with a clear path to 9/10 — the fixes are mostly naming + docs |

**The path to 9/10**: Standardize result type field names (`txHash` everywhere), add top-level balance accessors, document peer dependencies in the README, and ship runtime config validation. None of these require architectural changes — they're DX polish that would dramatically reduce time-to-first-payment.

---

## Feature Requests for Future SDK Versions

### 1. Balance Change WebSocket/Subscription

```typescript
client.onBalanceChange((newBalance) => {
  dashboard.updateGatewayBalance(newBalance.formattedAvailable);
});
```

Our dashboard polls `/api/gateway-balance` every 5 seconds. A real-time subscription would make the "live" experience much more compelling and reduce unnecessary API calls.

### 2. Payment Status API

```typescript
client.getPaymentStatus(txHash: string): Promise<{
  status: "authorized" | "batched" | "settled" | "failed";
  blockNumber?: number;
  settledAt?: Date;
}>
```

Currently, after calling `client.pay()`, we get a `transaction` hash but have no way to check if it has been finalized on-chain. For our dashboard, we'd like to show a "settling..." state that flips to "confirmed" once the Gateway's batch is on-chain.

### 3. Batch Payment Method

For our orchestrator, we pay 4–12 agents per task. A batch method would reduce round trips:

```typescript
const results = await client.payBatch([
  { url: "http://agent:4021/api/research", amount: "$0.005" },
  { url: "http://agent:4022/api/code", amount: "$0.005" },
  { url: "http://agent:4023/api/test", amount: "$0.005" },
  { url: "http://agent:4024/api/review", amount: "$0.005" },
]);
// results: PayResult[] — all payments settled in a single batch
```

### 4. Event Webhook / Settlement Callback

After the Gateway settles a batch of EIP-3009 authorizations on-chain, POST to a configurable webhook URL with settlement details. This would enable server-side dashboards to update in real time without polling.

```typescript
// Proposed: webhook configuration on GatewayClient
const client = new GatewayClient({
  chain: "arcTestnet",
  privateKey: "0x..." as Hex,
  webhook: {
    url: "https://dashboard.agentwork.dev/api/webhook/settlement",
    secret: "whsec_...",   // HMAC verification
    events: ["payment.settled", "deposit.confirmed", "withdrawal.completed"],
  },
});

// Webhook payload received at the configured URL:
// POST https://dashboard.agentwork.dev/api/webhook/settlement
// {
//   event: "payment.settled",
//   txHash: "0xabc...",
//   amount: "$0.005",
//   payTo: "0xA4F6...",
//   settledAt: "2026-04-21T10:30:00Z",
//   batchId: "batch_abc123",
//   batchSize: 4
// }
```

Our dashboard currently polls `/api/gateway-balance` every 5 seconds. A webhook would eliminate polling entirely and provide instant UI updates — critical for live demo experiences.

### 5. CLI Tool for Quick Testing

A `circle-gateway` CLI would accelerate development:

```bash
circle-gateway deposit --amount 1 --chain arcTestnet
circle-gateway pay --url http://localhost:4021/api/health --amount $0.005
circle-gateway balance --chain arcTestnet
```

This would let teams validate their setup without writing code first.

### 6. Built-in Retry Support

Rather than every consumer implementing their own retry logic, offer it as a constructor option:

```typescript
const client = new GatewayClient({
  chain: "arcTestnet",
  privateKey: "0x..." as Hex,
  retry: { maxAttempts: 3, backoffMs: 1000 },
});
```

We implemented our own exponential backoff with `MAX_RETRIES=3` and `BASE_BACKOFF_MS=2000`. Having this built into the SDK would save every team from reinventing it.

---

## Scale Testing Observations

During our hackathon development, we executed:

- **60+ on-chain transactions** per demo session
- **4 specialist agents** paid sequentially per task
- **$0.005 per agent call** (sub-cent nanopayment)
- **~5 second settlement** via Circle Gateway
- **Zero failed payments** due to Gateway issues (failures were our own bugs)

The Gateway handled our load without issues. We never hit rate limits from the Gateway itself. The main bottleneck was our own agent response time, not the payment infrastructure.

### Cost Breakdown (60 transactions)

| Method | Cost | Settlement Time |
|--------|------|-----------------|
| **Arc + Circle Gateway** | **$0.30** | **<5 min** |
| L2 (Arbitrum) | $6.00 | ~5 min |
| Stripe | $18.00 | 1–3 days |

Arc + Circle is **60x cheaper than Stripe** and **20x cheaper than L2** for high-frequency microtransactions. This is the exact use case where nanopayments shine.

---

## SDK Architecture Suggestions

### Suggestion A: Shared Result Type Interface

The three core result types (`DepositResult`, `PayResult`, `WithdrawResult`) should extend a common base interface. This eliminates the "which field name do I use?" problem once and for all.

```typescript
// Current: different shapes per type
DepositResult { depositTxHash, amount }
PayResult { transaction, amount, data }
WithdrawResult { withdrawTxHash?, amount }

// Proposed: unified base interface
interface TransactionResult {
  txHash: string;          // always present, always the same name
  amount: bigint;          // always bigint
  formattedAmount: string; // always human-readable
  explorerUrl?: string;    // convenience link to block explorer
  status: "pending" | "settled";
}

interface DepositResult extends TransactionResult {
  // deposit-specific fields if any
}

interface PayResult extends TransactionResult {
  data: unknown;           // response data from paid endpoint
}

interface WithdrawResult extends TransactionResult {
  recipient: string;
}
```

**Impact**: Developers write `result.txHash` once and it works everywhere. No more `depositTxHash` vs `transaction` confusion.

### Suggestion B: Unified Balance Accessor

The `Balances` response type currently requires knowledge of internal Gateway structure (`balances.gateway.formattedAvailable`). A top-level convenience property would make the common case trivial.

```typescript
// Current: must know the nesting
const balances = await client.getBalances();
const available = balances.gateway.formattedAvailable;
const total = balances.gateway.total;

// Proposed: top-level accessors that delegate internally
const balances = await client.getBalances();

// Simple case (covers 90% of usage)
console.log(balances.available);  // → "$0.85" (formatted)
console.log(balances.total);      // → "$1.00" (formatted)
console.log(balances.wallet);     // → "$0.15" (formatted)

// Advanced case (when you need full detail)
console.log(balances.gateway.raw);      // → raw gateway response
console.log(balances.gateway.available); // → bigint (atomic units)
```

**Impact**: The most common operation — "show me my available balance" — goes from `balances.gateway.formattedAvailable` to `balances.available`. Three keystrokes instead of 36.

### Suggestion C: Configuration Validation

```typescript
// Currently fails silently or with obscure errors
new GatewayClient({ chain: "invalid", ... })

// Would prefer immediate, clear error:
// Error: Invalid chain "invalid". Supported values: "arcTestnet", "baseSepolia", ...
```

---

## Summary Rating

| Category | Rating | Notes |
|----------|--------|-------|
| Ease of Setup | ⭐⭐⭐⭐ | Good once you know the quirks |
| Documentation | ⭐⭐⭐ | Exists but lacks examples for edge cases |
| API Design | ⭐⭐⭐⭐ | Core `pay()` is excellent, field naming inconsistent |
| Reliability | ⭐⭐⭐⭐⭐ | Zero Gateway-caused failures |
| Cost Efficiency | ⭐⭐⭐⭐⭐ | 60x cheaper than Stripe for microtransactions |
| Python SDK | ⭐⭐⭐⭐ | Good parity, graceful fallback when unavailable |

**Bottom line**: The Circle Gateway + x402 protocol is the real deal for nanopayments. The core `pay()` API is the best we've used for agent-to-agent payments. With some DX polish (consistent field names, structured errors, balance subscriptions), it would be nearly perfect.

---

*This feedback is submitted as part of the Agentic Economy on Arc hackathon and is eligible for the $500 Circle Product Feedback bonus.*
