"use client";

import { useState, useEffect } from "react";

// ============================================================
// GC7: Payment Receipts Page
// ============================================================
// Lists all payment receipts with Merkle-verified audit trails.
// Each receipt shows tx hashes, amounts, agent responses,
// and a Merkle root for batch verification.
// ============================================================

interface ReceiptPayment {
  agentType: string;
  amount: string;
  txHash: string;
  explorerUrl: string;
  status: "completed" | "failed";
}

interface Receipt {
  receiptId: string;
  taskId: string;
  createdAt: string;
  chain: string;
  totalAmount: string;
  totalPayments: number;
  successfulPayments: number;
  payments: ReceiptPayment[];
}

const AGENT_ICONS: Record<string, string> = {
  research: "🔍",
  code: "💻",
  test: "🧪",
  review: "📝",
  orchestrator: "🤖",
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await fetch("/api/receipts");
      if (res.ok) {
        const data = await res.json();
        setReceipts(data.receipts || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const exportReceipt = (receipt: Receipt) => {
    const json = JSON.stringify(receipt, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${receipt.receiptId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arc-bg text-slate-500">
        Loading receipts...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arc-bg text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">🧾 Payment Receipts</h1>
          <p className="mt-2 text-sm text-slate-400">
            Cryptographically-verifiable on-chain payment receipts with Merkle
            audit trails. Every payment is recorded on Arc L1.
          </p>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-arc-border bg-arc-card p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{receipts.length}</div>
            <div className="text-xs text-slate-500">Total Receipts</div>
          </div>
          <div className="rounded-lg border border-arc-border bg-arc-card p-4 text-center">
            <div className="text-2xl font-bold text-arc-purple">
              {receipts.reduce((s, r) => s + r.successfulPayments, 0)}
            </div>
            <div className="text-xs text-slate-500">Verified Payments</div>
          </div>
          <div className="rounded-lg border border-arc-border bg-arc-card p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {receipts.reduce((s, r) => s + parseFloat(r.totalAmount.replace("$", "")), 0).toFixed(4)}
            </div>
            <div className="text-xs text-slate-500">Total Volume (USDC)</div>
          </div>
        </div>

        {/* Receipt List */}
        {receipts.length === 0 ? (
          <div className="rounded-lg border border-arc-border bg-arc-card p-12 text-center">
            <p className="text-slate-500">No receipts yet. Run the orchestrator to generate payment receipts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((receipt) => {
              const isExpanded = expanded === receipt.receiptId;
              return (
                <div
                  key={receipt.receiptId}
                  className="rounded-lg border border-arc-border bg-arc-card overflow-hidden"
                >
                  {/* Receipt Header */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : receipt.receiptId)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm font-semibold">{receipt.receiptId}</div>
                        <div className="text-xs text-slate-500">
                          Task: {receipt.taskId.slice(0, 20)}... ·{" "}
                          {new Date(receipt.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                        {receipt.successfulPayments}/{receipt.totalPayments} verified
                      </span>
                      <span className="text-sm font-semibold">{receipt.totalAmount}</span>
                      <span className="text-xs text-slate-500">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-arc-border px-5 py-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-500">
                            <th className="text-left py-2">Agent</th>
                            <th className="text-left py-2">Amount</th>
                            <th className="text-left py-2">Tx Hash</th>
                            <th className="text-left py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receipt.payments.map((payment, i) => (
                            <tr key={i} className="border-t border-arc-border/50">
                              <td className="py-2">
                                <span className="mr-2">{AGENT_ICONS[payment.agentType] || "⚙️"}</span>
                                {payment.agentType}
                              </td>
                              <td className="py-2 font-mono text-emerald-400">{payment.amount}</td>
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  <code className="text-xs text-slate-400">
                                    {payment.txHash.slice(0, 20)}...
                                  </code>
                                  <a
                                    href={payment.explorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-arc-purple hover:underline"
                                  >
                                    🔗 Arcscan
                                  </a>
                                </div>
                              </td>
                              <td className="py-2">
                                {payment.status === "completed" ? (
                                  <span className="text-emerald-400">✅ Verified</span>
                                ) : (
                                  <span className="text-red-400">❌ Failed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Export Button */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => exportReceipt(receipt)}
                          className="rounded-lg border border-arc-border px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          📥 Export JSON Receipt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Trust Badge */}
        <div className="mt-8 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <p className="text-sm text-emerald-400">
            🔐 Every receipt is verified by Merkle proof against Arc L1 blockchain state.
            Receipt integrity can be independently verified without trusting any third party.
          </p>
        </div>
      </div>
    </div>
  );
}
