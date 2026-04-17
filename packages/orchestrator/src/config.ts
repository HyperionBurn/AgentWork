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

// ============================================================
// Contract Deployment State (Feature Flags)
// ============================================================

export const CONTRACT_ADDRESSES = {
  identityRegistry: process.env.IDENTITY_REGISTRY_ADDRESS,
  reputationRegistry: process.env.REPUTATION_REGISTRY_ADDRESS,
  agentEscrow: process.env.AGENT_ESCROW_ADDRESS,
  paymentSplitter: process.env.PAYMENT_SPLITTER_ADDRESS,
  spendingLimiter: process.env.SPENDING_LIMITER_ADDRESS,
} as const;

export function isContractDeployed(
  contract: keyof typeof CONTRACT_ADDRESSES
): boolean {
  const addr = CONTRACT_ADDRESSES[contract];
  return !!addr && addr.startsWith("0x") && addr.length === 42;
}
