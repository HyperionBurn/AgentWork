// ============================================================
// Payment Splitter — On-chain PaymentSplitter.vy integration
// ============================================================
// Splits a single payment across multiple agent addresses
// according to configurable basis point allocations.
// When the contract is deployed, uses real on-chain calls.
// Falls back to simulated splits for demo purposes.
// ============================================================

import { ARC_CONFIG, isContractDeployed, getAgentAddress, hasAgentWallets } from "../config";
import { getClients, sendContractTx } from "../contracts-client";
import { recordTaskEvent } from "./supabase-module";

// ── Types ────────────────────────────────────────────────────

export interface SplitRecipient {
  agentType: string;
  address: string;
  shareBps: number; // basis points (10000 = 100%)
}

export interface SplitConfig {
  splitId: number | null;
  recipients: SplitRecipient[];
  totalAmount: string; // dollar-prefixed e.g. "$0.020"
  txHash: string;
  explorerUrl: string;
  mock: boolean;
}

export interface DistributionResult {
  splitId: number;
  totalDistributed: string;
  distributions: Array<{
    recipient: string;
    amount: string;
    shareBps: number;
  }>;
  txHash: string;
  explorerUrl: string;
  mock: boolean;
}

// ── PaymentSplitter ABI ─────────────────────────────────────

const PAYMENT_SPLITTER_ABI = [
  {
    name: "createSplit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_recipients", type: "address[]" },
      { name: "_shares", type: "uint256[]" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "distribute",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_split_id", type: "uint256" },
      { name: "_total_amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "getSplit",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_split_id", type: "uint256" }],
    outputs: [
      { name: "", type: "address" },
      { name: "", type: "address[]" },
      { name: "", type: "uint256[]" },
      { name: "", type: "uint256" },
    ],
  },
] as const;

// ── Default split: equal shares across 4 agents ─────────────
// Lazy getter: resolves real wallet addresses at call time (dotenv-safe).

export function getDefaultSplitRecipients(): SplitRecipient[] {
  const agents: SplitRecipient[] = [];
  for (const type of ["research", "code", "test", "review"] as const) {
    try {
      agents.push({ agentType: type, address: getAgentAddress(type), shareBps: 2500 });
    } catch {
      agents.push({ agentType: type, address: `0x_AGENT_${type.toUpperCase()}`, shareBps: 2500 });
    }
  }
  return agents;
}

/** @deprecated Use getDefaultSplitRecipients() for real addresses */
const DEFAULT_EQUAL_SPLIT: SplitRecipient[] = [
  { agentType: "research", address: "0x_AGENT_RESEARCH", shareBps: 2500 },
  { agentType: "code",     address: "0x_AGENT_CODE",     shareBps: 2500 },
  { agentType: "test",     address: "0x_AGENT_TEST",     shareBps: 2500 },
  { agentType: "review",   address: "0x_AGENT_REVIEW",   shareBps: 2500 },
];

// ── Create split configuration ──────────────────────────────

let nextSplitId = 0;

/**
 * Create a payment split configuration on-chain.
 * Defines how a total payment is distributed across agents.
 */
