// ============================================================
// Reputation-Weighted Task Routing
// ============================================================
// Routes tasks to agents based on their reputation scores,
// current workload, and task complexity. Implements a weighted
// selection algorithm that balances quality with availability.
// ============================================================

import { getAgentReputation } from "../contracts";
import { getAgentAddress } from "../config";
import { discoverAgents, type DiscoveredAgent } from "./discovery";

// ── Types ────────────────────────────────────────────────────

export interface RoutingDecision {
  agentType: string;
  agentAddress: string;
  score: number;
  factors: {
    reputationWeight: number;
    loadWeight: number;
    priceWeight: number;
  };
  reason: string;
}

export interface RoutingConfig {
  /** Weight of reputation in selection (0-1) */
  reputationWeight: number;
  /** Weight of current load (0-1) */
  loadWeight: number;
  /** Weight of price (0-1) */
  priceWeight: number;
  /** Minimum reputation score to be eligible (0-100) */
  minReputation: number;
  /** Maximum load percentage to accept new tasks */
  maxLoad: number;
}

// ── Default routing config ──────────────────────────────────

const DEFAULT_CONFIG: RoutingConfig = {
  reputationWeight: 0.5,
  loadWeight: 0.3,
  priceWeight: 0.2,
  minReputation: 50,
  maxLoad: 80,
};

// ── In-memory reputation cache ──────────────────────────────

const reputationCache = new Map<string, number>();
let cacheExpiry = 0;
const CACHE_TTL = 60_000; // 1 minute

/**
 * Route a task to the best available agent.
 * Uses a composite score: reputation * load_factor * price_factor.
 */
export async function routeTask(
  agentType: string,
  config: Partial<RoutingConfig> = {},
): Promise<RoutingDecision> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const agents = discoverAgents().filter((a) => a.type === agentType);

  if (agents.length === 0) {
    // Fallback to the requested agent type
    let agentAddress: string;
    try {
      agentAddress = getAgentAddress(agentType);
    } catch {
      agentAddress = `0x_AGENT_${agentType.toUpperCase()}`;
    }
    return {
      agentType,
      agentAddress,
      score: 0,
      factors: { reputationWeight: 0, loadWeight: 0, priceWeight: 0 },
      reason: "No agents discovered — using default routing",
    };
  }

  // Refresh reputation cache if expired
  if (Date.now() > cacheExpiry) {
    await refreshReputationCache(agents);
  }

  // Score each agent
  const scored = agents.map((agent) => {
    const reputation = reputationCache.get(agent.type) ?? 75; // default 75
    const loadFactor = 1 - (agent.load / 100); // inverse: lower load = higher score
    const priceNum = parseFloat(agent.price.replace("$", ""));
    const priceFactor = 1 / Math.max(priceNum, 0.001); // inverse: lower price = higher score

    // Normalize reputation to 0-1
    const repNorm = reputation / 100;

    // Composite weighted score
    const score =
      (repNorm * cfg.reputationWeight) +
      (loadFactor * cfg.loadWeight) +
      (priceFactor * cfg.priceWeight);

    return {
      agent,
      score,
      reputation,
      loadFactor,
      priceFactor,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const reasonParts: string[] = [];
  if (best.reputation >= 80) reasonParts.push(`high rep (${best.reputation})`);
  if (best.agent.load < 30) reasonParts.push(`low load (${best.agent.load}%)`);
  if (parseFloat(best.agent.price.replace("$", "")) <= 0.005) reasonParts.push(`competitive price (${best.agent.price})`);

  return {
    agentType: best.agent.type,
    agentAddress: (() => { try { return getAgentAddress(best.agent.type); } catch { return `0x_AGENT_${best.agent.type.toUpperCase()}`; } })(),
    score: best.score,
    factors: {
      reputationWeight: best.reputation / 100,
      loadWeight: best.loadFactor,
      priceWeight: best.priceFactor,
    },
    reason: reasonParts.length > 0
      ? `Selected: ${reasonParts.join(", ")}`
      : `Best available (score=${best.score.toFixed(2)})`,
  };
}

/**
 * Route all subtask agent types at once.
 * Returns a mapping of agentType → RoutingDecision.
 */
export async function routeAllAgents(
  agentTypes: string[],
): Promise<Map<string, RoutingDecision>> {
  const decisions = new Map<string, RoutingDecision>();
  for (const type of agentTypes) {
    const decision = await routeTask(type);
    decisions.set(type, decision);
  }
  return decisions;
}

/**
 * Refresh the reputation cache from on-chain data.
 * Falls back to simulated scores if contracts not deployed.
 */
async function refreshReputationCache(agents: DiscoveredAgent[]): Promise<void> {
  for (const agent of agents) {
    try {
      const address = (() => { try { return getAgentAddress(agent.type); } catch { return `0x_AGENT_${agent.type.toUpperCase()}`; } })();
      const rep = await getAgentReputation(address);
      if (!rep.mock) {
        reputationCache.set(agent.type, rep.averageScore);
      } else {
        // Use simulated reputation based on agent type
        const simScores: Record<string, number> = {
          research: 88,
          code: 92,
          test: 85,
          review: 90,
        };
        reputationCache.set(agent.type, simScores[agent.type] ?? 75);
      }
    } catch {
      reputationCache.set(agent.type, 75);
    }
  }
  cacheExpiry = Date.now() + CACHE_TTL;
}

/**
 * Get current reputation scores (for dashboard display).
 */
export function getReputationCache(): Map<string, number> {
  return new Map(reputationCache);
}
