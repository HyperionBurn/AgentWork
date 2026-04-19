// ============================================================
// Subscription Tiers — Tiered pricing for agent capabilities
// ============================================================
// Supports basic, premium, and enterprise tiers with different
// pricing multipliers, rate limits, and capabilities.
// ============================================================

// ── Types ────────────────────────────────────────────────────

export type TierLevel = "basic" | "premium" | "enterprise";

export interface TierConfig {
  level: TierLevel;
  label: string;
  priceMultiplier: number;
  rateLimit: number; // calls per minute
  capabilities: string[];
  description: string;
  color: string;
}

export interface TierPricingResult {
  agentType: string;
  basePrice: number;
  tier: TierLevel;
  tierMultiplier: number;
  adjustedPrice: number;
  formattedPrice: string;
  capabilities: string[];
}

// ── Tier Definitions ─────────────────────────────────────────

export const TIERS: Record<TierLevel, TierConfig> = {
  basic: {
    level: "basic",
    label: "Basic",
    priceMultiplier: 1.0,
    rateLimit: 10,
    capabilities: ["standard", "simple-tasks"],
    description: "Standard agent access with basic capabilities",
    color: "text-slate-300",
  },
  premium: {
    level: "premium",
    label: "Premium",
    priceMultiplier: 4.0,
    rateLimit: 30,
    capabilities: ["standard", "priority-routing", "advanced", "context-memory"],
    description: "Priority routing with advanced agent capabilities",
    color: "text-arc-purple",
  },
  enterprise: {
    level: "enterprise",
    label: "Enterprise",
    priceMultiplier: 10.0,
    rateLimit: 100,
    capabilities: ["standard", "priority-routing", "advanced", "context-memory", "dedicated-agent", "sla", "custom-models"],
    description: "Dedicated agent with SLA guarantees and custom models",
    color: "text-yellow-400",
  },
};

// ── Pricing Functions ────────────────────────────────────────

/**
 * Apply tier multiplier to a base price.
 */
export function getTieredPrice(basePrice: number, tier: TierLevel): number {
  const config = TIERS[tier];
  return Math.max(0.001, basePrice * config.priceMultiplier);
}

/**
 * Get tier-adjusted pricing for all agents.
 */
export function getTierPricing(
  agents: Array<{ type: string; basePrice: number }>,
  tier: TierLevel,
): TierPricingResult[] {
  return agents.map((agent) => {
    const adjusted = getTieredPrice(agent.basePrice, tier);
    return {
      agentType: agent.type,
      basePrice: agent.basePrice,
      tier,
      tierMultiplier: TIERS[tier].priceMultiplier,
      adjustedPrice: adjusted,
      formattedPrice: `$${adjusted.toFixed(4)}`,
      capabilities: TIERS[tier].capabilities,
    };
  });
}

/**
 * Check if a tier supports a given capability.
 */
export function tierHasCapability(tier: TierLevel, capability: string): boolean {
  return TIERS[tier].capabilities.includes(capability);
}

/**
 * Get the default tier (basic).
 */
export function getDefaultTier(): TierLevel {
  return "basic";
}

/**
 * Compare two tiers and return the higher one.
 */
export function getHigherTier(a: TierLevel, b: TierLevel): TierLevel {
  const order: TierLevel[] = ["basic", "premium", "enterprise"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}
