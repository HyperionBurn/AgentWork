"use client";

import { useState, useEffect, useRef } from "react";

// ============================================================
// LiveEconomicCounter — 7-chain real-time cost comparison
// ============================================================
// Shows animated bar chart of Arc vs 6 other blockchains.
// txCount updates live from Supabase Realtime task_events.
// Each bar animates with requestAnimationFrame for smooth growth.
// ============================================================

interface ChainCost {
  id: string;
  name: string;
  perTx: number;
  total: number;
  txCount: number;
  color: string;
  emoji: string;
}

interface LiveEconomicCounterProps {
  txCount?: number;
}

/** Animated counter using requestAnimationFrame */
function useAnimatedCounter(target: number, duration = 800): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === startRef.current) return;

    const start = startRef.current;
    const diff = target - start;
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCurrent(start + diff * easeOutCubic(progress));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}

/** Format cost for display — small values get more decimals */
function formatCost(value: number): string {
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  if (value < 100) return `$${value.toFixed(2)}`;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LiveEconomicCounter({ txCount: propTxCount }: LiveEconomicCounterProps) {
  const [chainData, setChainData] = useState<ChainCost[]>([]);
  const [txCount, setTxCount] = useState(propTxCount || 0);
  const [arcTotal, setArcTotal] = useState(0);
  const [ethTotal, setEthTotal] = useState(0);
  const [savingsPct, setSavingsPct] = useState("0");

  // Fetch 7-chain comparison from API
  useEffect(() => {
    if (txCount === 0) return;

    fetch(`/api/gas-costs?txCount=${txCount}`)
      .then((res) => res.json())
      .then((data) => {
        setChainData(data.chains || []);
        setArcTotal(data.arcTotal || 0);
        setEthTotal(data.ethereumTotal || 0);
        setSavingsPct(data.savingsVsEthereumPct || "0");
      })
      .catch(() => {
        // Fallback to static data
      });
  }, [txCount]);

  // Auto-increment txCount from Supabase Realtime (poll /api/task-status)
  useEffect(() => {
    if (propTxCount && propTxCount > 0) {
      setTxCount(propTxCount);
      return;
    }

    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/task-status");
        if (res.ok) {
          const data = await res.json();
          const onChain = data?.stats?.totalOnChainTransactions || 0;
          if (onChain > 0) setTxCount(onChain);
        }
      } catch {
        // Polling failure — ignore
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [propTxCount]);

  const animatedArc = useAnimatedCounter(arcTotal);
  const animatedEth = useAnimatedCounter(ethTotal);

  // Find max total for bar scaling
  const maxTotal = Math.max(...chainData.map((c) => c.total), 0.001);

  if (txCount === 0) {
    return (
      <div className="bg-arc-card border border-arc-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          💰 Live Cost Comparison
        </h2>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-slate-500">
            Run the demo to see live 7-chain cost comparison
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-arc-card border border-arc-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          💰 Live 7-Chain Cost Comparison
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{txCount} transactions</span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>

      {/* Live counters */}
      <div className="grid grid-cols-2 gap-3 pb-4 border-b border-arc-border mb-4">
        <div className="text-center bg-gradient-to-r from-arc-purple/10 to-arc-blue/10 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">⚡ Arc (actual)</p>
          <p className="text-xl font-bold text-arc-purple">{formatCost(animatedArc)}</p>
        </div>
        <div className="text-center bg-red-500/5 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">💎 Ethereum (estimated)</p>
          <p className="text-xl font-bold text-red-400">{formatCost(animatedEth)}</p>
        </div>
      </div>

      {/* 7-chain bar chart */}
      <div className="space-y-2.5">
        {chainData.map((chain) => {
          const barWidth = Math.max(2, (chain.total / maxTotal) * 100);
          const isArc = chain.id === "arc";

          return (
            <div key={chain.id}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${isArc ? "text-arc-purple" : "text-slate-300"}`}>
                  {chain.emoji} {chain.name}
                </span>
                <span className={`text-xs ${isArc ? "text-arc-purple font-bold" : "text-slate-400"}`}>
                  {formatCost(chain.total)}
                </span>
              </div>
              <div className="w-full bg-arc-dark rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${
                    isArc
                      ? "bg-gradient-to-r from-arc-purple to-arc-blue"
                      : "opacity-70"
                  }`}
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: isArc ? undefined : chain.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Savings callout */}
      <div className="border-t border-arc-border pt-3 mt-4">
        <p className="text-sm text-center">
          <span className="text-green-400 font-bold">💎 Arc saves {savingsPct} vs Ethereum</span>
        </p>
        <p className="text-xs text-slate-500 text-center mt-1">
          Based on {txCount} real on-chain transactions at ~$0.001/tx
        </p>
      </div>
    </div>
  );
}
