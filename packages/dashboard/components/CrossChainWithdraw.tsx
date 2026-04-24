"use client";

import { useState, useEffect } from "react";

// ============================================================
// GC9: Cross-Chain Withdrawal Component
// ============================================================
// One-click withdrawal from Arc Gateway to 7 supported chains
// using Circle Bridge Kit / CCTP.
// ============================================================

interface Chain {
  id: string;
  name: string;
  testnetName: string;
  chainId: number;
  estimatedFee: string;
  estimatedTime: string;
  color: string;
  enabled: boolean;
}

export default function CrossChainWithdraw() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [amount, setAmount] = useState("");
  const [gatewayBalance, setGatewayBalance] = useState("$0.0000");
  const [withdrawing, setWithdrawing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    steps?: Array<{
      name: string;
      state: string;
      txHash?: string;
      explorerUrl?: string;
    }>;
  } | null>(null);

  useEffect(() => {
    fetchChains();
  }, []);

  const fetchChains = async () => {
    try {
      const res = await fetch("/api/cross-chain");
      if (res.ok) {
        const data = await res.json();
        setChains(data.chains || []);
        setGatewayBalance(data.gatewayBalance || "$0.0000");
      }
    } catch {
      // Silent fail
    }
  };

  const handleWithdraw = async () => {
    if (!selectedChain || !amount) return;

    setWithdrawing(true);
    setResult(null);

    try {
      const res = await fetch("/api/cross-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId: selectedChain.chainId,
          amount: `$${parseFloat(amount).toFixed(4)}`,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        setResult({
          success: true,
          message: `✅ Bridge completed! ${data.amount ?? amount} USDC → ${data.destinationChain ?? selectedChain.testnetName}`,
          steps: data.steps,
        });
      } else if (data.status === "error") {
        setResult({
          success: false,
          message: `❌ ${data.message ?? "Bridge failed"}`,
          steps: data.steps,
        });
      } else {
        // simulated
        setResult({
          success: false,
          message: `⚠️ Simulated: ${data.message ?? "Bridge not configured"}`,
        });
      }
    } catch {
      setResult({ success: false, message: "❌ Withdrawal failed" });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Gateway Balance */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">Arc Gateway Balance</div>
          <div className="text-xl font-bold text-emerald-400">{gatewayBalance}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Source Chain</div>
          <div className="text-sm font-medium">Arc Testnet · USDC</div>
        </div>
      </div>

      {/* Chain Selector */}
      <div>
        <label className="mb-2 block text-xs text-slate-500">Withdraw to:</label>
        <div className="grid grid-cols-3 gap-2">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => setSelectedChain(chain)}
              disabled={!chain.enabled}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all ${
                selectedChain?.id === chain.id
                  ? "border-arc-purple bg-arc-purple/20 text-white"
                  : chain.enabled
                    ? "border-arc-border bg-arc-bg text-slate-400 hover:border-slate-600"
                    : "border-arc-border/30 bg-arc-bg/50 text-slate-600 cursor-not-allowed"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: chain.color }}
              />
              {chain.name}
            </button>
          ))}
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="mb-1 block text-xs text-slate-500">Amount (USDC):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.01"
          step="0.001"
          min="0.001"
          className="w-full rounded-md border border-arc-border bg-arc-bg px-3 py-2 text-sm text-white focus:border-arc-purple focus:outline-none"
        />
      </div>

      {/* Withdraw Info */}
      {selectedChain && amount && (
        <div className="rounded-lg border border-arc-border/50 bg-arc-bg p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Destination:</span>
            <span>{selectedChain.testnetName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Bridge Fee:</span>
            <span>{selectedChain.estimatedFee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Est. Time:</span>
            <span>{selectedChain.estimatedTime}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-slate-500">You Receive:</span>
            <span className="text-emerald-400">
              ${Math.max(0, parseFloat(amount) - parseFloat(selectedChain.estimatedFee.replace("$", ""))).toFixed(4)} USDC
            </span>
          </div>
        </div>
      )}

      {/* Withdraw Button */}
      <button
        onClick={handleWithdraw}
        disabled={!selectedChain || !amount || withdrawing}
        className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-all ${
          !selectedChain || !amount
            ? "cursor-not-allowed bg-slate-800 text-slate-500"
            : withdrawing
              ? "bg-yellow-600 text-black animate-pulse"
              : "bg-arc-purple text-white hover:bg-arc-purple/80"
        }`}
      >
        {withdrawing ? "⏳ Bridging..." : "🌉 Withdraw via Circle Bridge Kit"}
      </button>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg border p-3 text-xs ${
            result.success
              ? "border-emerald-700/50 bg-emerald-950/30 text-emerald-300"
              : result.message.startsWith("⚠️")
                ? "border-yellow-700/50 bg-yellow-950/30 text-yellow-300"
                : "border-red-700/50 bg-red-950/30 text-red-300"
          }`}
        >
          <div className="font-medium">{result.message}</div>
          {result.steps && result.steps.length > 0 && (
            <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                Bridge Steps
              </div>
              {result.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      step.state === "complete" || step.state === "success"
                        ? "bg-emerald-400"
                        : step.state === "error"
                          ? "bg-red-400"
                          : "bg-yellow-400"
                    }`}
                  />
                  <span className="text-slate-400">{step.name}</span>
                  {step.explorerUrl && (
                    <a
                      href={step.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-[10px] text-arc-purple hover:underline"
                    >
                      view tx ↗
                    </a>
                  )}
                  {step.txHash && !step.explorerUrl && (
                    <span className="ml-auto font-mono text-[10px] text-slate-500">
                      {step.txHash.slice(0, 10)}…
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CCTP Note */}
      <p className="text-[10px] text-slate-600 text-center">
        Powered by Circle CCTP (Cross-Chain Transfer Protocol) · Native USDC bridge
      </p>
    </div>
  );
}
