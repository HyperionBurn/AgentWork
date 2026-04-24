"use client";

import { useState, useEffect } from "react";

// ============================================================
// GC8: Consumer Spending Dashboard
// ============================================================
// Consumer-facing dashboard showing cumulative spending,
// per-agent budgets, remaining balance, and configurable
// spending policies (maxPerCall, dailyLimit, autoPauseThreshold).
// ============================================================

interface AgentSpending {
  agentType: string;
  totalCalls: number;
  successfulCalls: number;
  totalSpent: number;
  avgCostPerCall: number;
  lastUsed: string | null;
}

interface SpendingPolicy {
  maxPerCall: number;
  dailyLimit: number;
  autoPauseThreshold: number;
}

interface SpendingData {
  totalSpent: number;
  remainingBudget: number;
  policy: SpendingPolicy;
  agents: AgentSpending[];
  budgetUtilization: number;
  totalCalls: number;
  warnings: string[];
}

const AGENT_COLORS: Record<string, string> = {
  research: "#3b82f6",
  code: "#22c55e",
  test: "#eab308",
  review: "#a855f7",
};

export default function SpendingPage() {
  const [data, setData] = useState<SpendingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpending();
    const interval = setInterval(fetchSpending, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchSpending = async () => {
    try {
      const res = await fetch("/api/spending-dashboard");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arc-bg text-slate-500">
        Loading spending data...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arc-bg text-slate-500">
        No spending data available. Run the orchestrator first.
      </div>
    );
  }

  const budgetPercent = Math.min(data.budgetUtilization, 100);
  const budgetColor = budgetPercent > 80 ? "bg-red-500" : budgetPercent > 50 ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <div className="min-h-screen bg-arc-bg text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">💳 Consumer Spending</h1>
          <p className="mt-2 text-sm text-slate-400">
            Track and control your AI agent spending with configurable policies
            and real-time budget monitoring.
          </p>
        </div>

        {/* Warnings */}
        {data.warnings && data.warnings.length > 0 && (
          <div className="mb-6 space-y-2">
            {data.warnings.map((warning, i) => (
              <div key={i} className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-300">
                ⚠️ {warning}
              </div>
            ))}
          </div>
        )}

        {/* Budget Overview */}
        <div className="mb-6 rounded-lg border border-arc-border bg-arc-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Daily Budget</h2>
              <p className="text-sm text-slate-500">Limit: ${data.policy.dailyLimit.toFixed(2)} USDC/day</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                <span className={budgetPercent > 80 ? "text-red-400" : "text-emerald-400"}>
                  ${data.remainingBudget.toFixed(4)}
                </span>
              </div>
              <p className="text-xs text-slate-500">remaining</p>
            </div>
          </div>

          {/* Budget bar */}
          <div className="h-4 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${budgetColor}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>Spent: ${data.totalSpent.toFixed(4)}</span>
            <span>{budgetPercent.toFixed(1)}% utilized</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-arc-border bg-arc-card p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">${data.totalSpent.toFixed(4)}</div>
            <div className="text-xs text-slate-500">Total Spent</div>
          </div>
          <div className="rounded-lg border border-arc-border bg-arc-card p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{data.totalCalls}</div>
            <div className="text-xs text-slate-500">Total API Calls</div>
          </div>
          <div className="rounded-lg border border-arc-border bg-arc-card p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{data.agents.length}</div>
            <div className="text-xs text-slate-500">Active Agents</div>
          </div>
        </div>

        {/* Per-Agent Breakdown */}
        <div className="mb-6 rounded-lg border border-arc-border bg-arc-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Agent Spending Breakdown</h2>
          <div className="space-y-4">
            {data.agents.map((agent) => {
              const color = AGENT_COLORS[agent.agentType] || "#94a3b8";
              const percentOfTotal = data.totalSpent > 0
                ? (agent.totalSpent / data.totalSpent) * 100
                : 0;

              return (
                <div key={agent.agentType} className="rounded-lg border border-arc-border/50 bg-arc-bg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium">{agent.agentType}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-400">
                        ${agent.totalSpent.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Agent spending bar */}
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(percentOfTotal, 2)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>
                      {agent.successfulCalls}/{agent.totalCalls} calls
                    </span>
                    <span>
                      avg: ${agent.avgCostPerCall.toFixed(4)}/call
                    </span>
                    <span>
                      {agent.lastUsed ? new Date(agent.lastUsed).toLocaleTimeString() : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spending Policy */}
        <div className="rounded-lg border border-arc-border bg-arc-card p-6">
          <h2 className="mb-4 text-lg font-semibold">📋 Spending Policies</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-arc-border/50 bg-arc-bg p-4 text-center">
              <div className="text-xl font-bold text-blue-400">
                ${data.policy.maxPerCall.toFixed(3)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Max Per Call</div>
              <div className="text-[10px] text-slate-600 mt-1">Auto-reject above this</div>
            </div>
            <div className="rounded-lg border border-arc-border/50 bg-arc-bg p-4 text-center">
              <div className="text-xl font-bold text-yellow-400">
                ${data.policy.dailyLimit.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Daily Limit</div>
              <div className="text-[10px] text-slate-600 mt-1">Hard cap per day</div>
            </div>
            <div className="rounded-lg border border-arc-border/50 bg-arc-bg p-4 text-center">
              <div className="text-xl font-bold text-red-400">
                {(data.policy.autoPauseThreshold * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Auto-Pause Threshold</div>
              <div className="text-[10px] text-slate-600 mt-1">Warning at this utilization</div>
            </div>
          </div>
        </div>

        {/* Trust footer */}
        <div className="mt-8 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <p className="text-sm text-emerald-400">
            🔒 All spending enforced on-chain via SpendingLimiter contract on Arc L1.
            Budget overflows are rejected at the protocol level.
          </p>
        </div>
      </div>
    </div>
  );
}
