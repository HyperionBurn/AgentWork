// ============================================================
// Arc Testnet Constants
// ============================================================

export const ARC_CONFIG = {
  chainId: 5042002,
  rpcUrl: process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network",
  usdcAddress:
    process.env.ARC_USDC_ADDRESS ||
    "0x3600000000000000000000000000000000000000",
  gatewayAddress:
    process.env.ARC_GATEWAY_ADDRESS ||
    "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
  explorerUrl:
    process.env.ARC_EXPLORER || "https://testnet.arcscan.app/tx/",
  faucetUrl: "https://faucet.circle.com",
} as const;

// ============================================================
// Agent Registry — URL and pricing for each specialist agent
// ============================================================

export interface AgentEndpoint {
  type: string;
  baseUrl: string;
  apiPath: string;
  price: string;
  label: string;
}

// ============================================================
// Contract Addresses (from .env — filled after deployment)
// ============================================================

// Lazy getter: reads process.env at ACCESS time, not import time.
// This ensures dotenv has loaded before addresses are evaluated.
function makeContractAddresses() {
  return {
    identityRegistry: process.env.IDENTITY_REGISTRY_ADDRESS || "",
    reputationRegistry: process.env.REPUTATION_REGISTRY_ADDRESS || "",
    agentEscrow: process.env.AGENT_ESCROW_ADDRESS || "",
    paymentSplitter: process.env.PAYMENT_SPLITTER_ADDRESS || "",
    spendingLimiter: process.env.SPENDING_LIMITER_ADDRESS || "",
  };
}

export type ContractName = keyof ReturnType<typeof makeContractAddresses>;

// Use a Proxy so that CONTRACT_ADDRESSES looks like a plain object
// but reads process.env lazily on every property access.
export const CONTRACT_ADDRESSES: Record<ContractName, string> = new Proxy(
  {} as Record<ContractName, string>,
  {
    get(_, prop: string) {
      return (makeContractAddresses() as Record<string, string>)[prop] ?? "";
    },
    ownKeys() {
      return Object.keys(makeContractAddresses());
    },
    has(_, prop: string) {
      return prop in makeContractAddresses();
    },
    getOwnPropertyDescriptor(_, prop: string) {
      const obj = makeContractAddresses() as Record<string, string>;
      if (prop in obj) {
        return { configurable: true, enumerable: true, value: obj[prop] };
      }
      return undefined;
    },
  }
);

export function isContractDeployed(
  contract: ContractName
): boolean {
  const addr = CONTRACT_ADDRESSES[contract];
  return !!addr && addr.startsWith("0x") && addr.length === 42;
}

// ============================================================
// Agent Wallet Addresses (from .env — one per specialist agent)
// ============================================================

const AGENT_WALLET_ENV_VARS: Record<string, string> = {
  research: "RESEARCH_AGENT_WALLET",
  code: "CODE_AGENT_WALLET",
  test: "TEST_AGENT_WALLET",
  review: "REVIEW_AGENT_WALLET",
};

/**
 * Get the real Arc Testnet wallet address for an agent type.
 * Reads from env vars at call time (lazy, dotenv-safe).
 * Returns the typed `0x${string}` for viem compatibility.
 * Throws if the env var is missing or malformed — fail loudly
 * so we never silently pass a placeholder to a contract.
 */
export function getAgentAddress(type: string): `0x${string}` {
  const envVar = AGENT_WALLET_ENV_VARS[type.toLowerCase()];
  if (!envVar) {
    throw new Error(`Unknown agent type: "${type}"`);
  }
  const addr = process.env[envVar] || "";
  if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
    throw new Error(
      `Agent wallet not configured: set ${envVar} in .env (got "${addr}")`,
    );
  }
  return addr as `0x${string}`;
}

/**
 * Check whether agent wallet addresses are configured in env vars.
 * Used to gate on-chain contract interactions vs mock fallback.
 */
export function hasAgentWallets(): boolean {
  for (const envVar of Object.values(AGENT_WALLET_ENV_VARS)) {
    const addr = process.env[envVar] || "";
    if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
      return false;
    }
  }
  return true;
}

