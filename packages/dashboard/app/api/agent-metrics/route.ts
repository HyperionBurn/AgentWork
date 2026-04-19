import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// Agent Performance Metrics API (HF-6)
// ============================================================
// FREE internal endpoint — no withGateway payment required.
// Aggregates per-agent metrics from task_events table.
// M2: No response time metric (no started_at schema migration).
// ============================================================

export interface AgentMetric {
  agentType: string;
  tasksCompleted: number;
  tasksTotal: number;
  totalEarnings: number;
  successRate: string;
}

export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({ metrics: [] });
  }

  const { data: tasks, error } = await supabase
    .from("task_events")
    .select("agent_type, status, amount");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ metrics: [] });
  }

  // Group by agent_type
  const grouped = new Map<string, { completed: number; total: number; earnings: number }>();

  for (const task of tasks) {
    const type = task.agent_type || "unknown";
    const existing = grouped.get(type) || { completed: 0, total: 0, earnings: 0 };
    existing.total += 1;
    if (task.status === "completed") {
      existing.completed += 1;
      existing.earnings += parseFloat((task.amount || "0").replace("$", ""));
    }
    grouped.set(type, existing);
  }

  const metrics: AgentMetric[] = Array.from(grouped.entries()).map(([agentType, data]) => ({
    agentType,
    tasksCompleted: data.completed,
    tasksTotal: data.total,
    totalEarnings: data.earnings,
    successRate: data.total > 0
      ? ((data.completed / data.total) * 100).toFixed(0)
      : "0",
  }));

  return NextResponse.json({ metrics });
}
