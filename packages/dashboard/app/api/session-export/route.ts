import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// Session Export API — Export real session data from Supabase
// ============================================================

interface SessionTransaction {
  txHash: string;
  explorerUrl: string;
  amount: string;
  agentType: string;
  type: string;
  timestamp: string;
}

interface SessionExport {
  exportDate: string;
  network: string;
  chainId: number;
  transactions: SessionTransaction[];
  summary: {
    totalTransactions: number;
    totalCost: string;
    agentsUsed: string[];
    averageCostPerTx: string;
  };
}

async function buildExportFromSupabase(): Promise<SessionExport> {
  const supabase = getSupabase();

  const empty: SessionExport = {
    exportDate: new Date().toISOString(),
    network: "Arc Testnet",
    chainId: 5042002,
    transactions: [],
    summary: { totalTransactions: 0, totalCost: "$0.000", agentsUsed: [], averageCostPerTx: "$0.0000" },
  };

  if (!supabase) return empty;

  const { data, error } = await supabase
    .from("task_events")
    .select("gateway_tx, amount, agent_type, status, created_at")
    .order("created_at", { ascending: true })
    .limit(200);

  if (error || !data || data.length === 0) return empty;

  const transactions: SessionTransaction[] = data
    .filter((row) => row.gateway_tx) // Only rows with a tx hash
    .map((row) => ({
      txHash: row.gateway_tx,
      explorerUrl: `https://testnet.arcscan.io/tx/${row.gateway_tx}`,
      amount: (row.amount || "$0.000"),
      agentType: row.agent_type || "unknown",
      type: row.status === "completed" ? "payment" : row.status,
      timestamp: row.created_at,
    }));

  const agentsUsed = [...new Set(transactions.map((t) => t.agentType))];
  const totalCost = transactions.reduce((sum, t) => sum + parseFloat(t.amount.replace("$", "")), 0);

  return {
    exportDate: new Date().toISOString(),
    network: "Arc Testnet",
    chainId: 5042002,
    transactions,
    summary: {
      totalTransactions: transactions.length,
      totalCost: `$${totalCost.toFixed(3)}`,
      agentsUsed,
      averageCostPerTx: transactions.length > 0
        ? `$${(totalCost / transactions.length).toFixed(4)}`
        : "$0.0000",
    },
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";

  const data = await buildExportFromSupabase();

  if (format === "html") {
    const html = `<!DOCTYPE html>
<html><head><title>AgentWork Session Export</title></head><body>
<h1>AgentWork Session Export</h1>
<p>Network: ${data.network} | Chain: ${data.chainId} | Exported: ${data.exportDate}</p>
<h2>Summary</h2>
<p>Total Transactions: ${data.summary.totalTransactions} | Cost: ${data.summary.totalCost}</p>
<h2>Transactions</h2>
<table border="1"><tr><th>#</th><th>Hash</th><th>Type</th><th>Agent</th><th>Amount</th></tr>
${data.transactions.map((t, i) => `<tr><td>${i + 1}</td><td><a href="${t.explorerUrl}">${t.txHash.slice(0, 16)}...</a></td><td>${t.type}</td><td>${t.agentType}</td><td>${t.amount}</td></tr>`).join("\n")}
</table></body></html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  }

  return NextResponse.json(data);
}
