import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// GC8: Consumer Spending Dashboard API
// ============================================================
// Aggregates spending data from task_events into a consumer-
// friendly view with per-agent breakdowns and policy checks.
// ============================================================

interface AgentSpending {
  agentType: string;
  totalCalls: number;
  successfulCalls: number;
  totalSpent: number;
  avgCostPerCall: number;
  lastUsed: string | null;
}

interface SpendingPolicy {
  maxPerCall: number;
  dailyLimit: number;
  autoPauseThreshold: number;
}

const DEFAULT_POLICY: SpendingPolicy = {
  maxPerCall: 0.01,         // $0.01 per call
  dailyLimit: 1.0,          // $1.00 per day
  autoPauseThreshold: 0.8,  // 80% of daily limit triggers warning
};

export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({
      totalSpent: 0,
      remainingBudget: DEFAULT_POLICY.dailyLimit,
      policy: DEFAULT_POLICY,
      agents: [],
      budgetUtilization: 0,
    });
  }

  // Fetch all completed task events
  const { data, error } = await supabase
    .from("task_events")
    .select("agent_type, status, amount, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = (data || []) as Array<{
    agent_type: string;
    status: string;
    amount: string | null;
    created_at: string;
  }>;

  // Calculate per-agent spending
  const agentMap = new Map<string, AgentSpending>();

  for (const evt of events) {
    const existing = agentMap.get(evt.agent_type) || {
      agentType: evt.agent_type,
      totalCalls: 0,
      successfulCalls: 0,
      totalSpent: 0,
      avgCostPerCall: 0,
      lastUsed: null as string | null,
    };

    existing.totalCalls += 1;
    if (evt.status === "completed") {
      existing.successfulCalls += 1;
      const amount = parseFloat((evt.amount || "$0.005").replace("$", ""));
      existing.totalSpent += amount;
    }
    if (!existing.lastUsed) {
      existing.lastUsed = evt.created_at;
    }

    agentMap.set(evt.agent_type, existing);
  }

  // Calculate averages
  const agents = Array.from(agentMap.values()).map((a) => ({
    ...a,
    avgCostPerCall: a.successfulCalls > 0 ? a.totalSpent / a.successfulCalls : 0,
  }));

  // Total spending
  const totalSpent = agents.reduce((sum, a) => sum + a.totalSpent, 0);
  const budgetUtilization = (totalSpent / DEFAULT_POLICY.dailyLimit) * 100;
  const remainingBudget = Math.max(0, DEFAULT_POLICY.dailyLimit - totalSpent);

  // Policy warnings
  const warnings: string[] = [];
  if (budgetUtilization >= DEFAULT_POLICY.autoPauseThreshold * 100) {
    warnings.push(`Budget utilization at ${budgetUtilization.toFixed(1)}% — approaching daily limit`);
  }
  for (const agent of agents) {
    if (agent.avgCostPerCall > DEFAULT_POLICY.maxPerCall) {
      warnings.push(`${agent.agentType}: avg cost $${agent.avgCostPerCall.toFixed(4)} exceeds $${DEFAULT_POLICY.maxPerCall} limit`);
    }
  }

  return NextResponse.json({
    totalSpent,
    remainingBudget,
    policy: DEFAULT_POLICY,
    agents,
    budgetUtilization,
    totalCalls: agents.reduce((s, a) => s + a.totalCalls, 0),
    warnings,
  });
}
