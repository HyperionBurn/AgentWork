"use client";

import { useState, useEffect } from "react";

// ============================================================
// SpendingBudget — Budget controls + spending analytics
// ============================================================

interface SpendingLimit {
  agentType: string;
  maxPerWindow: string;
  current: string;
  utilization: string;
  withinLimit: boolean;
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

export default function SpendingBudget() {
  const [limits, setLimits] = useState<SpendingLimit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpending() {
      try {
        const res = await fetch("/api/revenue?action=spending");
        if (res.ok) {
          const data = await res.json();
          setLimits(data.limits || []);
        }
      } catch {
        // Spending data unavailable
      } finally {
        setLoading(false);
      }
    }
    fetchSpending();
  }, []);

  if (loading) {
    return (
      <div className="bg-arc-card border border-arc-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          🔒 Spending Limits
        </h2>
        <div className="text-slate-500 text-sm">Loading spending data...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        🔒 Spending Limits
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4">
        <div className="space-y-3">
          {limits.map((limit) => {
            const utilNum = parseFloat(limit.utilization);
            const isWarning = utilNum > 70;
            const isCritical = utilNum > 90;

            return (
              <div key={limit.agentType} className="border border-arc-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${agentColors[limit.agentType] || "bg-slate-500"}`} />
                    <span className="text-sm font-medium text-white">
                      {agentLabels[limit.agentType] || limit.agentType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      limit.withinLimit
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {limit.withinLimit ? "✅ within limit" : "⚠️ over limit"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400">Current:</span>
                  <span className="text-xs text-white">{limit.current}</span>
                  <span className="text-xs text-slate-600">/</span>
                  <span className="text-xs text-slate-400">{limit.maxPerWindow}</span>
                </div>
                {/* Utilization bar */}
                <div className="w-full bg-arc-dark rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(100, utilNum)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-500">{limit.utilization} used</span>
                  <span className="text-[10px] text-slate-500">per hour</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-arc-border pt-3 mt-3">
          <p className="text-xs text-slate-400">
            <span className="text-arc-purple font-semibold">SpendingLimiter.vy</span> enforces
            per-agent budgets on-chain. Prevents runaway agent costs.
          </p>
        </div>
      </div>
    </div>
  );
}
