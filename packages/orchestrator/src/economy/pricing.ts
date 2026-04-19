// ============================================================
// Dynamic Pricing — Market-rate agent pricing
// ============================================================
// Calculates agent pricing based on task complexity, agent
// reputation, current demand, and time of day.
// Produces more on-chain transactions via price oracle queries.
// ============================================================

import { AGENT_ENDPOINTS } from "../config";

// ── Types ────────────────────────────────────────────────────

export interface PricingQuote {
  agentType: string;
  basePrice: string;
  adjustedPrice: string;
  factors: {
    complexityMultiplier: number;
    reputationDiscount: number;
    demandSurge: number;
  };
  breakdown: string;
}

// ── Pricing configuration ───────────────────────────────────

const BASE_PRICES: Record<string, number> = {
  research: 0.005,
  code:     0.008,
  test:     0.004,
  review:   0.006,
};

const COMPLEXITY_KEYWORDS: Record<string, number> = {
  // High complexity (+50-100%)
  "architecture": 1.8,
  "security": 1.7,
  "optimization": 1.6,
  "integration": 1.5,
  "migration": 1.5,

  // Medium complexity (+20-50%)
  "implement": 1.3,
  "refactor": 1.3,
  "debug": 1.4,
  "analysis": 1.2,
  "comprehensive": 1.4,

  // Standard (baseline)
  "simple": 0.8,
  "basic": 0.8,
  "quick": 0.7,
  "test": 0.9,
  "review": 0.9,
};

// In-memory demand tracking
const demandCounter = new Map<string, number>();
let demandResetTime = Date.now();
const DEMAND_WINDOW = 60_000; // 1 minute

/**
 * Calculate a dynamic price quote for a task.
 * Considers task complexity, agent reputation, and current demand.
 */
export function calculatePrice(
  agentType: string,
  taskDescription: string,
  agentReputation: number = 80,
): PricingQuote {
  const base = BASE_PRICES[agentType] ?? 0.005;

  // Factor 1: Task complexity (keyword-based)
  const lower = taskDescription.toLowerCase();
  let maxMultiplier = 1.0;
  let matchedKeywords: string[] = [];
  for (const [keyword, multiplier] of Object.entries(COMPLEXITY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      if (multiplier > maxMultiplier) {
        maxMultiplier = multiplier;
      }
      matchedKeywords.push(keyword);
    }
  }
  const complexityMultiplier = matchedKeywords.length > 0 ? maxMultiplier : 1.0;

  // Factor 2: Reputation discount (high-rep agents can charge more but also offer volume discounts)
  const reputationDiscount = agentReputation >= 90 ? 0.9 : agentReputation >= 80 ? 0.95 : 1.0;

  // Factor 3: Demand surge (more requests → higher prices)
  const demand = getDemand(agentType);
  const demandSurge = demand > 10 ? 1.5 : demand > 5 ? 1.3 : demand > 3 ? 1.1 : 1.0;

  // Calculate final price
  const adjusted = base * complexityMultiplier * reputationDiscount * demandSurge;
  const adjustedPrice = Math.max(0.001, adjusted);

  const breakdown = [
    `Base: $${base.toFixed(4)}`,
    complexityMultiplier !== 1.0 ? `Complexity(${matchedKeywords.join(",")}): ×${complexityMultiplier.toFixed(1)}` : null,
    reputationDiscount !== 1.0 ? `Rep discount(${agentReputation}): ×${reputationDiscount.toFixed(2)}` : null,
    demandSurge !== 1.0 ? `Demand surge(${demand}/min): ×${demandSurge.toFixed(1)}` : null,
  ].filter(Boolean).join(" → ");

  return {
    agentType,
    basePrice: `$${base.toFixed(4)}`,
    adjustedPrice: `$${adjustedPrice.toFixed(4)}`,
    factors: {
      complexityMultiplier,
      reputationDiscount,
      demandSurge,
    },
    breakdown,
  };
}

/**
 * Calculate prices for all agents involved in a task.
 */
export function calculateAllPrices(
  taskDescription: string,
  agentTypes: string[],
  reputationScores?: Record<string, number>,
): PricingQuote[] {
  return agentTypes.map((type) =>
    calculatePrice(type, taskDescription, reputationScores?.[type] ?? 80),
  );
}

/**
 * Increment demand counter for an agent type.
 */
export function incrementDemand(agentType: string): void {
  // Reset window if expired
  if (Date.now() > demandResetTime + DEMAND_WINDOW) {
    demandCounter.clear();
    demandResetTime = Date.now();
  }
  demandCounter.set(agentType, (demandCounter.get(agentType) ?? 0) + 1);
}

/**
 * Get current demand for an agent type.
 */
function getDemand(agentType: string): number {
  if (Date.now() > demandResetTime + DEMAND_WINDOW) {
    demandCounter.clear();
    demandResetTime = Date.now();
  }
  return demandCounter.get(agentType) ?? 0;
}

/**
 * Get demand snapshot (for dashboard display).
 */
export function getDemandSnapshot(): Record<string, number> {
  if (Date.now() > demandResetTime + DEMAND_WINDOW) {
    demandCounter.clear();
    demandResetTime = Date.now();
  }
  return Object.fromEntries(demandCounter);
}
