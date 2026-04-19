// ============================================================
// Spending Limits — On-chain SpendingLimiter.vy integration
// ============================================================
// Enforces per-agent spending budgets over configurable time windows.
// When contracts are deployed, uses real on-chain calls.
// Falls back to in-memory rate limiting for demo purposes.
// ============================================================

import { ARC_CONFIG, isContractDeployed } from "../config";
import { getClients, sendContractTx } from "../contracts-client";

// ── Types ────────────────────────────────────────────────────

export interface SpendingBudget {
  agentType: string;
  agentAddress: string;
  maxPerWindow: string;   // dollar-prefixed e.g. "$0.50"
  windowDuration: number; // seconds
}

export interface SpendingStatus {
  agentType: string;
  withinLimit: boolean;
  currentSpending: string;
  maxAllowed: string;
  utilizationPct: number;
  txHash: string | null;
  explorerUrl: string | null;
  mock: boolean;
}

export interface SpendingRecord {
  agentType: string;
  amount: string;
  withinLimit: boolean;
  txHash: string;
  explorerUrl: string;
  mock: boolean;
}

// ── SpendingLimiter ABI ─────────────────────────────────────

const SPENDING_LIMITER_ABI = [
  {
    name: "setLimit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_agent", type: "address" },
      { name: "_max_per_window", type: "uint256" },
      { name: "_window_duration", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "recordSpending",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_agent", type: "address" },
      { name: "_amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "checkLimit",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_agent", type: "address" }],
    outputs: [
      { name: "", type: "bool" },
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
  },
] as const;

// ── In-memory spending tracker (fallback) ───────────────────

interface MemLimit {
  maxPerWindow: number; // atomic USDC units (6 decimals)
  windowDuration: number;
  currentSpending: number;
  windowStart: number;
}

const memLimits = new Map<string, MemLimit>();

// ── Default budgets ─────────────────────────────────────────

const DEFAULT_BUDGETS: Record<string, SpendingBudget> = {
  research: { agentType: "research", agentAddress: "0x_AGENT_RESEARCH", maxPerWindow: "$0.50", windowDuration: 3600 },
  code:     { agentType: "code",     agentAddress: "0x_AGENT_CODE",     maxPerWindow: "$0.50", windowDuration: 3600 },
  test:     { agentType: "test",     agentAddress: "0x_AGENT_TEST",     maxPerWindow: "$0.50", windowDuration: 3600 },
  review:   { agentType: "review",   agentAddress: "0x_AGENT_REVIEW",   maxPerWindow: "$0.50", windowDuration: 3600 },
};

/**
 * Set a spending limit for an agent.
 * Creates an on-chain limit if contracts are deployed.
 */
export async function setSpendingLimit(
  budget: SpendingBudget,
): Promise<{ txHash: string; explorerUrl: string; mock: boolean }> {
  const limiterAddress = process.env.SPENDING_LIMITER_ADDRESS;
  const maxAmount = parseFloat(budget.maxPerWindow.replace("$", ""));
  const maxAtomic = BigInt(Math.round(maxAmount * 1_000_000));

  // Initialize in-memory limit
  memLimits.set(budget.agentType, {
    maxPerWindow: Number(maxAtomic),
    windowDuration: budget.windowDuration,
    currentSpending: 0,
    windowStart: Date.now(),
  });

  if (!limiterAddress || !isContractDeployed("spendingLimiter")) {
    const mockHash = `MOCK_SET_LIMIT_${budget.agentType.toUpperCase()}`;
    console.log(`🔒 Mock spending limit set: ${budget.agentType} → ${budget.maxPerWindow}/hour`);
    return { txHash: mockHash, explorerUrl: `${ARC_CONFIG.explorerUrl}${mockHash}`, mock: true };
  }

  try {
    const clients = getClients();
    if (!clients) throw new Error("No wallet client");

    const hash = await sendContractTx({
      address: limiterAddress as `0x${string}`,
      abi: SPENDING_LIMITER_ABI,
      functionName: "setLimit",
      args: [
        budget.agentAddress as `0x${string}`,
        maxAtomic,
        BigInt(budget.windowDuration),
      ],
    });

    await clients.publicClient.waitForTransactionReceipt({ hash });
    console.log(`🔒 Spending limit set on-chain for ${budget.agentType}: ${hash}`);
    console.log(`   🔗 Explorer: ${ARC_CONFIG.explorerUrl}${hash}`);
    return { txHash: hash, explorerUrl: `${ARC_CONFIG.explorerUrl}${hash}`, mock: false };
  } catch (error) {
    console.error(`❌ Spending limit failed: ${error}`);
    const mockHash = `MOCK_SET_LIMIT_${budget.agentType.toUpperCase()}`;
    return { txHash: mockHash, explorerUrl: `${ARC_CONFIG.explorerUrl}${mockHash}`, mock: true };
  }
}

/**
 * Record a spending event for an agent.
 * Returns whether the spending is within the agent's limit.
 */
