"use client";

// ============================================================
// Governance Page — On-chain governance, staking, wallet mgmt
// ============================================================

import GovernancePanel from "@/components/GovernancePanel";
import AgentStaking from "@/components/AgentStaking";
import WalletConnect from "@/components/WalletConnect";

export default function GovernancePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">🏛️ Governance</h1>
          <p className="mt-2 text-sm text-slate-400">
            On-chain governance, agent staking, and wallet management
          </p>
        </div>

        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <WalletConnect />
            <AgentStaking />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <GovernancePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
