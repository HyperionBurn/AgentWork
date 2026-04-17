import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Free endpoint — returns task execution status.
 * No payment required (dashboard uses this for the task feed).
 */
export async function GET(req: NextRequest) {
  const supabase = getSupabase();

  if (!supabase) {
    // Supabase not configured — return empty state (degraded mode)
    return NextResponse.json({
      tasks: [],
      stats: { totalTasks: 0, completed: 0, totalSpent: "$0.0000", totalOnChainTransactions: 0 },
    });
  }

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  let query = supabase
    .from("task_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (taskId) {
    query = query.eq("task_id", taskId);
  }

  const { data: tasks, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate stats
  const totalTasks = tasks?.length || 0;
  const completed = tasks?.filter((t) => t.status === "completed").length || 0;
  const totalSpent =
    tasks?.reduce((sum, t) => sum + parseFloat((t.amount || "0").replace("$", "")), 0) || 0;
  // Only count real on-chain transactions (filter out MOCK_ prefixed hashes)
  const totalTxns =
    tasks?.filter((t) => t.gateway_tx && !t.gateway_tx.startsWith("MOCK_")).length || 0;

  return NextResponse.json({
    tasks: tasks || [],
    stats: {
      totalTasks,
      completed,
      totalSpent: `$${totalSpent.toFixed(4)}`,
      totalOnChainTransactions: totalTxns,
    },
  });
}
