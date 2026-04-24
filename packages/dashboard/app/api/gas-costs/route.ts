// ============================================================
// Gas Cost Dashboard — Live 7-chain cost comparison
// ============================================================
// Arc costs are based on real testnet observations (~$0.001/tx).
// Other chains use conservative 2026 estimates.
// Source: docs/MARGIN_ANALYSIS.md
// ============================================================

import { NextRequest, NextResponse } from "next/server";

/** Per-transaction cost estimates for 7 blockchains (conservative 2026 values) */
const CHAIN_COSTS = [
  { id: "arc",       name: "Arc + Circle Gateway",  perTx: 0.001,  color: "#8B5CF6", emoji: "⚡" },
  { id: "solana",    name: "Solana",                perTx: 0.0025, color: "#9945FF", emoji: "◎" },
  { id: "polygon",   name: "Polygon",               perTx: 0.02,   color: "#8247E5", emoji: "🟣" },
  { id: "base",      name: "Base",                   perTx: 0.04,   color: "#0052FF", emoji: "🔵" },
  { id: "optimism",  name: "Optimism",               perTx: 0.08,   color: "#FF0420", emoji: "🔴" },
  { id: "arbitrum",  name: "Arbitrum",               perTx: 0.15,   color: "#28A0F0", emoji: "🔵" },
  { id: "ethereum",  name: "Ethereum Mainnet",        perTx: 2.50,   color: "#627EEA", emoji: "💎" },
] as const;

interface ChainCostRow {
  id: string;
  name: string;
  perTx: number;
  total: number;
  txCount: number;
  color: string;
  emoji: string;
  savingsVsArc: string;
  savingsVsArcPct: string;
}

interface GasCostData {
  chains: ChainCostRow[];
  arcTotal: number;
  ethereumTotal: number;
  savingsVsEthereum: string;
  savingsVsEthereumPct: string;
  txCount: number;
}

function calculateGasCosts(txCount: number): GasCostData {
  const arcChain = CHAIN_COSTS.find((c) => c.id === "arc")!;
  const arcTotal = arcChain.perTx * txCount;
  const ethChain = CHAIN_COSTS.find((c) => c.id === "ethereum")!;
  const ethereumTotal = ethChain.perTx * txCount;

  const chains: ChainCostRow[] = CHAIN_COSTS.map((chain) => {
    const total = chain.perTx * txCount;
    const savings = total - arcTotal;
    const savingsPct = total > 0 ? ((1 - arcTotal / total) * 100).toFixed(1) : "0";
    return {
      id: chain.id,
      name: chain.name,
      perTx: chain.perTx,
      total,
      txCount,
      color: chain.color,
      emoji: chain.emoji,
      savingsVsArc: `$${savings.toFixed(2)}`,
      savingsVsArcPct: `${savingsPct}%`,
    };
  });

  return {
    chains,
    arcTotal,
    ethereumTotal,
    savingsVsEthereum: `$${(ethereumTotal - arcTotal).toFixed(2)}`,
    savingsVsEthereumPct: ethereumTotal > 0
      ? `${((1 - arcTotal / ethereumTotal) * 100).toFixed(1)}%`
      : "0%",
    txCount,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txCount = parseInt(searchParams.get("txCount") || "60", 10);

  const data = calculateGasCosts(txCount);

  return NextResponse.json(data);
}
