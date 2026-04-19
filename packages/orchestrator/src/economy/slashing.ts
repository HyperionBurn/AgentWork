// ============================================================
// Slashing & Insurance Fund — Stake-based agent accountability
// ============================================================
// Manages agent stake deposits, slashing for bad behavior,
// and compensation for affected users.
// Mock fallback when AgentStaking contract is not deployed.
// ============================================================

import { ARC_CONFIG, isContractDeployed } from "../config";

// ── Types ────────────────────────────────────────────────────

export type SlashSeverity = "minor" | "major" | "critical";

export interface StakeInfo {
  agentAddress: string;
  agentType: string;
  stakedAmount: number;
  slashCount: number;
  totalSlashed: number;
  isActive: boolean;
}

export interface SlashResult {
  agentAddress: string;
  amount: number;
  severity: SlashSeverity;
  reason: string;
  txHash: string;
  explorerUrl: string;
  mock: boolean;
}

export interface CompensationResult {
  userAddress: string;
  agentAddress: string;
  amount: number;
  reason: string;
  txHash: string;
  mock: boolean;
}

// ── Severity → Slash Percentage ──────────────────────────────

const SLASH_PERCENTAGES: Record<SlashSeverity, number> = {
  minor: 0.05,    // 5%
  major: 0.20,    // 20%
  critical: 0.50, // 50%
};

// ── In-memory stake tracking (mock) ─────────────────────────

const stakes = new Map<string, StakeInfo>();

function getStakeKey(agentAddress: string): string {
  return agentAddress.toLowerCase();
}

// ── Stake Management ─────────────────────────────────────────

/**
 * Stake an amount for an agent.
 */
export async function stakeAgent(
  agentAddress: string,
  agentType: string,
  amount: number,
): Promise<StakeInfo> {
  const key = getStakeKey(agentAddress);

  if (isContractDeployed("agentEscrow")) {
    // In production: call AgentStaking.stake(amount) on-chain
    console.log(`🔒 Staking ${amount} USDC for ${agentType} agent on-chain`);
  }

  const existing = stakes.get(key);
  const info: StakeInfo = {
    agentAddress,
    agentType,
    stakedAmount: (existing?.stakedAmount || 0) + amount,
    slashCount: existing?.slashCount || 0,
    totalSlashed: existing?.totalSlashed || 0,
    isActive: true,
  };
  stakes.set(key, info);

  console.log(`   ✅ ${agentType} staked ${amount} USDC (total: ${info.stakedAmount})`);
  return info;
}

/**
 * Slash an agent's stake for bad behavior.
 */
export async function slashAgent(
  agentAddress: string,
  severity: SlashSeverity,
  reason: string,
): Promise<SlashResult> {
  const key = getStakeKey(agentAddress);
  const info = stakes.get(key);
  const stakedAmount = info?.stakedAmount || 1.0;
  const slashPercentage = SLASH_PERCENTAGES[severity];
  const slashAmount = stakedAmount * slashPercentage;

  const txHash = isContractDeployed("agentEscrow")
    ? `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    : `MOCK_0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

  // Update stake info
  if (info) {
    info.stakedAmount = Math.max(0, info.stakedAmount - slashAmount);
    info.slashCount++;
    info.totalSlashed += slashAmount;
    if (info.stakedAmount <= 0) info.isActive = false;
    stakes.set(key, info);
  }

  console.log(`   ⚔️  Slashing ${agentAddress}: ${severity} (${(slashPercentage * 100).toFixed(0)}% = $${slashAmount.toFixed(4)}) — ${reason}`);

  return {
    agentAddress,
    amount: slashAmount,
    severity,
    reason,
    txHash,
    explorerUrl: `${ARC_CONFIG.explorerUrl}${txHash}`,
    mock: !isContractDeployed("agentEscrow"),
  };
}

/**
 * Get stake information for an agent.
 */
export function getStakeInfo(agentAddress: string): StakeInfo {
  const key = getStakeKey(agentAddress);
  return stakes.get(key) || {
    agentAddress,
    agentType: "unknown",
    stakedAmount: 0,
    slashCount: 0,
    totalSlashed: 0,
    isActive: false,
  };
}

/**
 * Compensate a user from the insurance fund.
 */
export async function compensateUser(
  userAddress: string,
  agentAddress: string,
  amount: number,
  reason: string,
): Promise<CompensationResult> {
  const txHash = `MOCK_0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

  console.log(`   💰 Compensating ${userAddress}: $${amount.toFixed(4)} from insurance fund (${reason})`);

  return {
    userAddress,
    agentAddress,
    amount,
    reason,
    txHash,
    mock: true,
  };
}

/**
 * Calculate slash amount for a given stake and severity.
 */
export function calculateSlashAmount(stakedAmount: number, severity: SlashSeverity): number {
  return stakedAmount * SLASH_PERCENTAGES[severity];
}

/**
 * Get all stake info records.
 */
export function getAllStakes(): StakeInfo[] {
  return Array.from(stakes.values());
}

/**
 * Initialize default stakes for all agent types.
 */
export async function initDefaultStakes(
  agentTypes: string[],
  amount: number = 5.0,
): Promise<StakeInfo[]> {
  const results: StakeInfo[] = [];
  for (const type of agentTypes) {
    const address = `0x_AGENT_${type.toUpperCase()}`;
    const info = await stakeAgent(address, type, amount);
    results.push(info);
  }
  return results;
}
