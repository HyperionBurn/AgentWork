import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({
      balance: "$0.0000",
      deposited: "$0.0000",
      spent: "$0.0000",
    });
  }

  // Try reading from gateway_state table (written by orchestrator)
  const { data } = await supabase
    .from("gateway_state")
    .select("*")
    .eq("id", "default")
    .single();

  if (data) {
    return NextResponse.json({
      balance: data.balance || "$0.0000",
      deposited: data.deposited || "$0.0000",
      spent: data.spent || "$0.0000",
    });
  }

  // Fallback: derive from task_events (orchestrator writes here)
  const { data: tasks } = await supabase
    .from("task_events")
    .select("amount, status")
    .order("created_at", { ascending: false })
    .limit(500);

  const completed = (tasks || []).filter((t: { status: string }) => t.status === "completed");
  const totalSpent = completed.reduce(
    (sum: number, t: { amount: string }) => sum + parseFloat((t.amount || "0").replace("$", "")),
    0,
  );

  return NextResponse.json({
    balance: "—",
    deposited: `$${totalSpent.toFixed(4)}`,
    spent: `$${totalSpent.toFixed(4)}`,
    transactions: completed.length,
    note: "Balance requires live gateway connection; spent/txns derived from on-chain task_events",
  });
}