// ============================================================
// Feature Flags
// ============================================================

export const FEATURES = {
  useParallel: process.env.USE_PARALLEL !== "false", // default true
  useRealLLM: process.env.USE_REAL_LLM === "true",   // default false
  useLLMDecomposer: process.env.USE_LLM_DECOMPOSER === "true", // default false
  // F1: Full escrow lifecycle (submitResult + dispute)
  // Disabled by default — agents have no private keys, so claim/submit/approve revert on-chain
  useFullEscrow: process.env.USE_FULL_ESCROW === "true", // default false
  // F2: PaymentSplitter on-chain revenue sharing
  usePaymentSplitter: process.env.USE_PAYMENT_SPLITTER !== "false", // default true
  // F3: Agent-to-Agent recursive nanopayment chains
  useA2AChaining: process.env.USE_A2A_CHAINING !== "false", // default true
  // F4: SpendingLimiter per-agent budget enforcement
  useSpendingLimits: process.env.USE_SPENDING_LIMITS !== "false", // default true
  // F5: Marketplace with competitive bidding + reputation routing
  useMarketplace: process.env.USE_MARKETPLACE !== "false", // default true
  // F6: Dynamic pricing based on complexity + demand
  useDynamicPricing: process.env.USE_DYNAMIC_PRICING !== "false", // default true

  // ── P0 Features (Core Demo Value) ────────────────────────
  // Q4: Smart retry with circuit breaker and agent fallback
  useSmartRetry: process.env.USE_SMART_RETRY !== "false", // default true
  // Q5: Pre-flight cost estimation before committing funds
  useCostEstimator: process.env.USE_COST_ESTIMATOR !== "false", // default true
  // E2: Auto-refund for failed/disputed tasks
  useAutoRefund: process.env.USE_AUTO_REFUND !== "false", // default true
  // A1: Gas cost comparison dashboard
  useGasDashboard: process.env.USE_GAS_DASHBOARD !== "false", // default true
  // Q2: Enhanced real-time SSE stream
  useEnhancedStream: process.env.USE_ENHANCED_STREAM !== "false", // default true
  // Q6: Export/share session evidence
  useExportSession: process.env.USE_EXPORT_SESSION !== "false", // default true

  // ── P1 Features (Economy Depth) ─────────────────────────
  // E1: Subscription tiers for tiered pricing
  useSubscriptionTiers: process.env.USE_SUBSCRIPTION_TIERS !== "false", // default true
  // E5: Slashing & insurance fund for agent accountability
  // Disabled — no on-chain contract, always generates MOCK_0x hashes
  useSlashing: process.env.USE_SLASHING === "true", // default false
  // E3: Revenue streaming tick-based payments
  // Enabled — uses real gateway.pay() per tick for streaming nanopayments
  useRevenueStreaming: process.env.USE_REVENUE_STREAMING !== "false", // default true
  // A6: Agent staking portal
  // Disabled — no on-chain contract, always generates MOCK_0x hashes
  useAgentStaking: process.env.USE_AGENT_STAKING === "true", // default false
  // Q1: Task templates library
  useTaskTemplates: process.env.USE_TASK_TEMPLATES !== "false", // default true
  // Q3: Agent comparison view
  useAgentComparison: process.env.USE_AGENT_COMPARISON !== "false", // default true
  // ── P2 Features (Arc-Native Depth) ───────────────────────
  // A2: Wallet connect management
  useWalletConnect: process.env.USE_WALLET_CONNECT !== "false", // default true
  // E6: Batch auction settlement
  // Disabled — no on-chain contract, always generates MOCK_0x hashes
  useBatchAuction: process.env.USE_BATCH_AUCTION === "true", // default false
  // E4: Multi-token pricing
  // Disabled — USDT/EURC/WETH addresses are 0xMOCK_* placeholders
  useMultiToken: process.env.USE_MULTI_TOKEN === "true", // default false
  // A4: Merkle proof verification
  // Disabled — submitBatchProof() always returns MOCK_0x hash
  useMerkleProofs: process.env.USE_MERKLE_PROOFS === "true", // default false
  // A3: On-chain governance
  // Disabled — runMockGovernance() is explicitly all mock data
  useGovernance: process.env.USE_GOVERNANCE === "true", // default false
  // A5: Bridge status monitoring
  useBridgeStatus: process.env.USE_BRIDGE_STATUS !== "false", // default true
  // ⚡ Nanopayment stress test — fires 20 rapid gateway.pay() calls
  useStressTest: process.env.USE_STRESS_TEST !== "false", // default true

  // ── Game-Changing Features (GC1-GC5) ────────────────────
  // GC1: Gemini Function Calling for autonomous orchestrator decisions
  // Uses Gemini 3 Flash to decide routing, escrow, pricing, reputation
  useGeminiOrchestrator: process.env.USE_GEMINI_ORCHESTRATOR === "true", // default false
  // GC2: Token-aware streaming — track tokens per tick in revenue streaming
  useTokenStreaming: process.env.USE_TOKEN_STREAMING === "true", // default false
  // GC3: Agent Reasoning Feed — write reasoning to Supabase for dashboard
  useReasoningFeed: process.env.USE_REASONING_FEED !== "false", // default true
  // GC5: Live Economic Counter — 7-chain cost comparison on dashboard
  useLiveEconomicCounter: process.env.USE_LIVE_ECONOMIC_COUNTER !== "false", // default true

  // ── Game-Changing Features (GC6-GC11) ────────────────────
  // GC6: Interactive Payment Playground (judge-facing demo)
  usePlayground: process.env.USE_PLAYGROUND !== "false", // default true
  // GC7: Payment Receipt Engine with Merkle audit trail
  useReceipts: process.env.USE_RECEIPTS !== "false", // default true
  // GC8: Consumer Spending Dashboard with policy engine
  useConsumerSpending: process.env.USE_CONSUMER_SPENDING !== "false", // default true
  // GC9: Cross-Chain Withdrawal via Circle Bridge Kit
  useCrossChainWithdraw: process.env.USE_CROSS_CHAIN_WITHDRAW !== "false", // default true
  // GC10: Real-Time 3D Transaction Globe
  useTransactionGlobe: process.env.USE_TRANSACTION_GLOBE !== "false", // default true
  // GC11: On-Chain Agent SLA with automated enforcement
  useSLAEngine: process.env.USE_SLA_ENGINE !== "false", // default true
} as const;

