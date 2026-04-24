// ============================================================
// Revenue Streaming — Tick-based micro-drip payments
// ============================================================
// Accumulates payments while an agent is "working."
// When a GatewayClient is provided, each tick calls gateway.pay()
// producing a real on-chain transaction.
// Falls back to mock hashes when no gateway is available.
// ============================================================

import { GatewayClient } from "@circle-fin/x402-batching/client";
import { ARC_CONFIG, AGENT_ENDPOINTS } from "../config";
import { recordTaskEvent } from "./supabase-module";
import { isRealTransactionHash, resolveGatewaySettlement } from "../gateway-settlement";

// ── Types ────────────────────────────────────────────────────

export interface PaymentStream {
  streamId: string;
  agentType: string;
  ratePerSecond: number;
  startTime: number;
  endTime: number | null;
  payments: StreamPayment[];
  totalAmount: number;
  status: "active" | "stopped";
  // GC2: Token-aware streaming fields
  totalTokens?: number;
  tokensPerTick?: number;
  tokenSource?: string;
}

export interface StreamPayment {
  tick: number;
  amount: number;
  txHash: string;
  explorerUrl: string;
  timestamp: number;
  // GC2: Token-aware streaming fields
  tokensApprox?: number;
  costPerToken?: number;
  reasoning?: string;
}

// ── State ────────────────────────────────────────────────────

const streams = new Map<string, PaymentStream>();
const streamTimers = new Map<string, NodeJS.Timeout>();
let streamCounter = 0;

/** Shared gateway — set by setStreamGateway() before streaming starts. */
let sharedGateway: GatewayClient | null = null;

/**
 * Set the gateway client for real streaming payments.
 * Call this before startStream() to enable real on-chain ticks.
 */
export function setStreamGateway(gateway: GatewayClient): void {
  sharedGateway = gateway;
}

// ── Stream Management ────────────────────────────────────────

/**
 * Start a payment stream for an agent.
 * Ticks every 1 second. If a gateway is available (via parameter
 * or setStreamGateway), each tick produces a real on-chain tx.
 */
export function startStream(
  agentType: string,
  ratePerSecond: number = 0.001,
  gateway?: GatewayClient,
  // GC2: token-aware options
  tokenOptions?: { tokensPerTick?: number; tokenSource?: string },
): PaymentStream {
  streamCounter++;
  const streamId = `stream_${streamCounter}_${agentType}`;

  const activeGateway = gateway || sharedGateway;

  const stream: PaymentStream = {
    streamId,
    agentType,
    ratePerSecond,
    startTime: Date.now(),
    endTime: null,
    payments: [],
    totalAmount: 0,
    status: "active",
    // GC2: Token-aware fields
    totalTokens: 0,
    tokensPerTick: tokenOptions?.tokensPerTick ?? Math.floor(50 + Math.random() * 100),
    tokenSource: tokenOptions?.tokenSource ?? "agent-output",
  };

  streams.set(streamId, stream);

  // Find agent endpoint for real payments
  const endpoint = AGENT_ENDPOINTS.find((e) => e.type === agentType);
  const agentUrl = endpoint
    ? `${endpoint.baseUrl}${endpoint.apiPath}`
    : null;

  // Start ticking every second
  const timer = setInterval(async () => {
    await tickStream(streamId, activeGateway, agentUrl);
  }, 1000);

  streamTimers.set(streamId, timer);

  const mode = activeGateway ? "REAL" : "MOCK";
  console.log(`   🌊 Stream started: ${streamId} ($${ratePerSecond}/s, ~${stream.tokensPerTick} tokens/tick) [${mode}]`);

  return stream;
}

/**
 * Tick a stream — execute a real or mock micro-payment.
 */