export async function createSplit(
  recipients: SplitRecipient[] = DEFAULT_EQUAL_SPLIT,
): Promise<SplitConfig> {
  const splitterAddress = process.env.PAYMENT_SPLITTER_ADDRESS;

  if (!splitterAddress || !isContractDeployed("paymentSplitter")) {
    return createMockSplit(recipients);
  }

  try {
    const clients = getClients();
    if (!clients) {
      return createMockSplit(recipients);
    }

    const addresses = recipients.map((r) => r.address as `0x${string}`);
    const shares = recipients.map((r) => BigInt(r.shareBps));

    const hash = await sendContractTx({
      address: splitterAddress as `0x${string}`,
      abi: PAYMENT_SPLITTER_ABI,
      functionName: "createSplit",
      args: [addresses, shares],
    });

    await clients.publicClient.waitForTransactionReceipt({ hash });

    const splitId = nextSplitId++;
    console.log(`🔀 Payment split created on-chain (ID=${splitId}): ${hash}`);
    console.log(`   🔗 Explorer: ${ARC_CONFIG.explorerUrl}${hash}`);
    recordTaskEvent({
      task_id: `split-create-${splitId}`,
      agent_type: "splitter",
      status: "completed",
      gateway_tx: hash,
      amount: "$0.000",
      result: `Split created with ${recipients.length} recipients`,
      error: null,
    }).catch(() => {});

    return {
      splitId,
      recipients,
      totalAmount: "$0.000", // set during distribute
      txHash: hash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${hash}`,
      mock: false,
    };
  } catch (error) {
    console.error(`❌ Split creation failed: ${error}`);
    return createMockSplit(recipients);
  }
}

/**
 * Distribute USDC according to a split configuration.
 */
export async function distributeSplit(
  splitConfig: SplitConfig,
  totalAmount: string,
): Promise<DistributionResult> {
  const splitterAddress = process.env.PAYMENT_SPLITTER_ADDRESS;

  const amountNum = parseFloat(totalAmount.replace("$", ""));
  const distributions = splitConfig.recipients.map((r) => ({
    recipient: r.agentType,
    amount: `$${((amountNum * r.shareBps) / 10000).toFixed(4)}`,
    shareBps: r.shareBps,
  }));

  if (!splitterAddress || !isContractDeployed("paymentSplitter") || splitConfig.mock) {
    const mockHash = `MOCK_SPLIT_DISTRIBUTE_${Date.now().toString(16)}`;
    console.log(`🔀 Mock distribution: ${totalAmount} split across ${splitConfig.recipients.length} agents`);
    for (const d of distributions) {
      console.log(`   → ${d.recipient}: ${d.amount} (${d.shareBps / 100}%)`);
    }
    return {
      splitId: splitConfig.splitId ?? 0,
      totalDistributed: totalAmount,
      distributions,
      txHash: mockHash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${mockHash}`,
      mock: true,
    };
  }

  try {
    const clients = getClients();
    if (!clients) {
      throw new Error("No wallet client");
    }

    const amountAtomic = BigInt(Math.round(amountNum * 1_000_000));

    const hash = await sendContractTx({
      address: splitterAddress as `0x${string}`,
      abi: PAYMENT_SPLITTER_ABI,
      functionName: "distribute",
      args: [BigInt(splitConfig.splitId!), amountAtomic],
    });

    await clients.publicClient.waitForTransactionReceipt({ hash });

    console.log(`🔀 Payment distributed on-chain: ${hash}`);
    console.log(`   🔗 Explorer: ${ARC_CONFIG.explorerUrl}${hash}`);
    for (const d of distributions) {
      console.log(`   → ${d.recipient}: ${d.amount} (${d.shareBps / 100}%)`);
    }
    recordTaskEvent({
      task_id: `split-distribute-${splitConfig.splitId}`,
      agent_type: "splitter",
      status: "completed",
      gateway_tx: hash,
      amount: totalAmount,
      result: `Distributed ${totalAmount} to ${distributions.length} agents`,
      error: null,
    }).catch(() => {});

    return {
      splitId: splitConfig.splitId!,
      totalDistributed: totalAmount,
      distributions,
      txHash: hash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${hash}`,
      mock: false,
    };
  } catch (error) {
    console.error(`❌ Distribution failed: ${error}`);
    const mockHash = `MOCK_SPLIT_DISTRIBUTE_${Date.now().toString(16)}`;
    return {
      splitId: splitConfig.splitId ?? 0,
      totalDistributed: totalAmount,
      distributions,
      txHash: mockHash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${mockHash}`,
      mock: true,
    };
  }
}

// ── Helper ───────────────────────────────────────────────────

function createMockSplit(recipients: SplitRecipient[]): SplitConfig {
  const splitId = nextSplitId++;
  const mockHash = `MOCK_SPLIT_CREATE_${Date.now().toString(16)}`;
  console.log(`🔀 Mock split created (ID=${splitId}) for ${recipients.length} recipients`);
  return {
    splitId,
    recipients,
    totalAmount: "$0.000",
    txHash: mockHash,
    explorerUrl: `${ARC_CONFIG.explorerUrl}${mockHash}`,
    mock: true,
  };
}

/**
 * Get the default equal-split configuration for 4 agents.
 * Uses real wallet addresses when configured, falls back to placeholders.
 */
export function getDefaultSplit(): SplitRecipient[] {
  return getDefaultSplitRecipients();
}
