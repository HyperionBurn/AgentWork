import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// Governance API — Real governance events from Supabase
// ============================================================

interface GovernanceProposal {
  proposalId: string;
  parameter: string;
  currentValue: string;
  newValue: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  state: string;
}

export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({
      proposals: [],
      summary: { total: 0, executed: 0, rejected: 0, active: 0 },
    });
  }

  // Query real governance events from Supabase
  const { data, error } = await supabase
    .from("task_events")
    .select("id, event_type, agent_type, metadata, created_at")
    .eq("event_type", "governance")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data || data.length === 0) {
    return NextResponse.json({
      proposals: [],
      summary: { total: 0, executed: 0, rejected: 0, active: 0 },
    });
  }

  const proposals: GovernanceProposal[] = data.map((row) => {
    const meta = row.metadata || {};
    return {
      proposalId: row.id?.toString() || `proposal_${row.id}`,
      parameter: meta.parameter || "unknown",
      currentValue: meta.currentValue || "—",
      newValue: meta.newValue || "—",
      description: meta.description || "Governance action",
      votesFor: meta.votesFor || 0,
      votesAgainst: meta.votesAgainst || 0,
      state: meta.state || "active",
    };
  });

  const executed = proposals.filter((p) => p.state === "executed").length;
  const rejected = proposals.filter((p) => p.state === "rejected").length;
  const active = proposals.filter((p) => p.state === "active").length;

  return NextResponse.json({
    proposals,
    summary: {
      total: proposals.length,
      executed,
      rejected,
      active,
    },
  });
}
