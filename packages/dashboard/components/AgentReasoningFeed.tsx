"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ────────────────────────────────────────────────────

interface ReasoningEvent {
  id: string;
  task_id: string;
  agent_type: string;
  status: string;
  reasoning: {
    agent: string;
    model?: string;
    decision: string;
    factors?: Record<string, unknown>;
    timestamp: number;
  };
  created_at: string;
}

// ── Component ────────────────────────────────────────────────

export default function AgentReasoningFeed() {
  const [events, setEvents] = useState<ReasoningEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch reasoning events
  const fetchReasoningEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/reasoning");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        setEvents((prev) => {
          // Merge new events, dedup by id
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = data.events.filter(
            (e: ReasoningEvent) => !existingIds.has(e.id),
          );
          if (newEvents.length === 0) return prev;
          return [...newEvents, ...prev].slice(0, 50); // Keep last 50
        });
        setIsConnected(true);
        setError(null);
      }
    } catch {
      setError("Unable to sync reasoning cluster");
      setIsConnected(false);
    }
  }, []);

  // Poll every 2s for more "live" feel
  useEffect(() => {
    fetchReasoningEvents();
    const interval = setInterval(fetchReasoningEvents, 5000);
    return () => clearInterval(interval);
  }, [fetchReasoningEvents]);

  // Agent meta map
  const agentMeta: Record<string, { emoji: string; color: string; border: string }> = {
    orchestrator: { emoji: "🎯", color: "text-purple-400 bg-purple-500/10", border: "border-purple-500/20" },
    research: { emoji: "🔬", color: "text-blue-400 bg-blue-500/10", border: "border-blue-500/20" },
    code: { emoji: "💻", color: "text-cyan-400 bg-cyan-500/10", border: "border-cyan-500/20" },
    test: { emoji: "🧪", color: "text-green-400 bg-green-500/10", border: "border-green-500/20" },
    review: { emoji: "🔍", color: "text-yellow-400 bg-yellow-500/10", border: "border-yellow-500/20" },
    "gemini-orchestrator": { emoji: "🤖", color: "text-indigo-400 bg-indigo-500/10", border: "border-indigo-500/20" },
  };

  const getMeta = (agentType: string) =>
    agentMeta[agentType] || agentMeta["gemini-orchestrator"];

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bg-slate-950/80 backdrop-blur-2xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
             <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)] animate-pulse" : "bg-red-500"}`} />
          </div>
          <div>
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
               Intelligence Nexus
             </h3>
             <p className="text-xs text-slate-500 font-mono">
               Real-time AI Reasoning Trace
             </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
             {Object.values(agentMeta).slice(0, 4).map((m, i) => (
               <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[10px]">
                 {m.emoji}
               </div>
             ))}
          </div>
          <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded">
            {isConnected ? "ACTIVE_SYNC" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Main Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-white/10"
      >
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className="relative w-20 h-20 mb-6">
               <div className="absolute inset-0 border-2 border-dashed border-purple-500/30 rounded-full animate-spin" />
               <div className="absolute inset-4 border border-blue-500/20 rounded-full animate-pulse" />
               <div className="absolute inset-0 flex items-center justify-center text-3xl">🧠</div>
            </div>
            <p className="text-sm font-bold text-white uppercase tracking-widest">Awaiting Decisions</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1 max-w-[200px]">Launch a task cycle to observe autonomous reasoning</p>
          </div>
        ) : (
          events.map((event, idx) => {
            const meta = getMeta(event.agent_type);
            return (
              <div
                key={event.id}
                className={`group relative pl-4 border-l-2 ${meta.border} animate-in fade-in slide-in-from-left-4 duration-500`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="bg-white/[0.02] hover:bg-white/[0.05] rounded-xl p-4 transition-all border border-white/[0.01] hover:border-white/[0.05]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.emoji}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${meta.color.split(' ')[0]}`}>
                        {event.agent_type}
                      </span>
                      <div className={`w-1 h-1 rounded-full bg-slate-700`} />
                      <span className="text-[10px] text-slate-600 font-mono">
                        {event.reasoning.model || "ORCHESTRATOR-V1"}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-600 group-hover:text-slate-400 transition-colors">
                      {formatTime(event.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 font-mono leading-relaxed mb-4 selection:bg-purple-500/30">
                    {event.reasoning.decision}
                  </p>

                  {/* Factor Chips */}
                  {event.reasoning.factors && Object.keys(event.reasoning.factors).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                      {Object.entries(event.reasoning.factors).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/5">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{key}</span>
                          <span className="text-[10px] font-bold text-slate-400">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ticker Footer */}
      <div className="px-5 py-3 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between overflow-hidden whitespace-nowrap">
        <div className="flex items-center gap-6 animate-[marquee_30s_linear_infinite]">
          {[
            "REASONING_SYNC_ACTIVE",
            "GEMINI_2.0_ORCHESTRATION",
            "RECURSIVE_PAYMENT_AUTHORIZED",
            "REPUTATION_WEIGHT_ADJUSTED",
            "ESCROW_LIFECYCLE_VERIFIED",
            "ARC_L1_TRANSACTION_EMITTED",
          ].map((msg, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1 h-1 bg-purple-500 rounded-full" />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
