"use client";

import { useState } from "react";

// ============================================================
// TaskTemplates — Pre-built task template library
// ============================================================

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  agentChain: string[];
  estimatedCost: string;
  estimatedTime: string;
  complexity: "low" | "medium" | "high";
}

const TEMPLATES: TaskTemplate[] = [
  {
    id: "rest-api",
    name: "Build REST API",
    description: "Full-stack REST API with authentication, CRUD endpoints, and unit tests",
    agentChain: ["research", "code", "test", "review"],
    estimatedCost: "$0.023",
    estimatedTime: "~45s",
    complexity: "high",
  },
  {
    id: "write-tests",
    name: "Write Tests",
    description: "Generate comprehensive test suite for existing code",
    agentChain: ["test", "review"],
    estimatedCost: "$0.010",
    estimatedTime: "~25s",
    complexity: "medium",
  },
  {
    id: "security-audit",
    name: "Security Audit",
    description: "Deep security analysis with vulnerability scanning",
    agentChain: ["research", "review", "test"],
    estimatedCost: "$0.016",
    estimatedTime: "~35s",
    complexity: "high",
  },
  {
    id: "research-report",
    name: "Research Report",
    description: "Deep research with citations and analysis",
    agentChain: ["research", "review"],
    estimatedCost: "$0.011",
    estimatedTime: "~20s",
    complexity: "medium",
  },
  {
    id: "code-review",
    name: "Code Review",
    description: "Thorough code review with quality scoring",
    agentChain: ["review"],
    estimatedCost: "$0.006",
    estimatedTime: "~15s",
    complexity: "low",
  },
  {
    id: "full-pipeline",
    name: "Full Pipeline",
    description: "Research → Code → Test → Review end-to-end",
    agentChain: ["research", "code", "test", "review"],
    estimatedCost: "$0.023",
    estimatedTime: "~50s",
    complexity: "high",
  },
  {
    id: "documentation",
    name: "Documentation",
    description: "Auto-generate docs from code with examples",
    agentChain: ["research", "code"],
    estimatedCost: "$0.013",
    estimatedTime: "~20s",
    complexity: "low",
  },
];

const complexityColors: Record<string, string> = {
  low: "text-green-400 bg-green-500/10",
  medium: "text-yellow-400 bg-yellow-500/10",
  high: "text-red-400 bg-red-500/10",
};

export default function TaskTemplates() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        📋 Task Templates
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4">
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelected(selected === template.id ? null : template.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selected === template.id
                  ? "border-arc-purple bg-arc-purple/10"
                  : "border-arc-border/50 bg-arc-dark/30 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{template.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${complexityColors[template.complexity]}`}>
                    {template.complexity}
                  </span>
                  <span className="text-xs text-arc-purple font-bold">{template.estimatedCost}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">{template.description}</p>
              {selected === template.id && (
                <div className="mt-2 pt-2 border-t border-arc-border/30">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Chain: {template.agentChain.join(" → ")}</span>
                    <span>•</span>
                    <span>Time: {template.estimatedTime}</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
