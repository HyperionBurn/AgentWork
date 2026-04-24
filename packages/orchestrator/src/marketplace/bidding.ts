// ============================================================
// Agent Bidding System
// ============================================================
// Agents submit bids (price + estimated time) for tasks.
// Orchestrator selects the best bid based on price, reputation,
// and estimated completion time.
// ============================================================

import { ARC_CONFIG, isContractDeployed, getAgentAddress } from "../config";
import { getClients, sendContractTx } from "../contracts-client";

// ── Types ────────────────────────────────────────────────────

export interface AgentBid {
  agentType: string;
  agentAddress: string;
  price: string;           // dollar-prefixed e.g. "$0.005"
  estimatedTime: number;   // seconds
  reputationScore: number; // 0-100
  submittedAt: number;
}

export interface BidSelection {
  winner: AgentBid;
  runnersUp: AgentBid[];
  reason: string;
}

// ── Bidding state (in-memory for demo) ──────────────────────

const bidHistory = new Map<string, AgentBid[]>();

// ── Simulate agent bidding ──────────────────────────────────
// In production, agents would submit bids via their API.
// For the hackathon demo, we simulate competitive bidding with
// slight price variation and response times.

const AGENT_BID_PROFILES: Record<string, {
  basePrice: number;
  priceVariance: number;
  baseTime: number;
  timeVariance: number;
  baseReputation: number;
}> = {
  research: { basePrice: 0.005, priceVariance: 0.003, baseTime: 3, timeVariance: 2, baseReputation: 88 },
  code:     { basePrice: 0.008, priceVariance: 0.004, baseTime: 5, timeVariance: 3, baseReputation: 92 },
  test:     { basePrice: 0.004, priceVariance: 0.002, baseTime: 2, timeVariance: 1, baseReputation: 85 },
  review:   { basePrice: 0.006, priceVariance: 0.003, baseTime: 4, timeVariance: 2, baseReputation: 90 },
};

/**
 * Generate simulated bids from multiple "agents" for a given task type.
 * Produces 2-4 bids per task with price competition.
 */
export function generateBids(
  taskDescription: string,
  agentType: string,
  count: number = 3,
): AgentBid[] {
  const profile = AGENT_BID_PROFILES[agentType];
  if (!profile) {
    let fallbackAddr: string;
    try { fallbackAddr = getAgentAddress(agentType); } catch { fallbackAddr = `0x_AGENT_${agentType.toUpperCase()}`; }
    return [{
      agentType,
      agentAddress: fallbackAddr,
      price: "$0.005",
      estimatedTime: 5,
      reputationScore: 80,
      submittedAt: Date.now(),
    }];
  }

  const bids: AgentBid[] = [];
  for (let i = 0; i < count; i++) {
    const priceMultiplier = 1 + (Math.random() - 0.5) * 2 * (profile.priceVariance / profile.basePrice);
    const price = Math.max(0.001, profile.basePrice * priceMultiplier);
    const time = Math.max(1, profile.baseTime + (Math.random() - 0.5) * 2 * profile.timeVariance);
    const reputation = Math.min(100, Math.max(60, profile.baseReputation + (Math.random() - 0.5) * 20));

    bids.push({
      agentType: `${agentType}-bidder-${i + 1}`,
      agentAddress: `0x_BIDDER_${agentType.toUpperCase()}_${i}`,
      price: `$${price.toFixed(4)}`,
      estimatedTime: Math.round(time),
      reputationScore: Math.round(reputation),
      submittedAt: Date.now() + i * 200,
    });
  }

  bidHistory.set(`${agentType}-${Date.now()}`, bids);
  return bids;
}

/**
 * Select the best bid using a weighted scoring formula:
 *   score = (reputation * 0.4) + (price_score * 0.35) + (speed_score * 0.25)
 *
 * Price score is inverse (lower = better), speed score is inverse (faster = better).
 */
export function selectBestBid(bids: AgentBid[]): BidSelection {
  if (bids.length === 0) {
    throw new Error("No bids to select from");
  }

  if (bids.length === 1) {
    return {
      winner: bids[0],
      runnersUp: [],
      reason: "Only bidder — auto-selected",
    };
  }

  // Normalize scores
  const maxPrice = Math.max(...bids.map((b) => parseFloat(b.price.replace("$", ""))));
  const maxTime = Math.max(...bids.map((b) => b.estimatedTime));
  const minPrice = Math.min(...bids.map((b) => parseFloat(b.price.replace("$", ""))));
  const minTime = Math.min(...bids.map((b) => b.estimatedTime));

  const scored = bids.map((bid) => {
    const priceVal = parseFloat(bid.price.replace("$", ""));
    const priceScore = maxPrice > minPrice
      ? 1 - (priceVal - minPrice) / (maxPrice - minPrice)
      : 1;
    const speedScore = maxTime > minTime
      ? 1 - (bid.estimatedTime - minTime) / (maxTime - minTime)
      : 1;
    const repScore = bid.reputationScore / 100;

    const composite = (repScore * 0.4) + (priceScore * 0.35) + (speedScore * 0.25);

    return { bid, composite };
  });

  scored.sort((a, b) => b.composite - a.composite);

  return {
    winner: scored[0].bid,
    runnersUp: scored.slice(1).map((s) => s.bid),
    reason: `Won with score ${scored[0].composite.toFixed(2)} (rep=${scored[0].bid.reputationScore}, price=${scored[0].bid.price}, time=${scored[0].bid.estimatedTime}s)`,
  };
}

/**
 * Get all historical bids (for dashboard display).
 */
export function getBidHistory(): Map<string, AgentBid[]> {
  return bidHistory;
}
