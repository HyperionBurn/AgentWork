import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// GC6: Playground Events API
// ============================================================
// Returns recent task_events for the playground live feed.
// Called via polling from the Playground page.
// ============================================================

export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({
      events: [],
      note: "Supabase not configured — run orchestrator first",
    });
  }

  // Fetch the most recent 100 task events (covers a full run)
  const { data, error } = await supabase
    .from("task_events")
    .select("id, task_id, agent_type, status, gateway_tx, amount, result, error, reasoning, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { events: [], error: error.message },
      { status: 500 },
    );
  }

  // Reverse to chronological order for the playground
  const events = (data || []).reverse().map((row: Record<string, unknown>) => ({
    id: row.id,
    taskId: row.task_id,
    agentType: row.agent_type,
    status: row.status,
    gatewayTx: row.gateway_tx,
    amount: row.amount,
    result: row.result,
    error: row.error,
    reasoning: row.reasoning,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ events });
}
