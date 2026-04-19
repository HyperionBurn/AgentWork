"use client";

import { useState, useEffect } from "react";

// ============================================================
// WalletConnect — Wallet connection display & management
// ============================================================

interface WalletState {
  address: string;
  balance: number;
  network: string;
  chainId: number;
}

export default function WalletConnect() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Mock wallet state for demo
    setWallet({
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
      balance: 5.42,
      network: "Arc Testnet",
      chainId: 5042002,
    });
    setConnected(true);
  }, []);

  const toggleConnection = () => {
    if (connected) {
      setConnected(false);
      setWallet(null);
    } else {
      setWallet({
        address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
        balance: 5.42,
        network: "Arc Testnet",
        chainId: 5042002,
      });
      setConnected(true);
    }
  };

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        🔗 Wallet
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4">
        {connected && wallet ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-400">Connected</span>
              </div>
              <button
                onClick={toggleConnection}
                className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
              >
                Disconnect
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Address</span>
                <span className="text-white font-mono">
                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Balance</span>
                <span className="text-green-400 font-bold">${wallet.balance.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Network</span>
                <span className="text-arc-purple">{wallet.network}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Chain ID</span>
                <span className="text-white">{wallet.chainId}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-500 text-sm mb-3">No wallet connected</p>
            <button
              onClick={toggleConnection}
              className="px-4 py-2 rounded-lg bg-arc-purple text-white text-sm font-medium hover:bg-arc-purple/80 transition"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
