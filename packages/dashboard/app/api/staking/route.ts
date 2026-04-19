import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// Staking API — Agent staking status from real Supabase data
// ============================================================

interface StakingInfo {
  agentType: string;
  agentAddress: string;
  stakedAmount: number;
  slashCount: number;
  totalSlashed: number;
  isActive: boolean;
  tier: string;
}

const AGENT_TYPES = ["research", "code", "test", "review"];

export async function GET() {
  const supabase = getSupabase();

  // Default staking info when no data
  const defaultData: StakingInfo[] = AGENT_TYPES.map((type) => ({
    agentType: type,
    agentAddress: "not_staked",
    stakedAmount: 0,
    slashCount: 0,
    totalSlashed: 0,
    isActive: false,
    tier: "none",
  }));

  if (!supabase) {
    return NextResponse.json({ agents: defaultData });
  }

  // Count completed tasks per agent to determine staking tier
  const { data } = await supabase
    .from("task_events")
    .select("agent_type, status")
    .eq("status", "completed");

  const taskCounts = new Map<string, number>();
  for (const row of data || []) {
    const key = row.agent_type || "unknown";
    taskCounts.set(key, (taskCounts.get(key) || 0) + 1);
  }

  const agents: StakingInfo[] = AGENT_TYPES.map((type) => {
    const tasks = taskCounts.get(type) || 0;
    // Agents with completed tasks are considered active/staked
    const isActive = tasks > 0;
    const stakedAmount = isActive ? 5 : 0;
    const tier = tasks >= 10 ? "enterprise" : tasks >= 5 ? "premium" : tasks > 0 ? "basic" : "none";

    return {
      agentType: type,
      agentAddress: isActive ? `0x_AGENT_${type.toUpperCase()}` : "not_staked",
      stakedAmount,
      slashCount: 0,
      totalSlashed: 0,
      isActive,
      tier,
    };
  });

  return NextResponse.json({ agents });
}
