import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// Transaction Evidence API (HF-5)
// ============================================================
// Returns only REAL on-chain transactions (filters MOCK_ hashes).
// Supports filtering by agent type, status, and date range.
// ============================================================

export async function GET(req: NextRequest) {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({
      transactions: [],
      summary: { total: 0, totalAmount: 0, agents: [], timeRange: null },
    });
  }

  const { searchParams } = new URL(req.url);
  const agent = searchParams.get("agent");
  const status = searchParams.get("status");
  const from = searchParams.get("from");

  let query = supabase
    .from("task_events")
    .select("id, task_id, agent_type, status, gateway_tx, amount, created_at, result")
    .order("created_at", { ascending: false })
    .limit(500);

  // Filter: only real on-chain transactions (no MOCK_ hashes)
  query = query.not("gateway_tx", "is", null);

  if (agent) {
    query = query.eq("agent_type", agent);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (from) {
    query = query.gte("created_at", from);
  }

  const { data: tasks, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out MOCK_ transactions client-side (extra safety)
  const realTxns = (tasks || []).filter(
    (t: { gateway_tx: string | null }) => t.gateway_tx && !t.gateway_tx.startsWith("MOCK_"),
  );

  // Compute summary statistics
  const totalAmount = realTxns.reduce(
    (sum: number, t: { amount: string }) => sum + parseFloat((t.amount || "0").replace("$", "")),
    0,
  );
  const agents = [...new Set(realTxns.map((t: { agent_type: string }) => t.agent_type))];
  const timestamps = realTxns.map((t: { created_at: string }) => t.created_at).filter(Boolean);
  const timeRange = timestamps.length >= 2
    ? { earliest: timestamps[timestamps.length - 1], latest: timestamps[0] }
    : timestamps.length === 1
      ? { earliest: timestamps[0], latest: timestamps[0] }
      : null;

  return NextResponse.json({
    transactions: realTxns,
    summary: {
      total: realTxns.length,
      totalAmount,
      agents,
      timeRange,
    },
  });
}
