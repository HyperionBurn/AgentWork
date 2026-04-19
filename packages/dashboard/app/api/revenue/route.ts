import { NextRequest, NextResponse } from "next/server";

/**
 * Revenue Analytics API — Agent earnings, costs, margins.
 * Returns simulated revenue data for demo.
 */

interface AgentRevenue {
  agentType: string;
  totalEarned: number;
  totalSpent: number;
  netRevenue: number;
  marginPct: number;
  tasksCompleted: number;
  avgTaskPrice: number;
  spendingUtilization: number;
}

function generateRevenueData(): AgentRevenue[] {
  return [
    {
      agentType: "research",
      totalEarned: 0.025,
      totalSpent: 0.008,
      netRevenue: 0.017,
      marginPct: 68,
      tasksCompleted: 5,
      avgTaskPrice: 0.005,
      spendingUtilization: 5,
    },
    {
      agentType: "code",
      totalEarned: 0.040,
      totalSpent: 0.012,
      netRevenue: 0.028,
      marginPct: 70,
      tasksCompleted: 5,
      avgTaskPrice: 0.008,
      spendingUtilization: 8,
    },
    {
      agentType: "test",
      totalEarned: 0.020,
      totalSpent: 0.006,
      netRevenue: 0.014,
      marginPct: 70,
      tasksCompleted: 5,
      avgTaskPrice: 0.004,
      spendingUtilization: 4,
    },
    {
      agentType: "review",
      totalEarned: 0.030,
      totalSpent: 0.009,
      netRevenue: 0.021,
      marginPct: 70,
      tasksCompleted: 5,
      avgTaskPrice: 0.006,
      spendingUtilization: 6,
    },
  ];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "summary";

  switch (action) {
    case "summary": {
      const revenue = generateRevenueData();
      const total = revenue.reduce(
        (acc, r) => ({
          earned: acc.earned + r.totalEarned,
          spent: acc.spent + r.totalSpent,
          tasks: acc.tasks + r.tasksCompleted,
        }),
        { earned: 0, spent: 0, tasks: 0 },
      );

      return NextResponse.json({
        agents: revenue,
        totals: {
          totalEarned: `$${total.earned.toFixed(3)}`,
          totalSpent: `$${total.spent.toFixed(3)}`,
          netRevenue: `$${(total.earned - total.spent).toFixed(3)}`,
          totalTasks: total.tasks,
          avgMargin: "69%",
        },
      });
    }

    case "spending": {
      // Spending limit status for each agent
      return NextResponse.json({
        limits: [
          { agentType: "research", maxPerWindow: "$0.50", current: "$0.025", utilization: "5%", withinLimit: true },
          { agentType: "code",     maxPerWindow: "$0.50", current: "$0.040", utilization: "8%", withinLimit: true },
          { agentType: "test",     maxPerWindow: "$0.50", current: "$0.020", utilization: "4%", withinLimit: true },
          { agentType: "review",   maxPerWindow: "$0.50", current: "$0.030", utilization: "6%", withinLimit: true },
        ],
      });
    }

    case "pricing": {
      // Current dynamic pricing quotes
      return NextResponse.json({
        quotes: [
          { agentType: "research", base: "$0.0050", current: "$0.0050", demand: "low", surge: "1.0x" },
          { agentType: "code",     base: "$0.0080", current: "$0.0080", demand: "low", surge: "1.0x" },
          { agentType: "test",     base: "$0.0040", current: "$0.0040", demand: "low", surge: "1.0x" },
          { agentType: "review",   base: "$0.0060", current: "$0.0060", demand: "low", surge: "1.0x" },
        ],
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
