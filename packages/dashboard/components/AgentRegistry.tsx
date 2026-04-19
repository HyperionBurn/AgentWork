"use client";

import { useState, useEffect } from "react";

// ============================================================
// AgentRegistry — Displays on-chain agent identities
// ============================================================
// Shows registered agent NFTs from IdentityRegistry contract.
// Falls back to showing agent metadata from health endpoints
// when contracts are not deployed.
// ============================================================

interface AgentIdentity {
  name: string;
  type: string;
  tokenId: number | null;
  owner: string;
  capabilities: string[];
  registeredAt: string;
  mock: boolean;
}

interface AgentRegistryProps {
  agents: Array<{
    type: string;
    label: string;
    status: string;
    port: number;
  }>;
}

export function AgentRegistry({ agents }: AgentRegistryProps) {
  const [identities, setIdentities] = useState<AgentIdentity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIdentities() {
      try {
        const res = await fetch("/api/agent-identity");
        if (res.ok) {
          const data = await res.json();
          setIdentities(data.identities || []);
        }
      } catch {
        // Use fallback identities
      } finally {
        setLoading(false);
      }
    }
    fetchIdentities();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🆔 Agent Registry
        </h3>
        <div className="text-gray-400 text-sm">Loading identities...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🆔 Agent Registry
        </h3>
        <span className="text-xs text-gray-400">
          {identities.filter((i) => !i.mock).length} on-chain
        </span>
      </div>
      <div className="space-y-3">
        {identities.length > 0 ? (
          identities.map((identity) => (
            <div
              key={identity.type}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-sm">
                  {identity.mock ? "📋" : "🆔"}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {identity.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {identity.capabilities.slice(0, 3).join(" · ")}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {identity.tokenId !== null ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    NFT #{identity.tokenId}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                    Mock
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400">
            No identities registered. Deploy contracts to enable on-chain identity.
          </div>
        )}
      </div>
    </div>
  );
}
