"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
// HF-9: Task DAG Visualization
// Shows the orchestrator's task decomposition as a directed
// acyclic graph with animated node traversal.
// ============================================================

interface DAGNode {
  id: string;
  agentType: string;
  status: "pending" | "running" | "completed" | "failed";
  input: string;
  output?: string;
  cost: string;
  txHash?: string;
}

interface DAGEdge {
  from: string;
  to: string;
}

interface TaskDAG {
  nodes: DAGNode[];
  edges: DAGEdge[];
  taskId: string;
  createdAt: string;
}

const AGENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  research: { bg: "bg-violet-500/20", border: "border-violet-500", text: "text-violet-300" },
  code:     { bg: "bg-blue-500/20",    border: "border-blue-500",    text: "text-blue-300" },
  test:     { bg: "bg-emerald-500/20", border: "border-emerald-500", text: "text-emerald-300" },
  review:   { bg: "bg-amber-500/20",   border: "border-amber-500",   text: "text-amber-300" },
};

const STATUS_ICONS: Record<string, string> = {
  pending:   "⏳",
  running:   "⚡",
  completed: "✅",
  failed:    "❌",
};

export function TaskDAGVisualization() {
  const [dag, setDag] = useState<TaskDAG | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDAG = useCallback(async () => {
    try {
      const res = await fetch("/api/task-dag");
      if (res.ok) {
        const data = await res.json();
        if (data.dag) {
          setDag(data.dag);
        }
      }
    } catch {
      // Silently ignore — non-critical feature
    }
  }, []);

  useEffect(() => {
    fetchDAG();
    const interval = setInterval(fetchDAG, 5000);
    return () => clearInterval(interval);
  }, [fetchDAG]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchDAG();
    setLoading(false);
  };

  if (!dag) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-2">🔀 Task Pipeline</h3>
        <p className="text-gray-400 text-sm">
          Run a demo to see the task decomposition DAG appear here.
        </p>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="mt-3 px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Loading…" : "🔄 Refresh"}
        </button>
      </div>
    );
  }

  // Position nodes in a left-to-right flow
  const nodeOrder = dag.nodes.map((n) => n.id);
  const positions = new Map<string, { x: number; y: number }>();
  const yStep = 100;
  const xStep = 0;

  // Simple linear layout for now (each agent in sequence)
  dag.nodes.forEach((node, i) => {
    positions.set(node.id, { x: xStep, y: i * yStep });
  });

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">🔀 Task Pipeline</h3>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>Task: {dag.taskId.slice(0, 8)}…</span>
          <span>{new Date(dag.createdAt).toLocaleTimeString()}</span>
          <button
            onClick={handleRefresh}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Node list as vertical pipeline */}
      <div className="space-y-3">
        {dag.nodes.map((node, i) => {
          const colors = AGENT_COLORS[node.agentType] ?? AGENT_COLORS.research;
          const icon = STATUS_ICONS[node.status] ?? "⏳";
          const isLast = i === dag.nodes.length - 1;

          return (
            <div key={node.id}>
              <div
                className={`
                  relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                  ${colors.border} ${colors.bg}
                  ${node.status === "running" ? "animate-pulse" : ""}
                `}
              >
                {/* Agent icon + status */}
                <div className="flex-shrink-0 text-2xl">{icon}</div>

                {/* Agent info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${colors.text}`}>
                      {node.agentType.charAt(0).toUpperCase() + node.agentType.slice(1)} Agent
                    </span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-gray-400 text-xs">{node.cost}</span>
                  </div>
                  <p className="text-gray-300 text-xs truncate mt-0.5">{node.input}</p>
                  {node.output && (
                    <p className="text-gray-400 text-xs truncate mt-0.5">
                      → {node.output.slice(0, 80)}…
                    </p>
                  )}
                  {node.txHash && (
                    <a
                      href={`https://testnet.arcscan.io/tx/${node.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 mt-0.5 inline-block"
                    >
                      🔗 View on Arc
                    </a>
                  )}
                </div>
              </div>

              {/* Connector arrow */}
              {!isLast && (
                <div className="flex justify-center py-1">
                  <div className="w-0.5 h-3 bg-gray-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400 border-t border-gray-700 pt-3">
        <span>Nodes: {dag.nodes.length}</span>
        <span>Completed: {dag.nodes.filter((n) => n.status === "completed").length}</span>
        <span>
          Total:{" "}
          {dag.nodes.reduce((sum, n) => sum + parseFloat(n.cost.replace("$", "")), 0).toFixed(3)}
        </span>
      </div>
    </div>
  );
}
