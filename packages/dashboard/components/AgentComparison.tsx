"use client";

import { useState, useEffect } from "react";

// ============================================================
// AgentComparison — Side-by-side agent comparison matrix
// ============================================================

interface AgentComparisonData {
  agentType: string;
  price: number;
  speed: number;
  reputation: number;
  capabilities: number;
  stake: number;
  tasksCompleted: number;
}

const agentLabels: Record<string, string> = {
  research: "Research",
  code: "Code",
  test: "Test",
  review: "Review",
};

function generateComparisonData(): AgentComparisonData[] {
  return [
    { agentType: "research", price: 0.005, speed: 85, reputation: 92, capabilities: 78, stake: 5.0, tasksCompleted: 47 },
    { agentType: "code", price: 0.008, speed: 70, reputation: 88, capabilities: 95, stake: 8.0, tasksCompleted: 63 },
    { agentType: "test", price: 0.004, speed: 90, reputation: 85, capabilities: 82, stake: 5.0, tasksCompleted: 55 },
    { agentType: "review", price: 0.006, speed: 75, reputation: 90, capabilities: 88, stake: 6.0, tasksCompleted: 41 },
  ];
}

function getScoreColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio >= 0.9) return "text-green-400";
  if (ratio >= 0.75) return "text-yellow-400";
  return "text-red-400";
}

export default function AgentComparison() {
  const [data, setData] = useState<AgentComparisonData[]>([]);

  useEffect(() => {
    setData(generateComparisonData());
  }, []);

  if (data.length === 0) return null;

  const metrics = [
    { key: "price" as const, label: "Price/Call", format: (v: number) => `$${v.toFixed(3)}`, best: "lowest" },
    { key: "speed" as const, label: "Speed Score", format: (v: number) => `${v}/100`, best: "highest" },
    { key: "reputation" as const, label: "Reputation", format: (v: number) => `${v}/100`, best: "highest" },
    { key: "capabilities" as const, label: "Capabilities", format: (v: number) => `${v}/100`, best: "highest" },
    { key: "stake" as const, label: "Staked", format: (v: number) => `$${v.toFixed(1)}`, best: "highest" },
    { key: "tasksCompleted" as const, label: "Tasks Done", format: (v: number) => `${v}`, best: "highest" },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        📊 Agent Comparison
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs text-slate-500 pb-2 pr-4">Metric</th>
              {data.map((agent) => (
                <th key={agent.agentType} className="text-center text-xs text-slate-400 pb-2 px-2">
                  {agentLabels[agent.agentType]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => {
              const values = data.map((d) => d[metric.key]);
              const bestVal = metric.best === "lowest" ? Math.min(...values) : Math.max(...values);
              const maxVal = Math.max(...values);

              return (
                <tr key={metric.key} className="border-t border-arc-border/30">
                  <td className="py-2 pr-4 text-xs text-slate-400">{metric.label}</td>
                  {data.map((agent) => {
                    const val = agent[metric.key];
                    const isBest = val === bestVal;
                    return (
                      <td key={agent.agentType} className="py-2 px-2 text-center">
                        <span className={`${isBest ? "font-bold text-green-400" : getScoreColor(val, maxVal)}`}>
                          {metric.format(val)}
                        </span>
                        {isBest && <span className="ml-1 text-xs">🏆</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
