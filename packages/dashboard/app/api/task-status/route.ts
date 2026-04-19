import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Returns task execution status from Supabase.
 * No payment required (dashboard uses this for the task feed).
 */
export async function GET(req: NextRequest) {
  const supabase = getSupabase();

  if (!supabase) {
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

  const rows = tasks || [];
  const totalTasks = rows.length;
  const completed = rows.filter((t) => t.status === "completed").length;
  const totalSpent =
    rows.reduce((sum, t) => sum + parseFloat((t.amount || "0").replace("$", "")), 0);
  // Only count real on-chain transactions (filter out MOCK_ prefixed hashes)
  const totalTxns =
    rows.filter((t) => t.gateway_tx && !t.gateway_tx.startsWith("MOCK_")).length;

  return NextResponse.json({
    tasks: rows,
    stats: {
      totalTasks,
      completed,
      totalSpent: `$${totalSpent.toFixed(4)}`,
      totalOnChainTransactions: totalTxns,
    },
  });
}
