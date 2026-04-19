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

export default function DemoLauncher() {
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
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      }
    } catch {
      // Polling failed — ignore, Supabase Realtime will catch updates
    }
  }, [state.status]);

  // Start polling when running
  useEffect(() => {
    if (state.status === "running" && !pollRef.current) {
      pollRef.current = setInterval(pollStatus, 3000);
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
        // Auto-clear error after 5 seconds
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
      setTimeout(() => {
        setState((prev) => (prev.status === "error" ? { ...prev, status: "idle" } : prev));
      }, 5000);
    }
  };

  // Button styling based on state
  const buttonConfig: Record<string, { label: string; className: string; disabled: boolean }> = {
    idle: {
      label: "🚀 Run Demo",
      className: "bg-gradient-to-r from-arc-purple to-arc-blue hover:from-arc-purple/90 hover:to-arc-blue/90 text-white font-bold",
      disabled: false,
    },
    launching: {
      label: "Starting...",
      className: "bg-arc-card border border-arc-border text-slate-400",
      disabled: true,
    },
    running: {
      label: `⚡ Running (${state.runs} runs)...`,
      className: "bg-gradient-to-r from-arc-purple/60 to-arc-blue/60 text-white/80 animate-pulse",
      disabled: true,
    },
    complete: {
      label: "✅ Demo Complete — Run Again",
      className: "bg-green-600 hover:bg-green-500 text-white font-bold",
      disabled: false,
    },
    error: {
      label: `❌ ${state.errorMessage}`,
      className: "bg-red-600/50 text-red-300",
      disabled: true,
    },
  };

  const btn = buttonConfig[state.status] || buttonConfig.idle;

  return (
    <div className="bg-arc-card border border-arc-border rounded-xl p-5">
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

      {/* Config row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Runs:</label>
          <select
            value={customRuns}
            onChange={(e) => setCustomRuns(parseInt(e.target.value, 10))}
            disabled={state.status !== "idle" && state.status !== "complete"}
            className="bg-arc-dark border border-arc-border rounded px-2 py-1 text-xs text-white disabled:opacity-50"
          >
            <option value={1}>1 run</option>
            <option value={3}>3 runs</option>
            <option value={5}>5 runs</option>
            <option value={10}>10 runs</option>
            <option value={15}>15 runs (60+ txns)</option>
            <option value={25}>25 runs</option>
          </select>
        </div>
        {/* Continuous mode toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-slate-400">Continuous:</label>
          <button
            type="button"
            role="switch"
            aria-checked={continuous}
            onClick={() => setContinuous((c) => !c)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${continuous ? "bg-arc-purple" : "bg-slate-600"}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${continuous ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
          {continuous && state.continuousRuns > 0 && (
            <span className="text-xs text-arc-purple">∞ {state.continuousRuns} runs done</span>
          )}
        </div>
      </div>

      {/* Launch button */}
      <button
        onClick={launchDemo}
        disabled={btn.disabled}
        className={`w-full py-3 rounded-lg text-sm transition-all ${btn.className}`}
      >
        {btn.label}
      </button>

      {/* Info text */}
      <p className="text-xs text-slate-500 mt-2 text-center">
        {state.status === "idle"
          ? continuous
            ? "Continuous mode: will auto-relaunch after each batch completes."
            : "Spawns the orchestrator. Watch the Task Feed for live updates."
          : state.status === "running"
            ? `Running ${state.runs} orchestrator cycle(s). Progress appears in real-time above.`
            : state.status === "complete"
              ? continuous
                ? `Batch done (${state.continuousRuns} total). Next launch in 3s...`
                : "Demo complete! Check the Task Feed and Transaction List for results."
              : state.status === "error"
                ? "An error occurred. Check the terminal for details."
                : "Preparing to launch..."}
      </p>
    </div>
  );
}
