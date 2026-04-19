// ============================================================
// Cost Estimator — Pre-flight cost estimation
// ============================================================
// Estimates total cost before committing funds. Shows breakdown
// by agent, complexity, and total with confidence interval.
// ============================================================

import { AGENT_ENDPOINTS } from "./config";

// ── Types ────────────────────────────────────────────────────

export interface CostEstimate {
  taskDescription: string;
  totalCost: string;
  totalCostNum: number;
  agentBreakdown: AgentCostEstimate[];
  estimatedTransactions: number;
  confidence: string; // "low" | "medium" | "high"
  confidenceRange: {
    low: number;
    high: number;
  };
  summary: string;
}

export interface AgentCostEstimate {
  agentType: string;
  agentLabel: string;
  estimatedCalls: number;
  pricePerCall: number;
  subtotal: number;
  confidence: "high" | "medium";
}

// ── Agent keyword matching ───────────────────────────────────

const TASK_AGENT_KEYWORDS: Record<string, { agents: string[]; callsPerAgent: number }> = {
  // Full pipeline tasks
  "build": { agents: ["research", "code", "test", "review"], callsPerAgent: 1 },
  "create": { agents: ["research", "code", "test", "review"], callsPerAgent: 1 },
  "implement": { agents: ["research", "code", "test", "review"], callsPerAgent: 1 },
  "develop": { agents: ["research", "code", "test", "review"], callsPerAgent: 1 },
  "design": { agents: ["research", "code", "review"], callsPerAgent: 1 },

  // Code-focused tasks
  "code": { agents: ["code", "test", "review"], callsPerAgent: 1 },
  "write": { agents: ["code", "test", "review"], callsPerAgent: 1 },
  "generate": { agents: ["code", "test"], callsPerAgent: 1 },
  "refactor": { agents: ["code", "review"], callsPerAgent: 1 },
  "fix": { agents: ["code", "test"], callsPerAgent: 1 },
  "debug": { agents: ["code", "test"], callsPerAgent: 1 },

  // Test-focused tasks
  "test": { agents: ["test", "review"], callsPerAgent: 1 },
  "qa": { agents: ["test", "review"], callsPerAgent: 1 },
  "quality": { agents: ["test", "review"], callsPerAgent: 1 },
  "coverage": { agents: ["test", "review"], callsPerAgent: 1 },

  // Research-focused tasks
  "research": { agents: ["research", "review"], callsPerAgent: 1 },
  "analyze": { agents: ["research", "review"], callsPerAgent: 1 },
  "investigate": { agents: ["research", "review"], callsPerAgent: 1 },
  "compare": { agents: ["research", "review"], callsPerAgent: 1 },
  "report": { agents: ["research", "review"], callsPerAgent: 1 },

  // Review-focused tasks
  "review": { agents: ["review"], callsPerAgent: 1 },
  "audit": { agents: ["review", "test"], callsPerAgent: 1 },
  "security": { agents: ["review", "test"], callsPerAgent: 1 },
};

// ── Price lookup ─────────────────────────────────────────────

function getPricePerCall(agentType: string): number {
  const endpoint = AGENT_ENDPOINTS.find((e) => e.type === agentType);
  if (!endpoint) return 0.005;
  return parseFloat(endpoint.price.replace("$", "")) || 0.005;
}

function getAgentLabel(agentType: string): string {
  const endpoint = AGENT_ENDPOINTS.find((e) => e.type === agentType);
  return endpoint?.label || agentType;
}

// ── Main estimator ───────────────────────────────────────────

/**
 * Estimate the cost of a task before execution.
 * Uses keyword matching to determine which agents are needed.
 */
export function estimateTaskCost(
  taskDescription: string,
): CostEstimate {
  const lower = taskDescription.toLowerCase();

  // Determine which agents are needed based on keywords
  const agentCallMap = new Map<string, number>();
  let matched = false;

  for (const [keyword, config] of Object.entries(TASK_AGENT_KEYWORDS)) {
    if (lower.includes(keyword)) {
      matched = true;
      for (const agent of config.agents) {
        const current = agentCallMap.get(agent) || 0;
        agentCallMap.set(agent, Math.max(current, config.callsPerAgent));
      }
    }
  }

  // Default: all 4 agents if no keywords match
  if (!matched || agentCallMap.size === 0) {
    agentCallMap.set("research", 1);
    agentCallMap.set("code", 1);
    agentCallMap.set("test", 1);
    agentCallMap.set("review", 1);
  }

  // Build breakdown
  const agentBreakdown: AgentCostEstimate[] = [];
  let totalCost = 0;
  let totalCalls = 0;

  for (const [agentType, calls] of agentCallMap) {
    const pricePerCall = getPricePerCall(agentType);
    const subtotal = pricePerCall * calls;
    totalCost += subtotal;
    totalCalls += calls;

    agentBreakdown.push({
      agentType,
      agentLabel: getAgentLabel(agentType),
      estimatedCalls: calls,
      pricePerCall,
      subtotal,
      confidence: "high",
    });
  }

  // Add escrow + reputation overhead (4 contract interactions)
  const estimatedTxns = totalCalls + 4;

  // Confidence range: ±20%
  const confidenceRange = {
    low: totalCost * 0.8,
    high: totalCost * 1.2,
  };

  const confidence = matched ? "high" : "medium";

  return {
    taskDescription,
    totalCost: `$${totalCost.toFixed(4)}`,
    totalCostNum: totalCost,
    agentBreakdown,
    estimatedTransactions: estimatedTxns,
    confidence,
    confidenceRange,
    summary: formatEstimate(totalCost, totalCalls, estimatedTxns),
  };
}

/**
 * Format a cost estimate into a human-readable summary string.
 */
export function formatEstimate(
  totalCost: number,
  agentCalls: number,
  onChainTxns: number,
): string {
  return `Estimated: $${totalCost.toFixed(4)} (${agentCalls} agent calls, ~${onChainTxns} on-chain txns)`;
}

/**
 * Estimate cost from a pre-built decomposition (more accurate).
 */
export function estimateFromDecomposition(
  subtasks: Array<{ agentType: string; price: string }>,
): CostEstimate {
  const agentCallMap = new Map<string, { calls: number; subtotal: number }>();
  let totalCost = 0;

  for (const subtask of subtasks) {
    const current = agentCallMap.get(subtask.agentType) || { calls: 0, subtotal: 0 };
    const price = parseFloat(subtask.price.replace("$", "")) || 0.005;
    current.calls++;
    current.subtotal += price;
    totalCost += price;
    agentCallMap.set(subtask.agentType, current);
  }

  const agentBreakdown: AgentCostEstimate[] = [];
  let totalCalls = 0;

  for (const [agentType, data] of agentCallMap) {
    totalCalls += data.calls;
    agentBreakdown.push({
      agentType,
      agentLabel: getAgentLabel(agentType),
      estimatedCalls: data.calls,
      pricePerCall: data.subtotal / data.calls,
      subtotal: data.subtotal,
      confidence: "high",
    });
  }

  const estimatedTxns = totalCalls + 4;

  return {
    taskDescription: "From decomposition",
    totalCost: `$${totalCost.toFixed(4)}`,
    totalCostNum: totalCost,
    agentBreakdown,
    estimatedTransactions: estimatedTxns,
    confidence: "high",
    confidenceRange: { low: totalCost * 0.95, high: totalCost * 1.05 },
    summary: formatEstimate(totalCost, totalCalls, estimatedTxns),
  };
}
