"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ============================================================
// Transaction Evidence Gallery (HF-5)
// ============================================================
// Shows all verified on-chain transactions with arcscan links.
// "Don't trust, verify."
// ============================================================

interface EvidenceTransaction {
  id: string;
  task_id: string;
  agent_type: string;
  status: string;
  gateway_tx: string;
  amount: string;
  created_at: string;
  result: string | null;
}

interface EvidenceSummary {
  total: number;
  totalAmount: number;
  agents: string[];
  timeRange: { earliest: string; latest: string } | null;
}

const agentLabels: Record<string, string> = {
  research: "Research Agent",
  code: "Code Agent",
  test: "Test Agent",
  review: "Review Agent",
};

const agentColors: Record<string, string> = {
  research: "bg-violet-500/10 text-violet-400",
  code: "bg-blue-500/10 text-blue-400",
  test: "bg-emerald-500/10 text-emerald-400",
  review: "bg-amber-500/10 text-amber-400",
};

export default function EvidencePage() {
  const [transactions, setTransactions] = useState<EvidenceTransaction[]>([]);
  const [summary, setSummary] = useState<EvidenceSummary>({
    total: 0,
    totalAmount: 0,
    agents: [],
    timeRange: null,
  });
  const [filterAgent, setFilterAgent] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAgent) params.set("agent", filterAgent);

      const res = await fetch(`/api/evidence?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setSummary(data.summary || { total: 0, totalAmount: 0, agents: [], timeRange: null });
      }
    } catch {
      // Evidence API unavailable
    } finally {
      setLoading(false);
    }
  }, [filterAgent]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const formatAmount = (a: string) => (a.startsWith("$") ? a : `$${a}`);
  const formatTime = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div className="min-h-screen bg-arc-dark">
      {/* Header */}
      <header className="border-b border-arc-border bg-arc-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Dashboard
            </Link>
            <div className="w-px h-4 bg-arc-border" />
            <h1 className="text-lg font-bold text-white">📊 Transaction Evidence</h1>
          </div>
          <a
            href="https://testnet.arcscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-arc-purple hover:text-arc-blue transition-colors"
          >
            Arc Explorer ↗
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-arc-card border border-arc-border rounded-xl p-5 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Verified Txns</p>
            <p className="text-4xl font-bold text-arc-purple">{summary.total}</p>
          </div>
          <div className="bg-arc-card border border-arc-border rounded-xl p-5 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Amount</p>
            <p className="text-4xl font-bold text-arc-blue">${summary.totalAmount.toFixed(4)}</p>
          </div>
          <div className="bg-arc-card border border-arc-border rounded-xl p-5 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Agents Used</p>
            <p className="text-4xl font-bold text-green-400">{summary.agents.length}</p>
          </div>
          <div className="bg-arc-card border border-arc-border rounded-xl p-5 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Avg Cost/Txn</p>
            <p className="text-4xl font-bold text-cyan-400">
              ${summary.total > 0 ? (summary.totalAmount / summary.total).toFixed(4) : "0.0000"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Filter by agent:</label>
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="bg-arc-card border border-arc-border rounded px-3 py-1.5 text-sm text-white"
          >
            <option value="">All Agents</option>
            <option value="research">Research Agent</option>
            <option value="code">Code Agent</option>
            <option value="test">Test Agent</option>
            <option value="review">Review Agent</option>
          </select>
          <button
            onClick={() => {
              const csv = [
                "Tx Hash,Agent,Amount,Status,Timestamp",
                ...transactions.map(
                  (t) =>
                    `${t.gateway_tx},${t.agent_type},${t.amount},${t.status},${t.created_at}`,
                ),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "agentwork-evidence.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={transactions.length === 0}
            className="ml-auto text-xs bg-arc-card border border-arc-border rounded px-3 py-1.5 text-slate-300 hover:text-white disabled:opacity-50 transition-colors"
          >
            📥 Download CSV
          </button>
        </div>

        {/* Transaction Table */}
        {loading ? (
          <div className="bg-arc-card border border-arc-border rounded-xl p-12 text-center">
            <p className="text-slate-400 text-sm">Loading evidence...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-arc-card border border-arc-border rounded-xl p-12 text-center">
            <p className="text-slate-500 text-lg mb-2">Awaiting On-Chain Transactions</p>
            <p className="text-slate-600 text-sm">
              Run the demo from the dashboard to generate verified transaction evidence.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-sm text-arc-purple hover:text-arc-blue transition-colors"
            >
              ← Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-arc-card border border-arc-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-arc-border">
                  <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-center px-4 py-3 text-xs text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-arc-border/50 hover:bg-arc-dark/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <a
                        href={`https://testnet.arcscan.io/tx/${tx.gateway_tx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-arc-purple hover:underline font-mono text-xs"
                      >
                        {tx.gateway_tx.slice(0, 10)}...{tx.gateway_tx.slice(-8)} ↗
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${agentColors[tx.agent_type] || "bg-slate-500/10 text-slate-400"}`}
                      >
                        {agentLabels[tx.agent_type] || tx.agent_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-300">
                      {formatAmount(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${tx.status === "completed" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {formatTime(tx.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer note */}
        {transactions.length > 0 && (
          <p className="text-xs text-slate-500 text-center">
            Every transaction above links to arcscan.io for independent verification.
            {summary.timeRange && (
              <>
                {" "}Evidence spans{" "}
                {new Date(summary.timeRange.earliest).toLocaleDateString()} —{" "}
                {new Date(summary.timeRange.latest).toLocaleDateString()}.
              </>
            )}
          </p>
        )}
      </main>
    </div>
  );
}
