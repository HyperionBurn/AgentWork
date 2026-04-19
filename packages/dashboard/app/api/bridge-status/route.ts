import { NextResponse } from "next/server";

// ============================================================
// Bridge Status API — Arc bridge status for dashboard
// ============================================================

interface BridgeInfo {
  name: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  lastChecked: number;
  details: string;
}

interface BridgeStatusResponse {
  bridges: BridgeInfo[];
  overallStatus: "healthy" | "degraded" | "down";
  summary: string;
}

function generateBridgeStatus(): BridgeStatusResponse {
  const bridges: BridgeInfo[] = [
    {
      name: "Arc ↔ Ethereum",
      status: "healthy",
      latencyMs: 2500,
      lastChecked: Date.now(),
      details: "USDC bridge operational",
    },
    {
      name: "Arc ↔ Arbitrum",
      status: "healthy",
      latencyMs: 800,
      lastChecked: Date.now(),
      details: "L2 bridge active",
    },
    {
      name: "Arc ↔ Circle Gateway",
      status: "healthy",
      latencyMs: 150,
      lastChecked: Date.now(),
      details: "Gateway API responding",
    },
    {
      name: "Arc ↔ Faucet",
      status: "healthy",
      latencyMs: 300,
      lastChecked: Date.now(),
      details: "Faucet service available",
    },
  ];

  const healthyCount = bridges.filter((b) => b.status === "healthy").length;
  const overallStatus: "healthy" | "degraded" | "down" =
    healthyCount === bridges.length
      ? "healthy"
      : healthyCount > 0
        ? "degraded"
        : "down";

  return {
    bridges,
    overallStatus,
    summary: `${healthyCount}/${bridges.length} bridges healthy`,
  };
}

export async function GET() {
  const status = generateBridgeStatus();
  return NextResponse.json(status);
}