async function tickStream(
  streamId: string,
  gateway: GatewayClient | null,
  agentUrl: string | null,
): Promise<StreamPayment | null> {
  const stream = streams.get(streamId);
  if (!stream || stream.status !== "active") return null;

  let txHash: string;
  let isMock = false;

  if (gateway && agentUrl) {
    try {
      const result = await gateway.pay(
        `${agentUrl}?input=stream-tick-${stream.payments.length + 1}`,
        { method: "GET" },
      );
      txHash = result.transaction || "";
      isMock = false;
    } catch (err) {
      txHash = `MOCK_0x${generateMockHash()}`;
      isMock = true;
    }
  } else {
    txHash = `MOCK_0x${generateMockHash()}`;
    isMock = true;
  }

  const payment: StreamPayment = {
    tick: stream.payments.length + 1,
    amount: stream.ratePerSecond,
    txHash,
    explorerUrl: isRealTransactionHash(txHash) ? `${ARC_CONFIG.explorerUrl}${txHash}` : "",
    timestamp: Date.now(),
    // GC2: Token-aware fields — estimate tokens per tick
    tokensApprox: stream.tokensPerTick ?? Math.floor(50 + Math.random() * 100),
    costPerToken: stream.ratePerSecond / (stream.tokensPerTick || 100),
    reasoning: `Tick #${stream.payments.length + 1} for ${stream.agentType} — ${stream.tokensPerTick || 0} tokens`,
  };

  stream.payments.push(payment);
  stream.totalAmount += stream.ratePerSecond;
  // GC2: Accumulate token count
  stream.totalTokens = (stream.totalTokens || 0) + (payment.tokensApprox || 0);

  if (!isMock) {
      if (!isRealTransactionHash(txHash)) {
        void resolveGatewaySettlement({
          gateway: gateway!,
          taskId: `${streamId}-tick-${payment.tick}`,
          gatewayRef: txHash,
          onSettled: (settledHash) => {
            payment.txHash = settledHash;
            payment.explorerUrl = `${ARC_CONFIG.explorerUrl}${settledHash}`;
          },
        }).catch((err) => {
          console.log(`   ⚠️  Background settlement resolution failed: ${err instanceof Error ? err.message : String(err)}`);
        });
      }

    recordTaskEvent({
      task_id: `${streamId}-tick-${payment.tick}`,
      agent_type: stream.agentType,
      status: "completed",
      gateway_tx: txHash,
      amount: `$${stream.ratePerSecond.toFixed(4)}`,
      result: `Stream tick #${payment.tick}`,
      tokens: payment.tokensApprox,
      error: null,
    }).catch(() => {});
  }

  return payment;
}

/**
 * Stop a payment stream and return the final state.
 */
export function stopStream(streamId: string): PaymentStream | null {
  const stream = streams.get(streamId);
  if (!stream) return null;

  stream.status = "stopped";
  stream.endTime = Date.now();

  // Clear the timer
  const timer = streamTimers.get(streamId);
  if (timer) {
    clearInterval(timer);
    streamTimers.delete(streamId);
  }

  const realTicks = stream.payments.filter((p) => !p.txHash.startsWith("MOCK_")).length;
  console.log(
    `   🌊 Stream stopped: ${streamId} (${stream.payments.length} ticks, ` +
    `${realTicks} real, total: $${stream.totalAmount.toFixed(4)})`,
  );

  return stream;
}

/**
 * Get a stream by ID.
 */
export function getStream(streamId: string): PaymentStream | null {
  return streams.get(streamId) || null;
}

/**
 * Get all active streams.
 */
export function getActiveStreams(): PaymentStream[] {
  return Array.from(streams.values()).filter((s) => s.status === "active");
}

/**
 * Stop all active streams.
 */
export function stopAllStreams(): PaymentStream[] {
  const active = getActiveStreams();
  for (const stream of active) {
    stopStream(stream.streamId);
  }
  return active;
}

/**
 * Get total streamed amount across all streams.
 */
export function getTotalStreamed(): number {
  let total = 0;
  for (const stream of streams.values()) {
    total += stream.totalAmount;
  }
  return total;
}

/**
 * Get streaming statistics.
 */
export function getStreamingStats(): {
  activeStreams: number;
  totalStreams: number;
  totalTicks: number;
  totalAmount: number;
  realTicks: number;
  // GC2: Token-aware stats
  totalTokens: number;
  avgCostPerToken: number;
  avgTokensPerTick: number;
} {
  let totalTicks = 0;
  let totalAmount = 0;
  let realTicks = 0;
  let totalTokens = 0;

  for (const stream of streams.values()) {
    totalTicks += stream.payments.length;
    totalAmount += stream.totalAmount;
    realTicks += stream.payments.filter((p) => !p.txHash.startsWith("MOCK_")).length;
    totalTokens += stream.totalTokens || 0;
  }

  return {
    activeStreams: getActiveStreams().length,
    totalStreams: streams.size,
    totalTicks,
    totalAmount,
    realTicks,
    // GC2: Token-aware stats
    totalTokens,
    avgCostPerToken: totalTicks > 0 ? totalAmount / totalTicks : 0,
    avgTokensPerTick: totalTicks > 0 ? Math.round(totalTokens / totalTicks) : 0,
  };
}

function generateMockHash(): string {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}
