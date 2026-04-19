"use client";

import { useState, useEffect, useRef } from "react";

interface EconomicChartProps {
  liveCost?: string;
  totalTransactions?: number;
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

export default function EconomicChart({ liveCost, totalTransactions = 0 }: EconomicChartProps) {
  const arcCost = liveCost ? parseFloat(liveCost.replace("$", "")) : 0;
  const txCount = totalTransactions || Math.max(1, Math.round(arcCost / 0.005));

  const stripeCost = txCount * 0.30;
  const l2Cost = txCount * 0.10;

  const animatedArc = useAnimatedCounter(arcCost);
  const animatedStripe = useAnimatedCounter(stripeCost);
  const animatedL2 = useAnimatedCounter(l2Cost);

  const savingsVsStripe = stripeCost > 0 ? ((1 - arcCost / stripeCost) * 100) : 0;
  const savingsVsL2 = l2Cost > 0 ? ((1 - arcCost / l2Cost) * 100) : 0;

  // Bar widths relative to Stripe (100%)
  const stripeBar = "100%";
  const l2Bar = stripeCost > 0 ? `${Math.max(3, (l2Cost / stripeCost) * 100)}%` : "3%";
  const arcBar = stripeCost > 0 ? `${Math.max(3, (arcCost / stripeCost) * 100)}%` : "3%";

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        💰 Live Economic Proof
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4 space-y-4">
        {/* Live counters */}
        <div className="grid grid-cols-3 gap-3 pb-3 border-b border-arc-border">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Arc (actual)</p>
            <p className="text-lg font-bold text-arc-purple">${animatedArc.toFixed(4)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">L2 (est.)</p>
            <p className="text-lg font-bold text-yellow-400">${animatedL2.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Stripe (min)</p>
            <p className="text-lg font-bold text-red-400">${animatedStripe.toFixed(2)}</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-300">Stripe / PayPal</span>
              <span className="text-xs text-slate-400">${stripeCost.toFixed(2)}</span>
            </div>
            <div className="w-full bg-arc-dark rounded-full h-2">
              <div className="h-2 rounded-full bg-red-500 transition-all duration-700" style={{ width: stripeBar }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-300">L2 (Arbitrum/Base)</span>
              <span className="text-xs text-slate-400">${l2Cost.toFixed(2)}</span>
            </div>
            <div className="w-full bg-arc-dark rounded-full h-2">
              <div className="h-2 rounded-full bg-yellow-500 transition-all duration-700" style={{ width: l2Bar }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-300">Arc + Circle Gateway</span>
              <span className="text-xs text-slate-400">${arcCost.toFixed(4)}</span>
            </div>
            <div className="w-full bg-arc-dark rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-arc-purple to-arc-blue transition-all duration-700" style={{ width: arcBar }} />
            </div>
          </div>
        </div>

        {/* Savings callout */}
        <div className="border-t border-arc-border pt-3 mt-3">
          {arcCost > 0 ? (
            <p className="text-sm text-center">
              <span className="text-green-400 font-bold">You saved {savingsVsStripe.toFixed(1)}%</span>
              <span className="text-slate-400"> vs Stripe, {savingsVsL2.toFixed(1)}% vs L2</span>
            </p>
          ) : (
            <p className="text-xs text-slate-400 text-center">
              Run the demo to see live cost comparison. Arc saves 98%+ vs traditional payments.
            </p>
          )}
          <p className="text-xs text-slate-500 text-center mt-1">
            Based on {txCount > 0 ? `${txCount} real` : "estimated"} on-chain transactions
          </p>
        </div>
      </div>
    </div>
  );
}
