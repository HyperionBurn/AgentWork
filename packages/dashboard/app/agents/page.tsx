"use client";

import { useState, useEffect } from "react";
import AgentCard from "@/components/AgentCard";
import { AgentRegistry } from "@/components/AgentRegistry";
import { TaskDAGVisualization } from "@/components/TaskDAGVisualization";
import { AgentChat } from "@/components/AgentChat";
import AgentComparison from "@/components/AgentComparison";
import SLAMonitor from "@/components/SLAMonitor";

// ============================================================
// Agent Hub — Independent sub-page with own data fetching
// Critic C1: NO shared global state, all data fetched here
// ============================================================

interface AgentInfo {
  name: string;
  type: string;
  port: number;
  status: "online" | "offline";
  earnings: number;
  tasksCompleted: number;
  description: string;
}

interface AgentMetrics {
  tasksCompleted: number;
  totalEarnings: number;
  successRate: string;
}

const AGENTS: AgentInfo[] = [
  {
    name: "Research Agent",
    type: "research",
    port: 4021,
    status: "offline" as const,
    earnings: 0,
    tasksCompleted: 0,
    description: "Deep research, information synthesis, citation",
  },
  {
    name: "Code Agent",
    type: "code",
    port: 4022,
    status: "offline" as const,
    earnings: 0,
    tasksCompleted: 0,
    description: "Code generation, implementation, refactoring",
  },
  {
    name: "Test Agent",
    type: "test",
    port: 4023,
    status: "offline" as const,
    earnings: 0,
    tasksCompleted: 0,
    description: "Test suite generation, quality assurance",
  },
  {
    name: "Review Agent",
    type: "review",
    port: 4024,
    status: "offline" as const,
    earnings: 0,
    tasksCompleted: 0,
    description: "Code review, quality scoring, feedback",
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentInfo[]>(AGENTS);
  const [agentMetrics, setAgentMetrics] = useState<
    Record<string, AgentMetrics>
  >({});
  const [connected, setConnected] = useState(false);

  // ── Independent data fetching (Critic C1) ──────────────
  useEffect(() => {
    const checkAgents = async () => {
      try {
        const res = await fetch("/api/agent-health");
        if (res.ok) {
          const data = await res.json();
          setAgents((prev) =>
            prev.map((a) => {
              const health = data.agents?.[a.type];
              if (health) {
                return {
                  ...a,
                  status: health.status === "online" ? "online" as const : "offline" as const,
                  earnings: health.earnings ?? a.earnings,
                  tasksCompleted: health.tasksCompleted ?? a.tasksCompleted,
                };
              }
              return a;
            })
          );
          setConnected(true);
        } else {
          setConnected(false);
        }
      } catch {
        setConnected(false);
      }
    };

    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/agent-metrics");
        if (res.ok) {
          const data = await res.json();
          const metricsMap: Record<string, AgentMetrics> = {};
          if (data.metrics && typeof data.metrics === "object") {
            for (const [key, val] of Object.entries(data.metrics)) {
              const m = val as Record<string, unknown>;
              metricsMap[key] = {
                tasksCompleted:
                  typeof m.tasksCompleted === "number"
                    ? m.tasksCompleted
                    : 0,
                totalEarnings:
                  typeof m.totalEarnings === "number"
                    ? m.totalEarnings
                    : 0,
                successRate:
                  typeof m.successRate === "string"
                    ? m.successRate
                    : "—",
              };
            }
          }
          setAgentMetrics(metricsMap);
        }
      } catch {
        // Metrics unavailable — keep defaults
      }
    };

    checkAgents();
    fetchMetrics();

    const interval = setInterval(() => {
      checkAgents();
      fetchMetrics();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // ── Registry-compatible agent list ─────────────────────
  const registryAgents = agents.map((a) => ({
    type: a.type,
    label: a.name,
    status: a.status,
    port: a.port,
  }));

  return (
    <div className="min-h-screen bg-arc-dark text-white p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold">🤖 Agent Hub</h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor, compare, and interact with specialist AI agents
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-400" : "bg-slate-500"
            }`}
          />
          <span className="text-xs text-slate-500">
            {connected ? "Connected to agents" : "Agents offline — showing defaults"}
          </span>
        </div>
      </div>

      {/* ── Main Grid: Agent Cards + DAG / Chat ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Agent cards stacked */}
        <div className="space-y-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.type}
              agent={agent}
              metrics={agentMetrics[agent.type] ?? null}
            />
          ))}
        </div>

        {/* Right column: DAG + Chat stacked */}
        <div className="space-y-4">
          <TaskDAGVisualization />
          <AgentChat />
        </div>
      </div>

      {/* ── Full-width sections below ───────────────────── */}
      <AgentRegistry agents={registryAgents} />

      <AgentComparison />

      {/* GC11: SLA Monitor */}
      <SLAMonitor />
    </div>
  );
}
