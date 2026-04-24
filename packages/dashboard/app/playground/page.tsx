"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// GC6: Interactive Payment Playground
// ============================================================
// Self-service page where judges type a task, click "Execute",
// and watch real x402 nanopayments flow in real-time.
// SSE feed shows: decomposition → agent selection → payment
// per agent → arcscan links → agent responses.
// ============================================================

interface PlaygroundEvent {
  id: string;
  type: "status" | "payment" | "agent" | "result" | "error";
  agent?: string;
  message: string;
  txHash?: string;
  amount?: string;
  explorerUrl?: string;
  timestamp: number;
}

const SUGGESTED_TASKS = [
  "Build a REST API with user authentication and CRUD endpoints",
  "Analyze the security vulnerabilities in this smart contract",
  "Create a machine learning pipeline for text classification",
  "Design a microservices architecture for an e-commerce platform",
  "Write a comprehensive test suite for a payment processing module",
];

const AGENT_COLORS: Record<string, string> = {
  research: "text-blue-400",
  code: "text-green-400",
  test: "text-yellow-400",
  review: "text-purple-400",
  orchestrator: "text-cyan-400",
};

export default function PlaygroundPage() {
  const [task, setTask] = useState("");
  const [events, setEvents] = useState<PlaygroundEvent[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [stats, setStats] = useState({ payments: 0, totalCost: 0, agents: 0 });
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll event log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const addEvent = useCallback((event: Omit<PlaygroundEvent, "id" | "timestamp">) => {
    const newEvent: PlaygroundEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  }, []);

  const executeTask = useCallback(async () => {
    if (!task.trim() || status === "running") return;

    setStatus("running");
    setEvents([]);
    setStats({ payments: 0, totalCost: 0, agents: 0 });

    abortRef.current = new AbortController();

    addEvent({ type: "status", message: "🚀 Launching orchestrator..." });

    try {
      // Launch the orchestrator via demo-launch API
      const launchRes = await fetch("/api/demo-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim(), runs: 1 }),
        signal: abortRef.current.signal,
      });

      if (!launchRes.ok) {
        const err = await launchRes.json();
        throw new Error(err.error || "Failed to launch orchestrator");
      }

      const launchData = await launchRes.json();
      addEvent({
        type: "status",
        message: `✅ Orchestrator started (PID: ${launchData.pid}). Watching for live events...`,
      });

      // Poll task events from Supabase via our API
      let lastEventCount = 0;
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/playground-events");
          if (!res.ok) return;
          const data = await res.json();

          if (data.events && data.events.length > lastEventCount) {
            const newEvents = data.events.slice(lastEventCount);
            for (const evt of newEvents) {
              const agentColor = evt.agent_type || "orchestrator";
              if (evt.status === "completed" && evt.gateway_tx) {
                addEvent({
                  type: "payment",
                  agent: agentColor,
                  message: `Payment settled: ${evt.agent_type} agent`,
                  txHash: evt.gateway_tx,
                  amount: evt.amount || "$0.005",
                  explorerUrl: `https://testnet.arcscan.io/tx/${evt.gateway_tx}`,
                });
                setStats((prev) => ({
                  payments: prev.payments + 1,
                  totalCost: prev.totalCost + parseFloat((evt.amount || "$0.005").replace("$", "")),
                  agents: prev.agents + 1,
                }));
              } else if (evt.status === "failed") {
                addEvent({
                  type: "error",
                  agent: agentColor,
                  message: `Agent ${evt.agent_type} failed: ${evt.error || "unknown error"}`,
                });
              } else if (evt.status === "routing_decision" && evt.result) {
                addEvent({
                  type: "agent",
                  message: `AI Routing: ${evt.result}`,
                });
              }
            }
            lastEventCount = data.events.length;
          }

          // Check if orchestrator is done
          const statusRes = await fetch("/api/demo-launch");
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status === "idle" && lastEventCount > 0) {
              if (pollRef.current) clearInterval(pollRef.current);
              setStatus("complete");
              addEvent({ type: "status", message: "🎉 Task execution complete!" });
            }
          }
        } catch {
          // Polling error — ignore
        }
      }, 2000);

      // Safety timeout: stop after 2 minutes
      setTimeout(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        setStatus("complete");
        addEvent({ type: "status", message: "⏱️ Execution timeout — showing collected events." });
      }, 120000);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setStatus("error");
      addEvent({ type: "error", message: `❌ ${errorMsg}` });
    }
  }, [task, status, addEvent]);

  const handleSuggestion = (suggestion: string) => {
    setTask(suggestion);
  };

  return (
    <div className="min-h-screen bg-arc-bg text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            🎮 Payment Playground
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Type a task, click Execute, and watch real x402 nanopayments flow
            through AI agents on Arc L1 — with live blockchain verification.
          </p>
        </div>

        {/* Task Input */}
        <div className="mb-6 rounded-lg border border-arc-border bg-arc-card p-4">
          <label htmlFor="task-input" className="mb-2 block text-sm font-medium text-slate-300">
            Describe a task for the AI agents:
          </label>
          <textarea
            id="task-input"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Build a REST API with user authentication..."
            className="w-full rounded-md border border-arc-border bg-arc-bg px-4 py-3 text-white placeholder-slate-500 focus:border-arc-purple focus:outline-none focus:ring-1 focus:ring-arc-purple"
            rows={3}
            disabled={status === "running"}
          />

          {/* Suggested tasks */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Try:</span>
            {SUGGESTED_TASKS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s)}
                className="rounded-full border border-arc-border px-3 py-1 text-xs text-slate-400 transition-colors hover:border-arc-purple hover:text-white"
                disabled={status === "running"}
              >
                {s.slice(0, 50)}...
              </button>
            ))}
          </div>

          {/* Execute Button */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={executeTask}
              disabled={!task.trim() || status === "running"}
              className={`rounded-lg px-6 py-2.5 font-semibold transition-all ${
                status === "running"
                  ? "cursor-not-allowed bg-yellow-600 text-black animate-pulse"
                  : "bg-arc-purple text-white hover:bg-arc-purple/80"
              }`}
            >
              {status === "running" ? "⏳ Executing..." : "⚡ Execute Task"}
            </button>

            {/* Live Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-slate-500">Payments:</span>{" "}
                <span className="font-mono text-emerald-400">{stats.payments}</span>
              </div>
              <div>
                <span className="text-slate-500">Cost:</span>{" "}
                <span className="font-mono text-emerald-400">${stats.totalCost.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-slate-500">Agents:</span>{" "}
                <span className="font-mono text-emerald-400">{stats.agents}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Event Log */}
        <div className="rounded-lg border border-arc-border bg-arc-card">
          <div className="flex items-center justify-between border-b border-arc-border px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-300">
              📡 Live Payment Stream
            </h2>
            <div className="flex items-center gap-2">
              {status === "running" && (
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              )}
              <span className="text-xs text-slate-500">
                {events.length} events
              </span>
            </div>
          </div>

          <div
            ref={logRef}
            className="h-[500px] overflow-y-auto p-4 font-mono text-sm"
          >
            {events.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-600">
                <p>Enter a task and click Execute to see live payment flow...</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className={`mb-2 flex items-start gap-3 border-l-2 py-1 pl-3 ${
                    event.type === "payment"
                      ? "border-emerald-500"
                      : event.type === "error"
                        ? "border-red-500"
                        : event.type === "agent"
                          ? "border-blue-500"
                          : "border-slate-600"
                  }`}
                >
                  <span className="text-xs text-slate-600">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="flex-1">
                    {event.agent && (
                      <span className={`mr-2 font-semibold ${AGENT_COLORS[event.agent] || "text-slate-400"}`}>
                        [{event.agent}]
                      </span>
                    )}
                    <span className={
                      event.type === "error" ? "text-red-400" :
                      event.type === "payment" ? "text-emerald-400" :
                      event.type === "agent" ? "text-blue-400" :
                      "text-slate-300"
                    }>
                      {event.message}
                    </span>

                    {/* Transaction link */}
                    {event.txHash && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          tx: {event.txHash.slice(0, 20)}...
                        </span>
                        {event.explorerUrl && (
                          <a
                            href={event.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-arc-purple/20 px-2 py-0.5 text-xs text-arc-purple hover:bg-arc-purple/30"
                          >
                            🔗 View on Arcscan
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  {event.amount && (
                    <span className="font-semibold text-emerald-400">
                      {event.amount}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          {[
            { step: "1", icon: "📝", label: "Describe Task", desc: "Type any software engineering task" },
            { step: "2", icon: "🧩", label: "AI Decomposes", desc: "Gemini breaks it into subtasks per agent" },
            { step: "3", icon: "💸", label: "Nanopayments Flow", desc: "Each agent is paid $0.005 via x402 on Arc" },
            { step: "4", icon: "✅", label: "On-Chain Receipts", desc: "Every payment verified on Arc block explorer" },
          ].map((item) => (
            <div key={item.step} className="rounded-lg border border-arc-border bg-arc-card p-4 text-center">
              <div className="text-2xl">{item.icon}</div>
              <div className="mt-2 text-sm font-semibold">{item.label}</div>
              <div className="mt-1 text-xs text-slate-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
