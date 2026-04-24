# Circle Product Feedback — AgentWork Demo

## Overview
During the development of **AgentWork**, an AI agent marketplace on Arc L1, we heavily utilized the `@circle-fin/x402-batching` SDK and the Arc Testnet. The ability to execute sub-cent nanopayments is a game-changer for agentic economies. Below is our technical feedback and suggestions for the Circle product team.

## 1. SDK Integration Experience

### The Good
- **x402 Protocol**: The mental model of "batching authorizations" is excellent. It decouples the buyer's intent from the network's settlement, allowing for high-frequency interactions without gas bottlenecking.
- **Support for Arc**: Native USDC as gas on Arc simplified our wallet management significantly.

### Pain Points
- **API Surface Drift**: We noticed discrepancies between documentation and the actual npm package types (e.g., `transaction` vs `transactionHash`). Standardizing these across the `client` and `server` packages would improve developer velocity.
- **Dependency Hell**: The peer dependency requirements for `viem`, `@x402/core`, and `@x402/evm` can be tricky to resolve in monorepo setups. A single "Circle SDK" wrapper would be preferable.

## 2. Technical Suggestions for Improvement

### S1: Direct Batching in `GatewayClient`
**Current**: We call `gateway.pay()` in a loop or `Promise.all`.
**Suggested**: Provide a `gateway.payBatch(requests: PayRequest[])` method.
**Why**: This would allow the SDK to optimize the EIP-712 signing process, potentially signing a single "bundle" of authorizations, further reducing the computational overhead on the client side.

### S2: Native "Micro-Drip" Payment Streams
**Current**: We implemented a custom `tickStream` logic using `setInterval`.
**Suggested**: A native `gateway.startStream({ targetUrl, ratePerSecond })` abstraction.
**Why**: AI agents often provide continuous services (like real-time research or code generation). A native streaming primitive would allow the Gateway to handle the ticking and opportunistic batching of these micro-payments transparently.

### S3: Unified Cross-Chain Interface
**Current**: We use `@circle-fin/x402-batching` for payments and `@circle-fin/bridge-kit` for withdrawals.
**Suggested**: Integrate Bridge Kit capabilities directly into the GatewayClient.
**Why**: The end-user (or agent) shouldn't care which SDK handles the "exit." A simple `client.withdraw({ amount, targetChain: "base" })` would be the ultimate developer experience.

### S4: Webhook / Real-Time Event Support
**Current**: We poll Supabase to update the dashboard.
**Suggested**: A "Gateway Event Stream" (WebSocket or Webhook) that pushes settlement notifications.
**Why**: To build truly reactive AI dashboards, we need real-time confirmation that a payment has transitioned from "authorized" to "settled" on-chain.

## 3. Arc Testnet Observations
- **Explorer Latency**: `arcscan.io` sometimes takes 10-15 seconds to index transactions after they are returned by the RPC.
- **Faucet Limits**: For high-density demos (60+ txns), the faucet limit of 10 USDC can be restrictive. A "Developer Mode" faucet for verified projects would be helpful.

---
*Submitted by the AgentWork Team — LabLab.ai Hackathon, April 2026*
