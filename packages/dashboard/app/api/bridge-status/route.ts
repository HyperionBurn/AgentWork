import { NextResponse } from "next/server";

// ============================================================
// Bridge Status API — Real health checks for Arc infrastructure
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

async function checkEndpoint(name: string, url: string, timeoutMs: number): Promise<BridgeInfo> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal, method: "GET" });
    clearTimeout(timer);
    const latency = Date.now() - start;
    if (res.ok) {
      return { name, status: "healthy", latencyMs: latency, lastChecked: Date.now(), details: `${res.status} OK — responding` };
    }
    return { name, status: "degraded", latencyMs: latency, lastChecked: Date.now(), details: `HTTP ${res.status}` };
  } catch (err) {
    const latency = Date.now() - start;
    const reason = err instanceof DOMException && err.name === "AbortError" ? "timeout" : err instanceof Error ? err.message : "unknown";
    return { name, status: "down", latencyMs: latency, lastChecked: Date.now(), details: reason };
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkEndpoint("Arc ↔ RPC", process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network", 5000),
    checkEndpoint("Arc ↔ Circle Gateway", process.env.GATEWAY_URL || "https://gateway-api-testnet.circle.com", 5000),
    checkEndpoint("Arc ↔ Faucet", process.env.ARC_FAUCET || "https://faucet.circle.com", 5000),
    checkEndpoint("Arc ↔ Explorer", "https://testnet.arcscan.io", 5000),
  ]);

  const healthyCount = checks.filter((b) => b.status === "healthy").length;
  const overallStatus: "healthy" | "degraded" | "down" =
    healthyCount === checks.length ? "healthy" : healthyCount > 0 ? "degraded" : "down";

  return NextResponse.json({
    bridges: checks,
    overallStatus,
    summary: `${healthyCount}/${checks.length} services healthy`,
  });
}
