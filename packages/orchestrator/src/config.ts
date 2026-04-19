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
    process.env.ARC_EXPLORER || "https://testnet.arcscan.io/tx/",
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
// Feature Flags
// ============================================================

export const FEATURES = {
  useParallel: process.env.USE_PARALLEL !== "false", // default true
  useRealLLM: process.env.USE_REAL_LLM === "true",   // default false
  useLLMDecomposer: process.env.USE_LLM_DECOMPOSER === "true", // default false
  // F1: Full escrow lifecycle (submitResult + dispute)
  useFullEscrow: process.env.USE_FULL_ESCROW !== "false", // default true
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
  useSlashing: process.env.USE_SLASHING !== "false", // default true
  // E3: Revenue streaming tick-based payments
  useRevenueStreaming: process.env.USE_REVENUE_STREAMING !== "false", // default true
  // A6: Agent staking portal
  useAgentStaking: process.env.USE_AGENT_STAKING !== "false", // default true
  // Q1: Task templates library
  useTaskTemplates: process.env.USE_TASK_TEMPLATES !== "false", // default true
  // Q3: Agent comparison view
  useAgentComparison: process.env.USE_AGENT_COMPARISON !== "false", // default true
  // ── P2 Features (Arc-Native Depth) ───────────────────────
  // A2: Wallet connect management
  useWalletConnect: process.env.USE_WALLET_CONNECT !== "false", // default true
  // E6: Batch auction settlement
  useBatchAuction: process.env.USE_BATCH_AUCTION !== "false", // default true
  // E4: Multi-token pricing
  useMultiToken: process.env.USE_MULTI_TOKEN !== "false", // default true
  // A4: Merkle proof verification
  useMerkleProofs: process.env.USE_MERKLE_PROOFS !== "false", // default true
  // A3: On-chain governance
  useGovernance: process.env.USE_GOVERNANCE !== "false", // default true
  // A5: Bridge status monitoring
  useBridgeStatus: process.env.USE_BRIDGE_STATUS !== "false", // default true
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

