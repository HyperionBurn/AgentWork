import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// Agent Identity API Route
// ============================================================
// Returns real agent identity data — wallet addresses from
// env vars and on-chain stats from Supabase.
// ============================================================

const AGENT_TYPES = [
  { type: "research", name: "Research Agent", capabilities: ["web_search", "summarization", "citation", "analysis"] },
  { type: "code", name: "Code Agent", capabilities: ["code_generation", "implementation", "refactoring", "bug_fixing"] },
  { type: "test", name: "Test Agent", capabilities: ["test_generation", "qa", "coverage", "validation"] },
  { type: "review", name: "Review Agent", capabilities: ["code_review", "quality_scoring", "security_audit", "feedback"] },
];

/** Real agent wallet addresses (same as orchestrator uses) */
const AGENT_WALLETS: Record<string, string> = {
  research: process.env.NEXT_PUBLIC_RESEARCH_AGENT_WALLET || "",
  code: process.env.NEXT_PUBLIC_CODE_AGENT_WALLET || "",
  test: process.env.NEXT_PUBLIC_TEST_AGENT_WALLET || "",
  review: process.env.NEXT_PUBLIC_REVIEW_AGENT_WALLET || "",
};

export async function GET() {
  const supabase = getSupabase();

  const identities = await Promise.all(
    AGENT_TYPES.map(async (agent) => {
      const owner = AGENT_WALLETS[agent.type] || null;
      let tasksCompleted = 0;

      if (supabase && owner) {
        const { count } = await supabase
          .from("task_events")
          .select("*", { count: "exact", head: true })
          .eq("agent_type", agent.type)
          .eq("status", "completed");
        tasksCompleted = count || 0;
      }

      return {
        name: agent.name,
        type: agent.type,
        tokenId: null,
        owner,
        capabilities: agent.capabilities,
        registeredAt: new Date().toISOString(),
        tasksCompleted,
        mock: !owner,
      };
    }),
  );

  return NextResponse.json({ identities });
}
