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

  // Fallback: derive from task_events
  const { data: tasks } = await supabase
    .from("task_events")
    .select("amount")
    .eq("status", "completed");

  const totalSpent = (tasks || []).reduce(
    (sum, t) => sum + parseFloat((t.amount || "0").replace("$", "")),
    0
  );
  // Assume 1 USDC deposited if we have any activity
  const deposited = totalSpent > 0 ? 1.0 : 0;
  const remaining = Math.max(0, deposited - totalSpent);

  return NextResponse.json({
    balance: `$${remaining.toFixed(4)}`,
    deposited: `$${deposited.toFixed(4)}`,
    spent: `$${totalSpent.toFixed(4)}`,
  });
}
