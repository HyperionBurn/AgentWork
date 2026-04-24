// ============================================================
// Nanopayment Stress Test — High-Volume Transaction Generator
// ============================================================
// Fires rapid parallel gateway.pay() calls to demonstrate
// Arc's capacity for high-volume nanopayments. Each call
// produces a real on-chain transaction.
// ============================================================

import { GatewayClient } from "@circle-fin/x402-batching/client";
import { ARC_CONFIG, AGENT_ENDPOINTS } from "./config";
import { recordTaskEvent } from "./supabase";

// ── Types ────────────────────────────────────────────────────

export interface StressTestPayment {
  index: number;
  agentType: string;
  amount: string;
  txHash: string;
  explorerUrl: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface StressTestResult {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalTimeMs: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  throughput: number; // txns/sec
  totalCost: string;
  payments: StressTestPayment[];
  startedAt: number;
  completedAt: number;
}

// ── Configuration ────────────────────────────────────────────

const DEFAULT_PAYMENT_COUNT = 50;
const BATCH_SIZE = 10;
const PAYMENT_AMOUNT = "$0.001";

// ── Stress Test Runner ───────────────────────────────────────

/**
 * Run a nanopayment stress test.
 * Fires N gateway.pay() calls in parallel batches to
 * demonstrate Arc's throughput for AI agent economies.
 *
 * Each payment is a real $0.001 nanopayment with a real tx hash.
 */
export async function runNanopaymentStressTest(
  gateway: GatewayClient,
  agentUrls: Array<{ type: string; url: string }>,
  paymentCount: number = DEFAULT_PAYMENT_COUNT,
): Promise<StressTestResult> {
  const startedAt = Date.now();
  const payments: StressTestPayment[] = [];

  console.log(`\n${"=".repeat(55)}`);
  console.log(`⚡ NANOPAYMENT STRESS TEST`);
  console.log(`   Payments: ${paymentCount} × ${PAYMENT_AMOUNT}`);
  console.log(`   Batch size: ${BATCH_SIZE} parallel`);
  console.log(`${"=".repeat(55)}\n`);

  // Distribute payments across available agents round-robin
  const agentList = agentUrls.length > 0
    ? agentUrls
    : AGENT_ENDPOINTS.map((e) => ({
        type: e.type,
        url: `${e.baseUrl}${e.apiPath}`,
      }));

  let paymentIndex = 0;

  // Process in batches for controlled parallelism
  while (paymentIndex < paymentCount) {
    const batch: Promise<StressTestPayment>[] = [];

    for (let i = 0; i < BATCH_SIZE && paymentIndex < paymentCount; i++) {
      const agent = agentList[paymentIndex % agentList.length];
      batch.push(
        executeStressPayment(gateway, paymentIndex, agent.type, agent.url),
      );
      paymentIndex++;
    }

    // Fire batch in parallel
    const batchResults = await Promise.allSettled(batch);

    for (const result of batchResults) {
      const payment = result.status === "fulfilled"
        ? result.value
        : {
            index: payments.length,
            agentType: "unknown",
            amount: PAYMENT_AMOUNT,
            txHash: "",
            explorerUrl: "",
            latencyMs: 0,
            success: false,
            error: result.reason?.message || "Unknown error",
          };
      payments.push(payment);

      const icon = payment.success ? "✅" : "❌";
      console.log(
        `   ${icon} #${payment.index.toString().padStart(2, "0")} ` +
        `${payment.agentType.padEnd(10)} ` +
        `${payment.txHash ? payment.txHash.slice(0, 18) + "..." : "FAILED".padEnd(21)} ` +
        `${payment.latencyMs}ms`,
      );
    }

    // Brief pause between batches to avoid rate limits
    if (paymentIndex < paymentCount) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const completedAt = Date.now();
  const totalTimeMs = completedAt - startedAt;

  // Calculate stats
  const successful = payments.filter((p) => p.success);
  const failed = payments.filter((p) => !p.success);
  const latencies = successful.map((p) => p.latencyMs);
  const avgLatencyMs = latencies.length > 0
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;
  const minLatencyMs = latencies.length > 0 ? Math.min(...latencies) : 0;
  const maxLatencyMs = latencies.length > 0 ? Math.max(...latencies) : 0;
  const throughput = totalTimeMs > 0 ? (successful.length / totalTimeMs) * 1000 : 0;
  const totalCostNum = successful.length * 0.001;

  const result: StressTestResult = {
    totalPayments: paymentCount,
    successfulPayments: successful.length,
    failedPayments: failed.length,
    totalTimeMs,
    avgLatencyMs: Math.round(avgLatencyMs),
    minLatencyMs,
    maxLatencyMs,
    throughput: Math.round(throughput * 100) / 100,
    totalCost: `$${totalCostNum.toFixed(3)}`,
    payments,
    startedAt,
    completedAt,
  };

  // Summary
  console.log(`\n${"─".repeat(55)}`);
  console.log(`📊 Stress Test Results:`);
  console.log(`   Success: ${result.successfulPayments}/${result.totalPayments}`);
  console.log(`   Total time: ${(result.totalTimeMs / 1000).toFixed(1)}s`);
  console.log(`   Avg latency: ${result.avgLatencyMs}ms`);
  console.log(`   Throughput: ${result.throughput} txns/sec`);
  console.log(`   Total cost: ${result.totalCost}`);
  console.log(`   vs Ethereum: ~$${(result.successfulPayments * 3.5).toFixed(2)} ($3.50/tx, 0.3 txns/sec)`);
  console.log(`   vs L2: ~$${(result.successfulPayments * 0.10).toFixed(2)} ($0.10/tx)`);
  console.log(`${"─".repeat(55)}\n`);

  // Record to Supabase (non-blocking)
  recordTaskEvent({
    task_id: `stress-test-${startedAt}`,
    agent_type: "stress-test",
    status: "completed",
    gateway_tx: successful[0]?.txHash || "",
    amount: result.totalCost,
    result: `${result.successfulPayments}/${result.totalPayments} payments, ${result.throughput} txns/sec`,
    error: null,
  }).catch(() => {});

  return result;
}

// ── Single Payment ────────────────────────────────────────────

async function executeStressPayment(
  gateway: GatewayClient,
  index: number,
  agentType: string,
  agentUrl: string,
): Promise<StressTestPayment> {
  const startMs = Date.now();

  try {
    const result = await gateway.pay(
      `${agentUrl}?input=stress-test-tick-${index}`,
      { method: "GET" },
    );
    const latencyMs = Date.now() - startMs;

    return {
      index,
      agentType,
      amount: PAYMENT_AMOUNT,
      txHash: result.transaction || "",
      explorerUrl: `${ARC_CONFIG.explorerUrl}${result.transaction}`,
      latencyMs,
      success: true,
    };
  } catch (error) {
    const latencyMs = Date.now() - startMs;
    return {
      index,
      agentType,
      amount: PAYMENT_AMOUNT,
      txHash: "",
      explorerUrl: "",
      latencyMs,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
