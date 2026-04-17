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
