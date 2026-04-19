"use client";

import { useState, useEffect } from "react";

// ============================================================
// GasDashboard — Arc vs Ethereum vs L2 cost comparison
// ============================================================

interface GasCostData {
  arc: { perTx: number; total: number; txCount: number };
  arbitrum: { perTx: number; total: number; txCount: number };
  ethereum: { perTx: number; total: number; txCount: number };
  savings: {
    vsArbitrum: string;
    vsEthereum: string;
    vsArbitrumPct: string;
    vsEthereumPct: string;
  };
}

export default function GasDashboard() {
  const [gasData, setGasData] = useState<GasCostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGas() {
      try {
        const res = await fetch("/api/gas-costs?txCount=60");
        if (res.ok) {
          const data = await res.json();
          setGasData(data);
        }
      } catch {
        // Gas data unavailable
      } finally {
        setLoading(false);
      }
    }
    fetchGas();
  }, []);

  if (loading) {
    return (
      <div className="bg-arc-card border border-arc-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          ⛽ Gas Cost Comparison
        </h2>
        <div className="text-slate-500 text-sm">Loading gas data...</div>
      </div>
    );
  }

  if (!gasData) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        ⛽ Gas Cost Comparison ({gasData.arc.txCount} txns)
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4">
        {/* Three-column comparison */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Arc */}
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-800/30">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Arc L1</div>
            <div className="text-2xl font-bold text-green-400">${gasData.arc.total.toFixed(2)}</div>
            <div className="text-xs text-slate-500">${gasData.arc.perTx}/tx</div>
            <div className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
              🏆 Best
            </div>
          </div>

          {/* Arbitrum */}
          <div className="text-center p-4 rounded-xl bg-arc-dark/50 border border-arc-border">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Arbitrum</div>
            <div className="text-2xl font-bold text-yellow-400">${gasData.arbitrum.total.toFixed(2)}</div>
            <div className="text-xs text-slate-500">${gasData.arbitrum.perTx}/tx</div>
          </div>

          {/* Ethereum */}
          <div className="text-center p-4 rounded-xl bg-arc-dark/50 border border-arc-border">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Ethereum</div>
            <div className="text-2xl font-bold text-red-400">${gasData.ethereum.total.toFixed(2)}</div>
            <div className="text-xs text-slate-500">${gasData.ethereum.perTx}/tx</div>
          </div>
        </div>

        {/* Savings badges */}
        <div className="flex justify-center gap-4">
          <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-800/30">
            <span className="text-xs text-slate-400">vs Arbitrum: </span>
            <span className="text-sm font-bold text-green-400">{gasData.savings.vsArbitrumPct} cheaper</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-800/30">
            <span className="text-xs text-slate-400">vs Ethereum: </span>
            <span className="text-sm font-bold text-green-400">{gasData.savings.vsEthereumPct} cheaper</span>
          </div>
        </div>
      </div>
    </div>
  );
}
