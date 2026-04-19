# AgentWork — Circle Product Feedback ($500 Bonus)

> Submitted for the Circle Product Feedback Prize at "Agentic Economy on Arc" hackathon.
> This document captures real pain points encountered while building with Circle's x402-batching SDK.

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

---

## Pain Point 2: Inconsistent Transaction Hash Field Names

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

---

## Pain Point 3: Deeply Nested Balance Response

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

---

## Pain Point 4: Missing Peer Dependencies Not Documented

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

---

## Pain Point 5: Chain Name String Must Be Exact

### What We Found
```typescript
chain: "arcTestnet"   // ← ONLY valid value
// NOT "arc", "arc-testnet", "ARC_TESTNET", or 5042002
```

There's a `SupportedChainName` type, but the valid values aren't documented in the README. We had to inspect the package source to find `"arcTestnet"`.

**Impact**: Minor — we found it quickly, but others might try the chain ID number or variations.

**Suggestion**: Document all valid `SupportedChainName` values in the README or in the type's JSDoc.

---

## What Worked Well

Despite the friction above, several things genuinely impressed us:

1. **EIP-3009 gasless transfers** — The concept of signing off-chain authorizations and having the Gateway batch-settle them is elegant and works reliably
2. **Dollar-denominated amounts** — Using `"$0.005"` instead of raw BigInt is a great UX choice for developers
3. **Gateway API reliability** — Zero downtime during our development window
4. **Arc testnet faucet** — Instant, generous USDC funding at `faucet.circle.com`
5. **Fast settlement** — Payments appear on-chain in under 5 seconds, even during batching

---

## Verdict

The x402 protocol and Circle Gateway are solving a real problem — nanopayments for AI agents. The core technology works. The rough edges are primarily in developer experience: inconsistent naming, undocumented peer deps, and asymmetric config shapes. Fixing these would dramatically reduce time-to-first-payment for new developers.

**We'd rate the SDK 7/10** — solid foundation, needs DX polish.

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
```

### 4. CLI Tool for Quick Testing

A `circle-gateway` CLI would accelerate development:

```bash
circle-gateway deposit --amount 1 --chain arcTestnet
circle-gateway pay --url http://localhost:4021/api/health --amount $0.005
circle-gateway balance --chain arcTestnet
```

This would let teams validate their setup without writing code first.

### 5. Built-in Retry Support

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

### Result Type Unification

```typescript
// Current: different shapes per type
DepositResult { depositTxHash, amount }
PayResult { transaction, amount, data }
WithdrawResult { withdrawTxHash?, amount }

// Proposed: unified base interface
interface PaymentResult {
  txHash: string;          // always present, always same name
  amount: bigint;          // always bigint
  formattedAmount: string; // always human-readable
  explorerUrl?: string;    // convenience link
  status: "pending" | "settled";
}
```

### Configuration Validation

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
