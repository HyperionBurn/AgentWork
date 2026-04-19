// ============================================================
// Revenue Streaming — Tick-based micro-drip payments
// ============================================================
// Accumulates payments while an agent is "working."
// Each tick generates a mock on-chain transaction.
// ============================================================

import { ARC_CONFIG } from "../config";

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
}

export interface StreamPayment {
  tick: number;
  amount: number;
  txHash: string;
  explorerUrl: string;
  timestamp: number;
}

// ── State ────────────────────────────────────────────────────

const streams = new Map<string, PaymentStream>();
const streamTimers = new Map<string, NodeJS.Timeout>();
let streamCounter = 0;

// ── Stream Management ────────────────────────────────────────

/**
 * Start a payment stream for an agent.
 * Ticks every 1 second, generating $0.001 payments.
 */
export function startStream(
  agentType: string,
  ratePerSecond: number = 0.001,
): PaymentStream {
  streamCounter++;
  const streamId = `stream_${streamCounter}_${agentType}`;

  const stream: PaymentStream = {
    streamId,
    agentType,
    ratePerSecond,
    startTime: Date.now(),
    endTime: null,
    payments: [],
    totalAmount: 0,
    status: "active",
  };

  streams.set(streamId, stream);

  // Start ticking every second
  const timer = setInterval(() => {
    tickStream(streamId);
  }, 1000);

  streamTimers.set(streamId, timer);
  console.log(`   🌊 Stream started: ${streamId} ($${ratePerSecond}/s)`);

  return stream;
}

/**
 * Tick a stream — record a micro-payment.
 */
function tickStream(streamId: string): StreamPayment | null {
  const stream = streams.get(streamId);
  if (!stream || stream.status !== "active") return null;

  const txHash = `MOCK_0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("")}`;

  const payment: StreamPayment = {
    tick: stream.payments.length + 1,
    amount: stream.ratePerSecond,
    txHash,
    explorerUrl: `${ARC_CONFIG.explorerUrl}${txHash}`,
    timestamp: Date.now(),
  };

  stream.payments.push(payment);
  stream.totalAmount += stream.ratePerSecond;

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

  console.log(`   🌊 Stream stopped: ${streamId} (${stream.payments.length} ticks, total: $${stream.totalAmount.toFixed(4)})`);

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
} {
  let totalTicks = 0;
  let totalAmount = 0;

  for (const stream of streams.values()) {
    totalTicks += stream.payments.length;
    totalAmount += stream.totalAmount;
  }

  return {
    activeStreams: getActiveStreams().length,
    totalStreams: streams.size,
    totalTicks,
    totalAmount,
  };
}
