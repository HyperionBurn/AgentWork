"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
// HF-10: Arc Network Health Monitor
// Shows real-time Arc testnet status — block height, gas price,
// RPC latency, and gateway health.
// ============================================================

interface NetworkHealth {
  rpcStatus: "online" | "degraded" | "offline";
  rpcLatencyMs: number;
  gatewayStatus: "online" | "degraded" | "offline";
  blockHeight: number | null;
  lastChecked: string;
  chainId: number;
}

const STATUS_STYLES = {
  online:   { dot: "bg-green-400", text: "text-green-400", label: "Online" },
  degraded: { dot: "bg-yellow-400", text: "text-yellow-400", label: "Degraded" },
  offline:  { dot: "bg-red-400", text: "text-red-400", label: "Offline" },
};

export function ArcHealthMonitor() {
  const [health, setHealth] = useState<NetworkHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    const startTime = Date.now();
    let rpcStatus: NetworkHealth["rpcStatus"] = "offline";
    let rpcLatencyMs = 0;
    let blockHeight: number | null = null;
    let gatewayStatus: NetworkHealth["gatewayStatus"] = "offline";

    // Check RPC
    try {
      const rpcStart = Date.now();
      const rpcRes = await fetch("https://rpc.testnet.arc.network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
        signal: AbortSignal.timeout(8000),
      });
      rpcLatencyMs = Date.now() - rpcStart;

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        if (rpcData.result) {
          blockHeight = parseInt(rpcData.result, 16);
          rpcStatus = rpcLatencyMs < 3000 ? "online" : "degraded";
        }
      }
    } catch {
      rpcStatus = "offline";
    }

    // Check Gateway API
    try {
      const gwRes = await fetch("https://gateway-api-testnet.circle.com", {
        method: "GET",
        signal: AbortSignal.timeout(8000),
      });
      gatewayStatus = gwRes.ok ? "online" : "degraded";
    } catch {
      gatewayStatus = "offline";
    }

    setHealth({
      rpcStatus,
      rpcLatencyMs,
      gatewayStatus,
      blockHeight,
      lastChecked: new Date().toISOString(),
      chainId: 5042002,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [checkHealth]);

  if (loading || !health) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white mb-2">🌐 Arc Network</h3>
        <p className="text-gray-500 text-xs animate-pulse">Checking network health…</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">🌐 Arc Network</h3>
        <span className="text-xs text-gray-500">
          {new Date(health.lastChecked).toLocaleTimeString()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* RPC */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${STATUS_STYLES[health.rpcStatus].dot} animate-pulse`} />
            <span className="text-xs text-gray-300">RPC Node</span>
          </div>
          <span className={`text-xs font-medium ${STATUS_STYLES[health.rpcStatus].text}`}>
            {STATUS_STYLES[health.rpcStatus].label}
          </span>
          <p className="text-xs text-gray-500">{health.rpcLatencyMs}ms</p>
        </div>

        {/* Gateway */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${STATUS_STYLES[health.gatewayStatus].dot} animate-pulse`} />
            <span className="text-xs text-gray-300">Gateway</span>
          </div>
          <span className={`text-xs font-medium ${STATUS_STYLES[health.gatewayStatus].text}`}>
            {STATUS_STYLES[health.gatewayStatus].label}
          </span>
        </div>

        {/* Block Height */}
        <div className="space-y-1">
          <span className="text-xs text-gray-400">Block Height</span>
          <p className="text-xs text-white font-mono">
            {health.blockHeight?.toLocaleString() ?? "N/A"}
          </p>
        </div>

        {/* Chain ID */}
        <div className="space-y-1">
          <span className="text-xs text-gray-400">Chain ID</span>
          <p className="text-xs text-white font-mono">{health.chainId}</p>
        </div>
      </div>

      <button
        onClick={checkHealth}
        className="mt-3 w-full py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
      >
        🔄 Recheck
      </button>
    </div>
  );
}
