"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// One-Click Demo Launcher (HF-2)
// ============================================================
// Big button that spawns the orchestrator and shows progress.
// States: idle → launching → running → complete
// Progress flows through Supabase Realtime → TaskFeed
// ============================================================

interface DemoState {
  status: "idle" | "launching" | "running" | "complete" | "error";
  pid: number | null;
  runs: number;
  task: string;
  errorMessage: string;
  continuousRuns: number;
}

interface DemoLauncherProps {
  compact?: boolean;
}

export default function DemoLauncher({ compact = false }: DemoLauncherProps) {
  const [state, setState] = useState<DemoState>({
    status: "idle",
    pid: null,
    runs: 15,
    task: "",
    errorMessage: "",
    continuousRuns: 0,
  });

  const [customRuns, setCustomRuns] = useState(15);
  const [continuous, setContinuous] = useState(false);
  const [continuousTimer, setContinuousTimer] = useState<number | null>(null);
  const [showNexus, setShowNexus] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll demo status while running
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/demo-launch");
      if (res.ok) {
        const data = await res.json();
        if (data.status === "idle" && state.status === "running") {
          // Orchestrator finished
          setState((prev) => ({
            ...prev,
            status: "complete",
            continuousRuns: prev.continuousRuns + prev.runs,
          }));
          setShowNexus(false);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      }
    } catch {
      // Polling failed
    }
  }, [state.status]);

  // Start polling when running
  useEffect(() => {
    if (state.status === "running" && !pollRef.current) {
      pollRef.current = setInterval(pollStatus, 3000);
      setShowNexus(true);
    }
    // Auto-relaunch in continuous mode
    if (state.status === "complete" && continuous) {
      const timer = window.setTimeout(() => {
        launchDemo();
      }, 3000);
      setContinuousTimer(timer);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (continuousTimer) {
        clearTimeout(continuousTimer);
      }
    };
  }, [state.status, pollStatus, continuous, continuousTimer]);

  const launchDemo = async () => {
    // Preserve cumulative run count
    const currentRuns = state.continuousRuns;
    setState((prev) => ({ ...prev, status: "launching", errorMessage: "", continuousRuns: prev.status === "complete" ? currentRuns : 0 }));
    setShowNexus(true);

    try {
      const res = await fetch("/api/demo-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runs: customRuns,
          task: state.task || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState((prev) => ({
          ...prev,
          status: "error",
          errorMessage: data.error || "Launch failed",
        }));
        setShowNexus(false);
        setTimeout(() => {
          setState((prev) => (prev.status === "error" ? { ...prev, status: "idle" } : prev));
        }, 5000);
        return;
      }

      setState((prev) => ({
        ...prev,
        status: "running",
        pid: data.pid,
        runs: data.runs,
        task: data.task,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Network error",
      }));
      setShowNexus(false);
      setTimeout(() => {
        setState((prev) => (prev.status === "error" ? { ...prev, status: "idle" } : prev));
      }, 5000);
    }
  };

  // Button styling based on state
  const buttonConfig: Record<string, { label: string; className: string; disabled: boolean }> = {
    idle: {
      label: "🚀 Run Live Demo",
      className: "bg-gradient-to-r from-arc-purple to-arc-blue hover:from-arc-purple/90 hover:to-arc-blue/90 text-white font-bold shadow-lg shadow-arc-purple/20",
      disabled: false,
    },
    launching: {
      label: "Initializing Nexus...",
      className: "bg-arc-card border border-arc-border text-slate-400",
      disabled: true,
    },
    running: {
      label: `⚡ ${state.runs} Run Chain Active`,
      className: "bg-gradient-to-r from-arc-purple/20 to-arc-blue/20 text-white border border-arc-purple/40 animate-pulse",
      disabled: true,
    },
    complete: {
      label: "✅ Cycle Complete — Restart",
      className: "bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 font-bold",
      disabled: false,
    },
    error: {
      label: `❌ ${state.errorMessage}`,
      className: "bg-red-600/10 text-red-400 border border-red-500/20",
      disabled: true,
    },
  };

  const btn = buttonConfig[state.status] || buttonConfig.idle;

  return (
    <>
      {/* Loading Nexus Overlay */}
      {showNexus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-500">
           <div className="relative w-64 h-64">
              {/* Outer Rings */}
              <div className="absolute inset-0 border-4 border-arc-purple/20 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-4 border-2 border-arc-blue/30 rounded-full animate-[spin_6s_linear_infinite_reverse]" />
              <div className="absolute inset-8 border border-cyan-400/20 rounded-full animate-[spin_3s_linear_infinite]" />
              
              {/* Nexus Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-gradient-to-br from-arc-purple to-arc-blue rounded-2xl rotate-45 animate-pulse flex items-center justify-center shadow-2xl shadow-arc-purple/50">
                    <span className="text-2xl font-bold text-white -rotate-45">AW</span>
                 </div>
                 <div className="mt-8 space-y-2">
                    <p className="text-sm font-black text-white uppercase tracking-[0.2em] animate-pulse">Orchestrating</p>
                    <p className="text-[10px] text-slate-400 font-mono">System ID: {state.pid || "0xNexus"}</p>
                 </div>
                 {/* Connection Lines (Animated) */}
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-t from-arc-purple to-transparent" />
                 <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-arc-blue to-transparent" />
                 <div className="absolute top-1/2 -left-12 -translate-y-1/2 h-0.5 w-12 bg-gradient-to-l from-cyan-400 to-transparent" />
                 <div className="absolute top-1/2 -right-12 -translate-y-1/2 h-0.5 w-12 bg-gradient-to-r from-violet-500 to-transparent" />
              </div>
           </div>
           
           <div className="absolute bottom-20 flex gap-8">
              {["RESEARCH", "CODE", "TEST", "REVIEW"].map((agent) => (
                <div key={agent} className="flex flex-col items-center gap-2 opacity-60 animate-bounce" style={{ animationDelay: `${Math.random()}s` }}>
                   <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">🤖</div>
                   <span className="text-[8px] font-bold text-slate-500 tracking-widest">{agent}</span>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className={`${compact ? "" : "bg-arc-card border border-arc-border rounded-xl p-5"}`}>
        {!compact && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              One-Click Demo
            </h2>
            {state.status === "running" && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">PID: {state.pid}</span>
              </div>
            )}
          </div>
        )}

        {/* Config row */}
        <div className={`flex items-center gap-3 mb-4 ${compact ? "bg-black/20 p-2 rounded-lg" : ""}`}>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500 uppercase font-bold">Volume:</label>
            <select
              value={customRuns}
              onChange={(e) => setCustomRuns(parseInt(e.target.value, 10))}
              disabled={state.status !== "idle" && state.status !== "complete"}
              className="bg-transparent border-none focus:ring-0 text-xs text-white font-bold cursor-pointer"
            >
              <option value={1} className="bg-slate-900">1 Cycle</option>
              <option value={5} className="bg-slate-900">5 Cycles</option>
              <option value={15} className="bg-slate-900">15 Cycles (60+ txns)</option>
              <option value={30} className="bg-slate-900">30 Cycles (High Density)</option>
            </select>
          </div>
          {/* Continuous mode toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-[10px] text-slate-500 uppercase font-bold">Autopilot:</label>
            <button
              type="button"
              role="switch"
              aria-checked={continuous}
              onClick={() => setContinuous((c) => !c)}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${continuous ? "bg-arc-purple" : "bg-slate-700"}`}
            >
              <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${continuous ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Launch button */}
        <button
          onClick={launchDemo}
          disabled={btn.disabled}
          className={`w-full py-4 rounded-xl text-sm transition-all relative overflow-hidden group ${btn.className}`}
        >
          <span className="relative z-10">{btn.label}</span>
          {state.status === "idle" && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          )}
        </button>

        {/* Info text */}
        {!compact && (
          <p className="text-xs text-slate-500 mt-3 text-center leading-relaxed">
            {state.status === "idle"
              ? continuous
                ? "Autopilot enabled: system will run recursive agent cycles indefinitely."
                : "Spawns the autonomous orchestrator. All actions are verifiable on Arc Testnet."
              : state.status === "running"
                ? `Active Pipeline: ${state.runs} cycles triggered. View real-time transactions in the feed.`
                : state.status === "complete"
                  ? continuous
                    ? `Batch complete. Resuming next cycle in 3s...`
                    : "Task complete. All transaction hashes have been recorded to the ledger."
                  : state.status === "error"
                    ? "Handshake failed. Ensure the local orchestrator node is reachable."
                    : "Calibrating Nexus..."}
          </p>
        )}
      </div>
    </>
  );
}