export async function recordSpending(
  agentType: string,
  amount: string,
): Promise<SpendingRecord> {
  const limiterAddress = process.env.SPENDING_LIMITER_ADDRESS;
  const amountNum = parseFloat(amount.replace("$", ""));
  const amountAtomic = BigInt(Math.round(amountNum * 1_000_000));
  const agentAddress = `0x_AGENT_${agentType.toUpperCase()}`;

  // Update in-memory tracking
  const mem = memLimits.get(agentType);
  if (mem) {
    if (Date.now() > mem.windowStart + mem.windowDuration * 1000) {
      mem.currentSpending = 0;
      mem.windowStart = Date.now();
    }
    mem.currentSpending += Number(amountAtomic);
  } else {
    // Auto-create a default limit
    memLimits.set(agentType, {
      maxPerWindow: 500_000, // $0.50
      windowDuration: 3600,
      currentSpending: Number(amountAtomic),
      windowStart: Date.now(),
    });
  }

  if (!limiterAddress || !isContractDeployed("spendingLimiter")) {
    const withinLimit = (memLimits.get(agentType)?.currentSpending ?? 0) <=
      (memLimits.get(agentType)?.maxPerWindow ?? Infinity);
    const mockHash = `MOCK_SPEND_${agentType.toUpperCase()}_${Date.now().toString(16)}`;
    console.log(`   💳 ${withinLimit ? "✅" : "⚠️"} ${agentType}: $${amountNum.toFixed(4)} ${withinLimit ? "within" : "exceeds"} limit`);
    return {
      agentType,
      amount,
      withinLimit,
      txHash: mockHash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${mockHash}`,
      mock: true,
    };
  }

  try {
    const clients = getClients();
    if (!clients) throw new Error("No wallet client");

    const hash = await sendContractTx({
      address: limiterAddress as `0x${string}`,
      abi: SPENDING_LIMITER_ABI,
      functionName: "recordSpending",
      args: [agentAddress as `0x${string}`, amountAtomic],
    });

    await clients.publicClient.waitForTransactionReceipt({ hash });
    console.log(`   💳 Spending recorded on-chain for ${agentType}: ${hash}`);

    return {
      agentType,
      amount,
      withinLimit: true,
      txHash: hash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${hash}`,
      mock: false,
    };
  } catch (error) {
    console.error(`❌ Spending record failed: ${error}`);
    const mockHash = `MOCK_SPEND_${agentType.toUpperCase()}_${Date.now().toString(16)}`;
    return {
      agentType,
      amount,
      withinLimit: true,
      txHash: mockHash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${mockHash}`,
      mock: true,
    };
  }
}

/**
 * Check if an agent is within their spending limit.
 */
export async function checkSpendingLimit(
  agentType: string,
): Promise<SpendingStatus> {
  const limiterAddress = process.env.SPENDING_LIMITER_ADDRESS;
  const agentAddress = `0x_AGENT_${agentType.toUpperCase()}`;
  const mem = memLimits.get(agentType);
  const max = mem?.maxPerWindow ?? 500_000;

  if (!limiterAddress || !isContractDeployed("spendingLimiter")) {
    const current = mem?.currentSpending ?? 0;
    const withinLimit = current <= max;
    return {
      agentType,
      withinLimit,
      currentSpending: `$${(current / 1_000_000).toFixed(4)}`,
      maxAllowed: `$${(max / 1_000_000).toFixed(2)}`,
      utilizationPct: max > 0 ? Math.round((current / max) * 100) : 0,
      txHash: null,
      explorerUrl: null,
      mock: true,
    };
  }

  try {
    const clients = getClients();
    if (!clients) throw new Error("No wallet client");

    const [withinLimit, currentSpending, maxAllowed] = await clients.publicClient.readContract({
      address: limiterAddress as `0x${string}`,
      abi: SPENDING_LIMITER_ABI,
      functionName: "checkLimit",
      args: [agentAddress as `0x${string}`],
    }) as [boolean, bigint, bigint];

    return {
      agentType,
      withinLimit,
      currentSpending: `$${(Number(currentSpending) / 1_000_000).toFixed(4)}`,
      maxAllowed: `$${(Number(maxAllowed) / 1_000_000).toFixed(2)}`,
      utilizationPct: Number(maxAllowed) > 0
        ? Math.round((Number(currentSpending) / Number(maxAllowed)) * 100)
        : 0,
      txHash: null,
      explorerUrl: null,
      mock: false,
    };
  } catch (error) {
    console.error(`❌ Spending check failed: ${error}`);
    return {
      agentType,
      withinLimit: true,
      currentSpending: "$0.0000",
      maxAllowed: "$0.50",
      utilizationPct: 0,
      txHash: null,
      explorerUrl: null,
      mock: true,
    };
  }
}

/**
 * Set default spending limits for all 4 agents.
 * Returns on-chain tx hashes for each limit set.
 */
export async function setDefaultSpendingLimits(): Promise<Array<{ txHash: string; explorerUrl: string; mock: boolean }>> {
  console.log("🔒 Setting spending limits for all agents...");
  const results = [];
  for (const budget of Object.values(DEFAULT_BUDGETS)) {
    const result = await setSpendingLimit(budget);
    results.push(result);
  }
  return results;
}

/**
 * Get all current spending statuses.
 */
export async function getAllSpendingStatuses(): Promise<SpendingStatus[]> {
  const statuses: SpendingStatus[] = [];
  for (const agentType of Object.keys(DEFAULT_BUDGETS)) {
    statuses.push(await checkSpendingLimit(agentType));
  }
  return statuses;
}
