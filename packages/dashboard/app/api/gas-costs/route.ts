// ============================================================
// Gas Cost Dashboard — Live Arc vs Ethereum vs L2 comparison
// ============================================================

import { NextRequest, NextResponse } from "next/server";

/**
 * Gas Cost API — Returns simulated gas cost comparison.
 * Arc costs are based on real testnet observations (~$0.001/tx).
 */

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

function calculateGasCosts(txCount: number): GasCostData {
  const arcPerTx = 0.001;
  const arbitrumPerTx = 0.10;
  const ethereumPerTx = 2.50;

  const arcTotal = arcPerTx * txCount;
  const arbitrumTotal = arbitrumPerTx * txCount;
  const ethereumTotal = ethereumPerTx * txCount;

  const savingsVsArbitrum = arbitrumTotal - arcTotal;
  const savingsVsEthereum = ethereumTotal - arcTotal;
  const savingsVsArbitrumPct = arbitrumTotal > 0 ? ((1 - arcTotal / arbitrumTotal) * 100).toFixed(1) : "0";
  const savingsVsEthereumPct = ethereumTotal > 0 ? ((1 - arcTotal / ethereumTotal) * 100).toFixed(1) : "0";

  return {
    arc: { perTx: arcPerTx, total: arcTotal, txCount },
    arbitrum: { perTx: arbitrumPerTx, total: arbitrumTotal, txCount },
    ethereum: { perTx: ethereumPerTx, total: ethereumTotal, txCount },
    savings: {
      vsArbitrum: `$${savingsVsArbitrum.toFixed(3)}`,
      vsEthereum: `$${savingsVsEthereum.toFixed(2)}`,
      vsArbitrumPct: `${savingsVsArbitrumPct}%`,
      vsEthereumPct: `${savingsVsEthereumPct}%`,
    },
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txCount = parseInt(searchParams.get("txCount") || "60", 10);

  const data = calculateGasCosts(txCount);

  return NextResponse.json(data);
}
