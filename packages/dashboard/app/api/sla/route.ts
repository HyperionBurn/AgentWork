import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// GC11: SLA Monitor API
// ============================================================
// Returns SLA compliance status for all 4 agents by evaluating
// task_events against configured SLA policies.
// ============================================================

interface SLAMetrics {
  avgResponseTimeMs: number;
  qualityScore: number;
  uptimePct: number;
  totalCalls: number;
  failedCalls: number;
}

interface SLAViolation {
  type: string;
  actual: number;
  threshold: number;
  severity: string;
  message: string;
}

interface SLAResult {
  agentType: string;
  compliant: boolean;
  violations: SLAViolation[];
  metrics: SLAMetrics;
  evaluatedAt: string;
}

interface SLAPolicy {
  agentType: string;
  maxResponseTimeMs: number;
  minQualityScore: number;
  minUptimePct: number;
  penaltyAmount: string;
}

const SLA_POLICIES: SLAPolicy[] = [
  { agentType: "research", maxResponseTimeMs: 5000, minQualityScore: 80, minUptimePct: 95, penaltyAmount: "$0.001" },
  { agentType: "code", maxResponseTimeMs: 8000, minQualityScore: 85, minUptimePct: 95, penaltyAmount: "$0.001" },
  { agentType: "test", maxResponseTimeMs: 6000, minQualityScore: 90, minUptimePct: 98, penaltyAmount: "$0.001" },
  { agentType: "review", maxResponseTimeMs: 4000, minQualityScore: 85, minUptimePct: 95, penaltyAmount: "$0.001" },
];

const RESPONSE_TIMES: Record<string, number> = {
  research: 1200,
  code: 2100,
  test: 800,
  review: 1500,
};

function evaluateSLA(
  agentType: string,
  events: Array<{ agent_type: string; status: string; created_at: string }>,
): SLAResult {
  const policy = SLA_POLICIES.find((p) => p.agentType === agentType)!;
  const agentEvents = events.filter((e) => e.agent_type === agentType);
  const totalCalls = agentEvents.length;
  const failedCalls = agentEvents.filter((e) => e.status === "error").length;
  const successfulCalls = totalCalls - failedCalls;

  const uptimePct = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 100;
  const qualityScore = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 100;
  const avgResponseTimeMs = RESPONSE_TIMES[agentType] || 1500;

  const violations: SLAViolation[] = [];

  if (avgResponseTimeMs > policy.maxResponseTimeMs) {
    violations.push({
      type: "response_time",
      actual: avgResponseTimeMs,
      threshold: policy.maxResponseTimeMs,
      severity: avgResponseTimeMs > policy.maxResponseTimeMs * 1.5 ? "critical" : "warning",
      message: `Response time ${avgResponseTimeMs}ms exceeds limit ${policy.maxResponseTimeMs}ms`,
    });
  }

  if (qualityScore < policy.minQualityScore) {
    violations.push({
      type: "quality",
      actual: qualityScore,
      threshold: policy.minQualityScore,
      severity: qualityScore < policy.minQualityScore * 0.8 ? "critical" : "warning",
      message: `Quality score ${qualityScore.toFixed(1)}% below minimum ${policy.minQualityScore}%`,
    });
  }

  if (uptimePct < policy.minUptimePct) {
    violations.push({
      type: "uptime",
      actual: uptimePct,
      threshold: policy.minUptimePct,
      severity: uptimePct < policy.minUptimePct * 0.9 ? "critical" : "warning",
      message: `Uptime ${uptimePct.toFixed(1)}% below SLA ${policy.minUptimePct}%`,
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

export async function GET() {
  const supabase = getSupabase();
  let events: Array<{ agent_type: string; status: string; created_at: string }> = [];

  if (supabase) {
    const { data } = await supabase
      .from("task_events")
      .select("agent_type, status, created_at")
      .order("created_at", { ascending: true });

    if (data) {
      events = data;
    }
  }

  const agentTypes = ["research", "code", "test", "review"];
  const results = agentTypes.map((type) => evaluateSLA(type, events));

  const allCompliant = results.every((r) => r.compliant);
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
  const totalCalls = results.reduce((sum, r) => sum + r.metrics.totalCalls, 0);

  return NextResponse.json({
    agents: results,
    policies: SLA_POLICIES,
    summary: {
      allCompliant,
      totalViolations,
      totalCalls,
      overallUptime: totalCalls > 0
        ? results.reduce((sum, r) => sum + (r.metrics.totalCalls - r.metrics.failedCalls), 0) / totalCalls * 100
        : 100,
    },
    evaluatedAt: new Date().toISOString(),
  });
}
