// ============================================================
// GC11: SLA Engine — Service Level Agreement Monitoring
// ============================================================
// Tracks per-agent SLA compliance against configurable thresholds:
// - Max response time
// - Min quality score
// - Min uptime percentage
//
// After each orchestrator run, evaluate SLA compliance and
// record violations. Dashboard displays SLA status per agent.
// ============================================================

export interface SLAPolicy {
  agentType: string;
  maxResponseTimeMs: number;
  minQualityScore: number;     // 0-100
  minUptimePct: number;        // 0-100
  penaltyAmount: string;       // USDC amount deducted on violation
}

export interface SLAResult {
  agentType: string;
  compliant: boolean;
  violations: SLAViolation[];
  metrics: {
    avgResponseTimeMs: number;
    qualityScore: number;
    uptimePct: number;
    totalCalls: number;
    failedCalls: number;
  };
  evaluatedAt: string;
}

export interface SLAViolation {
  type: "response_time" | "quality" | "uptime";
  actual: number;
  threshold: number;
  severity: "warning" | "critical";
  message: string;
}

// Default SLA policies for the 4 agents
export const DEFAULT_SLA_POLICIES: SLAPolicy[] = [
  {
    agentType: "research",
    maxResponseTimeMs: 5000,
    minQualityScore: 80,
    minUptimePct: 95,
    penaltyAmount: "$0.001",
  },
  {
    agentType: "code",
    maxResponseTimeMs: 8000,
    minQualityScore: 85,
    minUptimePct: 95,
    penaltyAmount: "$0.001",
  },
  {
    agentType: "test",
    maxResponseTimeMs: 6000,
    minQualityScore: 90,
    minUptimePct: 98,
    penaltyAmount: "$0.001",
  },
  {
    agentType: "review",
    maxResponseTimeMs: 4000,
    minQualityScore: 85,
    minUptimePct: 95,
    penaltyAmount: "$0.001",
  },
];

/**
 * Evaluate SLA compliance for a single agent based on task events.
 */
export function evaluateSLA(
  agentType: string,
  events: Array<{
    agent_type: string;
    status: string;
    created_at: string;
    result?: string;
    error?: string;
  }>,
  policy?: SLAPolicy,
): SLAResult {
  const p = policy || DEFAULT_SLA_POLICIES.find((pol) => pol.agentType === agentType);
  if (!p) {
    return {
      agentType,
      compliant: true,
      violations: [],
      metrics: {
        avgResponseTimeMs: 0,
        qualityScore: 100,
        uptimePct: 100,
        totalCalls: 0,
        failedCalls: 0,
      },
      evaluatedAt: new Date().toISOString(),
    };
  }

  const agentEvents = events.filter((e) => e.agent_type === agentType);
  const totalCalls = agentEvents.length;
  const failedCalls = agentEvents.filter((e) => e.status === "error").length;
  const successfulCalls = totalCalls - failedCalls;

  // Uptime: % of calls that succeeded
  const uptimePct = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 100;

  // Quality: parse from agent response if available, else use success rate
  let qualityScore = successfulCalls > 0 ? 100 : 0;
  if (successfulCalls > 0) {
    const qualityScores = agentEvents
      .map(e => {
        try {
          const res = typeof e.result === 'string' ? JSON.parse(e.result) : e.result;
          return res?.quality_score ?? res?.confidence ?? 100;
        } catch {
          return 100;
        }
      })
      .filter(s => s !== undefined);
    
    if (qualityScores.length > 0) {
      qualityScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    }
  }

  // Response time: simulated — real impl would measure actual call duration
  // For demo, we use a deterministic pseudo-metric based on agent type
  const responseTimeMap: Record<string, number> = {
    research: 1200,
    code: 2100,
    test: 800,
    review: 1500,
  };
  const avgResponseTimeMs = responseTimeMap[agentType] || 1500;

  // Evaluate violations
  const violations: SLAViolation[] = [];

  if (avgResponseTimeMs > p.maxResponseTimeMs) {
    violations.push({
      type: "response_time",
      actual: avgResponseTimeMs,
      threshold: p.maxResponseTimeMs,
      severity: avgResponseTimeMs > p.maxResponseTimeMs * 1.5 ? "critical" : "warning",
      message: `Response time ${avgResponseTimeMs}ms exceeds limit ${p.maxResponseTimeMs}ms`,
    });
  }

  if (qualityScore < p.minQualityScore) {
    violations.push({
      type: "quality",
      actual: qualityScore,
      threshold: p.minQualityScore,
      severity: qualityScore < p.minQualityScore * 0.8 ? "critical" : "warning",
      message: `Quality score ${qualityScore.toFixed(1)}% below minimum ${p.minQualityScore}%`,
    });
  }

  if (uptimePct < p.minUptimePct) {
    violations.push({
      type: "uptime",
      actual: uptimePct,
      threshold: p.minUptimePct,
      severity: uptimePct < p.minUptimePct * 0.9 ? "critical" : "warning",
      message: `Uptime ${uptimePct.toFixed(1)}% below SLA ${p.minUptimePct}%`,
    });
  }

  return {
    agentType,
    compliant: violations.length === 0,
    violations,
    metrics: {
      avgResponseTimeMs,
      qualityScore,
      uptimePct,
      totalCalls,
      failedCalls,
    },
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Evaluate SLA compliance for all agents at once.
 */
export function evaluateAllSLAs(
  events: Array<{
    agent_type: string;
    status: string;
    created_at: string;
    result?: string;
    error?: string;
  }>,
): SLAResult[] {
  const agentTypes = ["research", "code", "test", "review"];
  return agentTypes.map((type) => evaluateSLA(type, events));
}

/**
 * Get SLA policy for a given agent type.
 */
export function getSLAPolicy(agentType: string): SLAPolicy | undefined {
  return DEFAULT_SLA_POLICIES.find((p) => p.agentType === agentType);
}

/**
 * Format SLA status for display.
 */
export function formatSLAStatus(result: SLAResult): {
  label: string;
  color: string;
  icon: string;
} {
  if (result.metrics.totalCalls === 0) {
    return { label: "No Data", color: "text-slate-500", icon: "⚪" };
  }

  if (!result.compliant) {
    const hasCritical = result.violations.some((v) => v.severity === "critical");
    if (hasCritical) {
      return { label: "Critical", color: "text-red-400", icon: "🔴" };
    }
    return { label: "Warning", color: "text-yellow-400", icon: "🟡" };
  }

  return { label: "Compliant", color: "text-emerald-400", icon: "🟢" };
}
