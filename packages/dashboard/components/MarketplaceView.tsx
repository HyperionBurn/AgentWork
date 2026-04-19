"use client";

import { useState, useEffect } from "react";

// ============================================================
// MarketplaceView — Browse agents, see bids, discover capabilities
// ============================================================

interface MarketplaceAgent {
  type: string;
  name: string;
  price: string;
  capabilities: string[];
  reputation: number;
  tasksCompleted: number;
  status: string;
}

interface BidInfo {
  bidder: string;
  price: string;
  estimatedTime: number;
  reputation: number;
  score: number;
}

const agentGradients: Record<string, string> = {
  research: "from-violet-500 to-purple-600",
  code: "from-blue-500 to-cyan-500",
  test: "from-emerald-500 to-green-600",
  review: "from-amber-500 to-orange-500",
};

export default function MarketplaceView() {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [bids, setBids] = useState<BidInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/marketplace?action=list");
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents || []);
        }
      } catch {
        // Use fallback
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  async function fetchBids(agentType: string) {
    setSelectedAgent(agentType);
    try {
      const res = await fetch(`/api/marketplace?action=bids&agent=${agentType}`);
      if (res.ok) {
        const data = await res.json();
        setBids(data.bids || []);
      }
    } catch {
      setBids([]);
    }
  }

  if (loading) {
    return (
      <div className="bg-arc-card border border-arc-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          🏪 Agent Marketplace
        </h2>
        <div className="text-slate-500 text-sm">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        🏪 Agent Marketplace
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4">
        {/* Agent cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {agents.map((agent) => (
            <button
              key={agent.type}
              onClick={() => fetchBids(agent.type)}
              className={`text-left p-3 rounded-lg border transition-colors ${
                selectedAgent === agent.type
                  ? "border-arc-purple bg-arc-purple/10"
                  : "border-arc-border hover:border-arc-purple/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-6 h-6 rounded bg-gradient-to-br ${agentGradients[agent.type] || "from-slate-500 to-slate-600"} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {agent.name[0]}
                </div>
                <span className="text-sm font-medium text-white">{agent.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-green-400">{agent.price}/call</span>
                <span>⭐ {agent.reputation}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {agent.capabilities.slice(0, 3).map((cap) => (
                  <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                    {cap.replace("_", " ")}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Bidding panel */}
        {selectedAgent && bids.length > 0 && (
          <div className="border-t border-arc-border pt-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Competitive Bids — {selectedAgent}
            </h3>
            <div className="space-y-2">
              {bids.map((bid, i) => (
                <div
                  key={bid.bidder}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                    i === 0 ? "bg-green-500/10 border border-green-500/20" : "bg-arc-dark/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={i === 0 ? "text-green-400" : "text-slate-400"}>
                      {i === 0 ? "🏆" : `#${i + 1}`}
                    </span>
                    <span className="text-slate-300">{bid.bidder}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">{bid.price}</span>
                    <span className="text-slate-500">{bid.estimatedTime}s</span>
                    <span className="text-slate-500">⭐ {bid.reputation}</span>
                    <span className={i === 0 ? "text-green-400 font-medium" : "text-slate-500"}>
                      Score: {bid.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
