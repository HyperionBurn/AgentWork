"use client";

import { useState, useEffect } from "react";

// ============================================================
// GovernancePanel — On-chain governance proposals
// ============================================================

interface Proposal {
  proposalId: string;
  parameter: string;
  currentValue: string;
  newValue: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  state: string;
}

const stateColors: Record<string, string> = {
  active: "text-blue-400 bg-blue-500/10",
  passed: "text-yellow-400 bg-yellow-500/10",
  executed: "text-green-400 bg-green-500/10",
  rejected: "text-red-400 bg-red-500/10",
  pending: "text-slate-400 bg-slate-500/10",
};

export default function GovernancePanel() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGovernance() {
      try {
        const res = await fetch("/api/governance");
        if (res.ok) {
          const data = await res.json();
          setProposals(data.proposals || []);
        }
      } catch {
        // Governance data unavailable
      } finally {
        setLoading(false);
      }
    }
    fetchGovernance();
  }, []);

  if (loading) {
    return (
      <div className="bg-arc-card border border-arc-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          ⚖️ Governance
        </h2>
        <div className="text-slate-500 text-sm">Loading proposals...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        ⚖️ Governance
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4">
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <div key={proposal.proposalId} className="p-3 rounded-lg bg-arc-dark/30 border border-arc-border/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-slate-500">{proposal.proposalId}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${stateColors[proposal.state] || "text-slate-400"}`}>
                  {proposal.state}
                </span>
              </div>
              <p className="text-sm text-white mb-1">{proposal.description}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{proposal.parameter}:</span>
                <span className="text-red-400">{proposal.currentValue}</span>
                <span>→</span>
                <span className="text-green-400">{proposal.newValue}</span>
              </div>
              {/* Vote bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-arc-dark overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-green-400">{proposal.votesFor}</span>
                <span className="text-xs text-slate-600">/</span>
                <span className="text-xs text-red-400">{proposal.votesAgainst}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