export const AGENT_ENDPOINTS: AgentEndpoint[] = [
  {
    type: "research",
    baseUrl: process.env.RESEARCH_AGENT_URL || `http://localhost:${process.env.RESEARCH_AGENT_PORT || 4021}`,
    apiPath: "/api/research",
    price: process.env.RESEARCH_AGENT_PRICE || "$0.005",
    label: "Research Agent",
  },
  {
    type: "code",
    baseUrl: process.env.CODE_AGENT_URL || `http://localhost:${process.env.CODE_AGENT_PORT || 4022}`,
    apiPath: "/api/generate",
    price: process.env.CODE_AGENT_PRICE || "$0.005",
    label: "Code Agent",
  },
  {
    type: "test",
    baseUrl: process.env.TEST_AGENT_URL || `http://localhost:${process.env.TEST_AGENT_PORT || 4023}`,
    apiPath: "/api/test",
    price: process.env.TEST_AGENT_PRICE || "$0.005",
    label: "Test Agent",
  },
  {
    type: "review",
    baseUrl: process.env.REVIEW_AGENT_URL || `http://localhost:${process.env.REVIEW_AGENT_PORT || 4024}`,
    apiPath: "/api/review",
    price: process.env.REVIEW_AGENT_PRICE || "$0.005",
    label: "Review Agent",
  },
];

// ============================================================
// Subtask Types
// ============================================================

export interface Subtask {
  id: string;
  agentType: string;
  input: string;
  price: string;
  url: string;
  dependsOn: string[];
  context?: string;
}

export interface TaskDecomposition {
  taskId: string;
  description: string;
  subtasks: Subtask[];
  estimatedCost: string;
  estimatedTransactions: number;
}

// CONTRACT_ADDRESSES and isContractDeployed are defined above (pre-deployment section)

