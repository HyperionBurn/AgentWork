"use client";

import { useState, useEffect } from "react";

// ============================================================
// RevenueDashboard — Agent earnings, costs, margins
// ============================================================

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

interface RevenueTotals {
  totalEarned: string;
  totalSpent: string;
  netRevenue: string;
  totalTasks: number;
  avgMargin: string;
}

const agentLabels: Record<string, string> = {
  research: "Research",
  code: "Code",
  test: "Test",
  review: "Review",
};

const agentColors: Record<string, string> = {
  research: "bg-violet-500",
  code: "bg-blue-500",
  test: "bg-emerald-500",
  review: "bg-amber-500",
};

export default function RevenueDashboard() {
  const [revenue, setRevenue] = useState<AgentRevenue[]>([]);
  const [totals, setTotals] = useState<RevenueTotals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRevenue() {
      try {
        const res = await fetch("/api/revenue?action=summary");
        if (res.ok) {
          const data = await res.json();
          setRevenue(data.agents || []);
          setTotals(data.totals || null);
        }
      } catch {
        // Revenue unavailable
      } finally {
        setLoading(false);
      }
    }
    fetchRevenue();
  }, []);

  if (loading) {
    return (
      <div className="bg-arc-card border border-arc-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          💰 Revenue Dashboard
        </h2>
        <div className="text-slate-500 text-sm">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        💰 Revenue Dashboard
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4">
        {/* Summary cards */}
        {totals && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-arc-dark/50">
              <p className="text-xs text-slate-500">Earned</p>
              <p className="text-lg font-bold text-green-400">{totals.totalEarned}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-arc-dark/50">
              <p className="text-xs text-slate-500">Spent</p>
              <p className="text-lg font-bold text-red-400">{totals.totalSpent}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-arc-dark/50">
              <p className="text-xs text-slate-500">Net</p>
              <p className="text-lg font-bold text-arc-purple">{totals.netRevenue}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-arc-dark/50">
              <p className="text-xs text-slate-500">Margin</p>
              <p className="text-lg font-bold text-cyan-400">{totals.avgMargin}</p>
            </div>
          </div>
        )}

        {/* Per-agent breakdown */}
        <div className="space-y-3">
          {revenue.map((agent) => (
            <div key={agent.agentType} className="border border-arc-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${agentColors[agent.agentType] || "bg-slate-500"}`} />
                  <span className="text-sm font-medium text-white">
                    {agentLabels[agent.agentType] || agent.agentType}
                  </span>
                  <span className="text-xs text-slate-500">
                    {agent.tasksCompleted} tasks
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-green-400">
                    +${agent.totalEarned.toFixed(3)}
                  </span>
                  <span className="text-xs text-slate-500 mx-1">/</span>
                  <span className="text-sm text-red-400">
                    -${agent.totalSpent.toFixed(3)}
                  </span>
                </div>
              </div>
              {/* Margin bar */}
              <div className="w-full bg-arc-dark rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-arc-purple to-arc-blue"
                  style={{ width: `${agent.marginPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-500">
                  Margin: {agent.marginPct}%
                </span>
                <span className="text-[10px] text-slate-500">
                  Budget used: {agent.spendingUtilization}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
