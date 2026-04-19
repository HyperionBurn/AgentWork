"use client";

import { useState, useEffect } from "react";

// ============================================================
// AgentStaking — Staking portal with slash history
// ============================================================

interface StakingAgent {
  agentType: string;
  agentAddress: string;
  stakedAmount: number;
  slashCount: number;
  totalSlashed: number;
  isActive: boolean;
  tier: string;
}

interface StakingSummary {
  totalStaked: string;
  totalSlashed: string;
  insuranceFund: string;
  activeAgents: number;
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

export default function AgentStaking() {
  const [agents, setAgents] = useState<StakingAgent[]>([]);
  const [summary, setSummary] = useState<StakingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStaking() {
      try {
        const res = await fetch("/api/staking");
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents || []);
          setSummary(data.summary || null);
        }
      } catch {
        // Staking data unavailable
      } finally {
        setLoading(false);
      }
    }
    fetchStaking();
  }, []);

  if (loading) {
    return (
      <div className="bg-arc-card border border-arc-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          🔒 Agent Staking
        </h2>
        <div className="text-slate-500 text-sm">Loading staking data...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        🔒 Agent Staking
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4">
        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg bg-arc-dark/50">
              <p className="text-xs text-slate-500">Total Staked</p>
              <p className="text-sm font-bold text-green-400">{summary.totalStaked}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-arc-dark/50">
              <p className="text-xs text-slate-500">Slashed</p>
              <p className="text-sm font-bold text-red-400">{summary.totalSlashed}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-arc-dark/50">
              <p className="text-xs text-slate-500">Insurance</p>
              <p className="text-sm font-bold text-cyan-400">{summary.insuranceFund}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-arc-dark/50">
              <p className="text-xs text-slate-500">Active</p>
              <p className="text-sm font-bold text-arc-purple">{summary.activeAgents}/4</p>
            </div>
          </div>
        )}

        {/* Per-agent stakes */}
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.agentType} className="flex items-center justify-between p-2 rounded-lg bg-arc-dark/30 border border-arc-border/50">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${agentColors[agent.agentType] || "bg-slate-500"}`} />
                <span className="text-sm text-white">{agentLabels[agent.agentType] || agent.agentType}</span>
                {agent.isActive ? (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Active</span>
                ) : (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Inactive</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-green-400">${agent.stakedAmount.toFixed(2)}</span>
                {agent.slashCount > 0 && (
                  <span className="text-xs text-red-400">{agent.slashCount} slash(es)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
