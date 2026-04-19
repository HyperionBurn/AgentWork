"use client";

import { useState, useEffect } from "react";

// ============================================================
// TierSelector — Agent subscription tier picker
// ============================================================

interface TierOption {
  level: string;
  label: string;
  multiplier: number;
  rateLimit: number;
  capabilities: string[];
  color: string;
}

const TIERS: TierOption[] = [
  {
    level: "basic",
    label: "Basic",
    multiplier: 1.0,
    rateLimit: 10,
    capabilities: ["Standard tasks"],
    color: "border-slate-500",
  },
  {
    level: "premium",
    label: "Premium",
    multiplier: 4.0,
    rateLimit: 30,
    capabilities: ["Priority routing", "Advanced capabilities", "Context memory"],
    color: "border-arc-purple",
  },
  {
    level: "enterprise",
    label: "Enterprise",
    multiplier: 10.0,
    rateLimit: 100,
    capabilities: ["Dedicated agent", "SLA guarantees", "Custom models", "Priority + Advanced"],
    color: "border-yellow-500",
  },
];

const BASE_PRICE = 0.005;

export default function TierSelector() {
  const [selectedTier, setSelectedTier] = useState("basic");

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        🏷️ Subscription Tiers
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4">
        <div className="grid grid-cols-3 gap-3">
          {TIERS.map((tier) => (
            <button
              key={tier.level}
              onClick={() => setSelectedTier(tier.level)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedTier === tier.level
                  ? `${tier.color} bg-arc-dark/80 shadow-lg`
                  : "border-arc-border bg-arc-dark/30 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white">{tier.label}</span>
                {selectedTier === tier.level && (
                  <span className="text-xs text-green-400">✓ Active</span>
                )}
              </div>
              <div className="text-lg font-bold text-arc-purple">
                ${(BASE_PRICE * tier.multiplier).toFixed(3)}
                <span className="text-xs text-slate-500">/call</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {tier.rateLimit} calls/min
              </div>
              <div className="mt-2 space-y-0.5">
                {tier.capabilities.map((cap) => (
                  <div key={cap} className="text-xs text-slate-400">
                    • {cap}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
