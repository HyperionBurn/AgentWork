"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TaskFeed from "@/components/TaskFeed";
import AgentCard from "@/components/AgentCard";
import TxList from "@/components/TxList";
import EconomicChart from "@/components/EconomicChart";
import { subscribeToTasks } from "@/lib/supabase";

// ============================================================
// Types
// ============================================================

interface TaskEvent {
  id: string;
  task_id: string;
  agent_type: string;
  status: "pending" | "paying" | "completed" | "failed";
  gateway_tx: string | null;
  amount: string;
  result: string | null;
  error: string | null;
  created_at: string;
}

interface AgentInfo {
  name: string;
  type: string;
  port: number;
  status: "online" | "offline";
  earnings: number;
  tasksCompleted: number;
  description: string;
}

// ============================================================
// Static agent definitions
// ============================================================

const AGENTS: AgentInfo[] = [
  {
    name: "Research Agent",
    type: "research",
    port: 4021,
    status: "offline",
    earnings: 0,
    tasksCompleted: 0,
    description: "Deep research, information synthesis, citation",
  },
  {
    name: "Code Agent",
    type: "code",
    port: 4022,
    status: "offline",
    earnings: 0,
    tasksCompleted: 0,
    description: "Code generation, implementation, refactoring",
  },
  {
    name: "Test Agent",
    type: "test",
    port: 4023,
    status: "offline",
    earnings: 0,
    tasksCompleted: 0,
    description: "Test suite generation, quality assurance",
  },
  {
    name: "Review Agent",
    type: "review",
    port: 4024,
    status: "offline",
    earnings: 0,
    tasksCompleted: 0,
    description: "Code review, quality scoring, feedback",
  },
];

// ============================================================
// Main Page
// ============================================================

export default function Dashboard() {
  const [tasks, setTasks] = useState<TaskEvent[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>(AGENTS);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completed: 0,
    totalSpent: "$0.0000",
    totalOnChainTransactions: 0,
  });
  const [connected, setConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<"connecting" | "live" | "polling">("connecting");
  const [gatewayBalance, setGatewayBalance] = useState({ balance: "$0.0000", deposited: "$0.0000", spent: "$0.0000" });
  const channelRef = useRef<ReturnType<typeof subscribeToTasks>>(null);

  // Derive transactions from task events for TxList
  // (task_events with gateway_tx are on-chain payment records)
  const transactions = tasks
    .filter((t) => t.gateway_tx)
    .map((t) => ({
      id: t.id,
      gateway_tx: t.gateway_tx!,
      amount: t.amount,
      endpoint: `${t.agent_type} agent`,
      created_at: t.created_at,
    }));

  // Fetch task status on mount and poll
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/task-status");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setStats(data.stats);
      }
    } catch {
      // Dashboard works in degraded mode without backend
    }
  }, []);

  // Fetch gateway balance
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/gateway-balance");
      if (res.ok) {
        const data = await res.json();
        setGatewayBalance(data);
      }
    } catch {
      // Balance API unavailable
    }
  }, []);

  // Check agent health via server-side proxy (avoids Docker DNS issues in browser)
  const checkAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agent-health");
      if (res.ok) {
        const data = await res.json();
        const healthAgents: Array<{ type: string; status: string; description: string; name: string; port: number }> = data.agents;
        const updated = AGENTS.map((agent) => {
          const health = healthAgents.find((h) => h.type === agent.type);
          return {
            ...agent,
            status: (health?.status === "online" ? "online" : "offline") as "online" | "offline",
            description: health?.description || agent.description,
          };
        });
        setAgents(updated);
        setConnected(updated.some((a) => a.status === "online"));
      }
    } catch {
      // Health proxy unavailable
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    checkAgents();
    fetchBalance();

    // Attempt Supabase Realtime subscription
    let taskInterval: ReturnType<typeof setInterval> | null = null;

    try {
      const channel = subscribeToTasks((_event) => {
        // New task INSERT received — refresh data
        fetchTasks();
        fetchBalance();
      });
      channelRef.current = channel;

      if (channel) {
        setConnectionMode("live");
      } else {
        // No Supabase client available — fall back to polling
        setConnectionMode("polling");
        taskInterval = setInterval(fetchTasks, 3000);
      }
    } catch {
      // Realtime subscription failed — fall back to polling
      setConnectionMode("polling");
      taskInterval = setInterval(fetchTasks, 3000);
    }

    const agentInterval = setInterval(checkAgents, 10000);
    const balanceInterval = setInterval(fetchBalance, 10000);

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (taskInterval) clearInterval(taskInterval);
      clearInterval(agentInterval);
      clearInterval(balanceInterval);
    };
  }, [fetchTasks, checkAgents, fetchBalance]);

  const onlineCount = agents.filter((a) => a.status === "online").length;

  const modeColor =
    connectionMode === "live" ? "text-green-400" : connectionMode === "polling" ? "text-yellow-400" : "text-slate-500";
  const modeDot =
    connectionMode === "live" ? "bg-green-400" : connectionMode === "polling" ? "bg-yellow-400" : "bg-slate-500";
  const modeLabel = connectionMode === "connecting" ? "Connecting..." : connectionMode === "live" ? "Live" : "Polling";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-arc-border bg-arc-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arc-purple to-arc-blue flex items-center justify-center font-bold text-sm">AW</div>
            <div>
              <h1 className="text-lg font-bold text-white">AgentWork</h1>
              <p className="text-xs text-slate-400">AI Agent Marketplace · Arc L1</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-slate-500"}`} />
              <span className="text-slate-300">{onlineCount}/{agents.length} agents</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full ${modeDot}`} />
              <span className={modeColor}>{modeLabel}</span>
            </div>
            <a href="https://testnet.arcscan.io" target="_blank" rel="noopener noreferrer" className="text-xs text-arc-purple hover:text-arc-blue transition-colors">Arc Explorer ↗</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "On-Chain Transactions", value: stats.totalOnChainTransactions, color: "text-arc-purple" },
            { label: "Tasks Completed", value: stats.completed, color: "text-green-400" },
            { label: "Total Spent", value: stats.totalSpent, color: "text-arc-blue" },
            { label: "Active Agents", value: `${onlineCount}/${agents.length}`, color: "text-yellow-400" },
            { label: "Gateway Balance", value: gatewayBalance.balance, color: "text-cyan-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-arc-card border border-arc-border rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Specialist Agents</h2>
              <div className="space-y-3">
                {agents.map((agent) => (<AgentCard key={agent.type} agent={agent} />))}
              </div>
            </div>
            <EconomicChart liveCost={stats.totalSpent} />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <TaskFeed tasks={tasks} />
            <TxList transactions={transactions} />
          </div>
        </div>
      </main>
      <footer className="border-t border-arc-border mt-12 py-6 text-center text-xs text-slate-500">
        Built for the Agentic Economy on Arc Hackathon · Powered by Circle Gateway & ERC-8004
      </footer>
    </div>
  );
}
