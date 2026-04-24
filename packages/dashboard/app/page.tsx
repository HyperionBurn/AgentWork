"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TaskFeed from "@/components/TaskFeed";
import TxList from "@/components/TxList";
import DemoLauncher from "@/components/DemoLauncher";
import { DashboardCharts } from "@/components/DashboardCharts";
import { PaymentFlowAnimation } from "@/components/PaymentFlowAnimation";
import { subscribeToTasks } from "@/lib/supabase";
import { LivePaymentFeed } from "@/components/LivePaymentFeed";
import LiveEconomicCounter from "@/components/LiveEconomicCounter";
import AgentReasoningFeed from "@/components/AgentReasoningFeed";
import { BentoDashboard } from "@/components/BentoDashboard";

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
  const [timeseries, setTimeseries] = useState<Array<{ timestamp: string; count: number; totalAmount: number }>>([]);
  const [agentBreakdown, setAgentBreakdown] = useState<Array<{ agentType: string; count: number; totalAmount: number }>>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [activeTask, setActiveTask] = useState<string>("");
  const channelRef = useRef<ReturnType<typeof subscribeToTasks>>(null);
  const pendingRef = useRef<unknown[]>([]);
  const flushRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Fetch time-series data for charts
  const fetchTimeseries = useCallback(async () => {
    try {
      const res = await fetch("/api/stats-timeseries");
      if (res.ok) {
        const data = await res.json();
        setTimeseries(data.timeseries || []);
        setAgentBreakdown(data.agentBreakdown || []);
      }
    } catch {
      // Timeseries unavailable
    }
  }, []);

  // Run Demo
  const handleRunDemo = async (mode: 'mock' | 'real') => {
    setIsOrchestrating(true);
    const task = "Build a cross-chain liquidity aggregator on Arc L1";
    setActiveTask(task);
    try {
      await fetch("/api/demo-launch", {
        method: "POST",
        body: JSON.stringify({ task, runs: mode === 'real' ? 3 : 1 }),
      });
    } catch (err) {
      console.error("Failed to launch demo:", err);
    } finally {
      // Keep loading state until first tasks appear or timeout
      setTimeout(() => setIsOrchestrating(false), 10000);
    }
  };

  useEffect(() => {
    fetchTasks();
    checkAgents();
    fetchBalance();
    fetchTimeseries();

    // Attempt Supabase Realtime subscription
    try {
      const channel = subscribeToTasks((_event) => {
        // Debounce: accumulate events, flush every 100ms
        pendingRef.current.push(_event);
        if (!flushRef.current) {
          flushRef.current = setTimeout(() => {
            flushRef.current = null;
            fetchTasks();
            fetchBalance();
            fetchTimeseries();
          }, 100);
        }
      });
      channelRef.current = channel;
      if (channel) setConnectionMode("live");
      else setConnectionMode("polling");
    } catch {
      setConnectionMode("polling");
    }

    // Master polling loop (10s for health/balance/stats)
    const masterInterval = setInterval(() => {
      checkAgents();
      fetchBalance();
      fetchTimeseries();
      if (connectionMode === "polling") fetchTasks();
    }, 10000);

    // Fast task polling ONLY if in polling mode
    let taskPollInterval: ReturnType<typeof setInterval> | null = null;
    if (connectionMode === "polling") {
      taskPollInterval = setInterval(fetchTasks, 3000);
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (flushRef.current) {
        clearTimeout(flushRef.current);
        flushRef.current = null;
      }
      clearInterval(masterInterval);
      if (taskPollInterval) clearInterval(taskPollInterval);
    };
  }, [fetchTasks, checkAgents, fetchBalance, fetchTimeseries, connectionMode]);

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
            <a href="/evidence" className="text-xs text-arc-purple hover:text-arc-blue transition-colors">📊 Evidence</a>
            <a href="https://testnet.arcscan.io" target="_blank" rel="noopener noreferrer" className="text-xs text-arc-purple hover:text-arc-blue transition-colors">Arc Explorer ↗</a>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <BentoDashboard
          agents={agents.map(a => ({
            type: a.type,
            status: a.status,
            avgScore: 95, // Mock score for UI
            completedCount: a.tasksCompleted,
            earnings: `${a.earnings.toFixed(3)} USDC`
          }))}
          totalEarnings={stats.totalSpent.replace("$", "")}
          totalTx={stats.totalOnChainTransactions}
          activeTask={activeTask}
          onRunDemo={handleRunDemo}
          isLoading={isOrchestrating}
        />
      </main>
      <footer className="border-t border-arc-border mt-12 py-6 text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
        Built for the Agentic Economy on Arc Hackathon · Powered by Circle Gateway & ERC-8004 · Premium v1.0
      </footer>
    </div>
  );
}
