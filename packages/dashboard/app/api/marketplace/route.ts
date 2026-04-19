import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Marketplace API — Agent discovery, bidding, and routing.
 * Reads real task completion data from Supabase.
 */

const AGENT_DEFAULTS = [
  { type: "research", name: "Research Agent", price: "$0.005", capabilities: ["web_search", "summarization", "citation", "deep_analysis"], port: 4021 },
  { type: "code", name: "Code Agent", price: "$0.005", capabilities: ["code_generation", "implementation", "refactoring", "debugging"], port: 4022 },
  { type: "test", name: "Test Agent", price: "$0.005", capabilities: ["test_generation", "qa", "coverage", "validation"], port: 4023 },
  { type: "review", name: "Review Agent", price: "$0.005", capabilities: ["code_review", "security_audit", "quality_scoring", "feedback"], port: 4024 },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "list";

  // Build agent list with real stats from Supabase
  const agents = await buildAgentList();

  switch (action) {
    case "list":
      return NextResponse.json({ agents });

    case "bids": {
      const agentType = searchParams.get("agent") || "research";
      const agent = agents.find((a) => a.type === agentType);
      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      const basePrice = parseFloat(agent.price.replace("$", ""));
      const bids = Array.from({ length: 3 }, (_, i) => ({
        bidder: `${agent.type}-bidder-${i + 1}`,
        price: `$${(basePrice * (0.8 + Math.random() * 0.4)).toFixed(4)}`,
        estimatedTime: Math.round(2 + Math.random() * 6),
        reputation: agent.reputation,
        score: Math.round(60 + Math.random() * 40),
      }));

      bids.sort((a, b) => b.score - a.score);
      return NextResponse.json({ bids, winner: bids[0] });
    }

    case "capabilities": {
      const agentType = searchParams.get("agent");
      if (agentType) {
        const agent = agents.find((a) => a.type === agentType);
        return NextResponse.json({
          capabilities: agent?.capabilities || [],
        });
      }
      // All capabilities
      return NextResponse.json({
        capabilities: Object.fromEntries(
          agents.map((a) => [a.type, a.capabilities]),
        ),
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    switch (action) {
      case "route": {
        // Reputation-weighted routing using real data
        const { agentType } = body;
        const agents = await buildAgentList();
        const agent = agents.find((a) => a.type === agentType);
        if (!agent) {
          return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }
        return NextResponse.json({
          routed: agentType,
          reason: `Selected ${agent.name} (rep=${agent.reputation}, price=${agent.price})`,
          score: agent.reputation / 100,
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

async function buildAgentList() {
  const supabase = getSupabase();

  // Start with defaults
  const agents = AGENT_DEFAULTS.map((a) => ({
    ...a,
    reputation: 50,
    tasksCompleted: 0,
    status: "available" as const,
  }));

  if (!supabase) return agents;

  // Query real task counts per agent from Supabase
  const { data } = await supabase
    .from("task_events")
    .select("agent_type, status, amount")
    .eq("status", "completed");

  if (!data || data.length === 0) return agents;

  // Group by agent_type
  const stats = new Map<string, { count: number; totalAmount: number }>();
  for (const row of data) {
    const key = row.agent_type || "unknown";
    const entry = stats.get(key) ?? { count: 0, totalAmount: 0 };
    entry.count += 1;
    entry.totalAmount += parseFloat((row.amount || "0").replace("$", ""));
    stats.set(key, entry);
  }

  // Merge real stats into agent list
  for (const agent of agents) {
    const agentStats = stats.get(agent.type);
    if (agentStats) {
      agent.tasksCompleted = agentStats.count;
      // Reputation based on successful tasks (50 base + up to 50 for activity)
      agent.reputation = Math.min(99, 50 + Math.floor(agentStats.count * 2));
    }
  }

  return agents;
}
