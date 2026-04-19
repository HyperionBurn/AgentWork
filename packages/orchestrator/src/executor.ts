import { GatewayClient } from "@circle-fin/x402-batching/client";
import { ARC_CONFIG } from "./config";
import { Subtask } from "./config";
import { recordTaskEvent } from "./supabase";

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 2000;

// ============================================================
// Payment Executor
// ============================================================
// Uses the Circle Gateway x402 client to pay for each subtask.
// Each gateway.pay() call produces an on-chain transaction on Arc.
// ============================================================

export interface PaymentResult {
  subtaskId: string;
  agentType: string;
  success: boolean;
  amount: string;
  transactionHash: string | null;
  explorerUrl: string | null;
  error?: string;
  response?: unknown;
}

let gatewayClient: GatewayClient | null = null;

/**
 * Initialize the Gateway client with the orchestrator's private key.
 */
export async function initGateway(): Promise<GatewayClient> {
  if (gatewayClient) return gatewayClient;

  const privateKey = process.env.ORCHESTRATOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "ORCHESTRATOR_PRIVATE_KEY not set. See .env.example"
    );
  }

  gatewayClient = new GatewayClient({
    chain: "arcTestnet",
    privateKey: privateKey as `0x${string}`,
  });

  return gatewayClient;
}

/**
 * Deposit USDC into the Gateway for paying agents.
 */
export async function depositFunds(amount: string): Promise<string> {
  const gateway = await initGateway();
  const result = await gateway.deposit(amount);
  console.log(
    `💰 Deposited ${result.formattedAmount} USDC into Gateway | TX: ${result.depositTxHash}`
  );
  console.log(`   Explorer: ${ARC_CONFIG.explorerUrl}${result.depositTxHash}`);
  return result.depositTxHash;
}

/**
 * Execute a single subtask payment via x402.
 * Returns the payment result with on-chain transaction hash.
 */
export async function executePayment(
  subtask: Subtask
): Promise<PaymentResult> {
  const gateway = await initGateway();

  console.log(`\n💸 Paying ${subtask.agentType} agent: $${subtask.price}`);
  console.log(`   URL: ${subtask.url}`);

  try {
    const result = await gateway.pay(subtask.url, { method: "GET" });

    const txHash = result.transaction;
    console.log(`   ✅ Paid ${result.formattedAmount} USDC`);
    console.log(`   🔗 TX: ${txHash}`);
    console.log(`   🌐 Explorer: ${ARC_CONFIG.explorerUrl}${txHash}`);

    const paymentResult: PaymentResult = {
      subtaskId: subtask.id,
      agentType: subtask.agentType,
      success: true,
      amount: result.formattedAmount,
      transactionHash: txHash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${txHash}`,
      response: typeof result.data === "object" ? JSON.parse(JSON.stringify(result.data, (_, v) => typeof v === "bigint" ? v.toString() : v)) : result.data,
    };

    // Record to Supabase for dashboard feed (non-blocking)
    recordTaskEvent({
      task_id: subtask.id,
      agent_type: subtask.agentType,
      status: "completed",
      gateway_tx: txHash,
      amount: result.formattedAmount,
      result: result.data,
      error: null,
    }).catch(() => { /* already logged inside */ });

    return paymentResult;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`   ❌ Payment failed: ${message}`);

    const failedResult: PaymentResult = {
      subtaskId: subtask.id,
      agentType: subtask.agentType,
      success: false,
      amount: subtask.price,
      transactionHash: null,
      explorerUrl: null,
      error: message,
    };

    // Record failure to Supabase (non-blocking)
    recordTaskEvent({
      task_id: subtask.id,
      agent_type: subtask.agentType,
      status: "failed",
      gateway_tx: null,
      amount: subtask.price,
      result: null,
      error: message,
    }).catch(() => { /* already logged inside */ });

    return failedResult;
  }
}

/**
 * Execute a subtask payment with automatic retry on transient failures.
 * Uses exponential backoff: 2s, 4s, 8s between attempts.
 */
async function executePaymentWithRetry(subtask: Subtask): Promise<PaymentResult> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await executePayment(subtask);
    if (result.success) return result;

    if (attempt < MAX_RETRIES) {
      const delay = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
      console.log(`   ⏳ Retry ${attempt}/${MAX_RETRIES} in ${delay}ms...`);
      await sleep(delay);
    }
  }
  // Final attempt (or only attempt if MAX_RETRIES is 1)
  return executePayment(subtask);
}

// ============================================================
// Parallel Execution (#7)
// ============================================================
// Groups subtasks by dependency level and executes each level
// concurrently. Falls back to sequential when USE_PARALLEL=false.
// ============================================================

/**
 * Topologically sort subtasks into dependency levels.
 * Level 0 = no dependencies, Level 1 = depends on Level 0, etc.
 */
export function topologicalSort(subtasks: Subtask[]): Subtask[][] {
  const idSet = new Set(subtasks.map((s) => s.id));
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const s of subtasks) {
    inDegree.set(s.id, s.dependsOn.filter((d) => idSet.has(d)).length);
    dependents.set(s.id, []);
  }
  for (const s of subtasks) {
    for (const dep of s.dependsOn) {
      if (dependents.has(dep)) {
        dependents.get(dep)!.push(s.id);
      }
    }
  }

  const levels: Subtask[][] = [];
  const resolved = new Set<string>();
  const taskMap = new Map(subtasks.map((s) => [s.id, s]));

  while (resolved.size < subtasks.length) {
    const level: Subtask[] = [];
    for (const s of subtasks) {
      if (!resolved.has(s.id) && inDegree.get(s.id) === 0) {
        level.push(s);
      }
    }
    if (level.length === 0) {
      // Cycle detected — resolve remaining sequentially
      for (const s of subtasks) {
        if (!resolved.has(s.id)) level.push(s);
      }
    }
    levels.push(level);
    for (const s of level) {
      resolved.add(s.id);
      for (const depId of dependents.get(s.id) || []) {
        inDegree.set(depId, (inDegree.get(depId) || 1) - 1);
      }
    }
  }

  return levels;
}

/**
 * Execute all subtasks with parallel execution within dependency levels.
 * When USE_PARALLEL=false, processes sequentially (backward compat).
 */
export async function executeAllPaymentsParallel(
  subtasks: Subtask[]
): Promise<PaymentResult[]> {
  const useParallel = process.env.USE_PARALLEL !== "false";

  if (!useParallel) {
    return executeAllPayments(subtasks);
  }

  const levels = topologicalSort(subtasks);
  const results: PaymentResult[] = [];
  const summaries = new Map<string, string>();
  let totalSpent = 0;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`⚡ Executing ${subtasks.length} subtasks in ${levels.length} parallel levels`);
  console.log(`${"=".repeat(60)}`);

  for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
    const level = levels[levelIdx];
    const levelStart = Date.now();

    console.log(`\n  📊 Level ${levelIdx}: ${level.length} subtask(s) — ${level.map((s) => s.agentType).join(", ")}`);

    // Execute all subtasks in this level concurrently
    const levelResults = await Promise.all(
      level.map(async (subtask) => {
        // Inject context from completed dependencies
        let enrichedSubtask = subtask;
        if (subtask.dependsOn.length > 0) {
          const depSummaries = subtask.dependsOn
            .map((depId) => summaries.get(depId))
            .filter(Boolean)
            .join("; ");
          if (depSummaries) {
            const existingContext = subtask.context ? `${subtask.context} | ` : "";
            const url = new URL(subtask.url);
            url.searchParams.set("context", `${existingContext}${depSummaries}`);
            enrichedSubtask = { ...subtask, url: url.toString() };
          }
        }
        return executePaymentWithRetry(enrichedSubtask);
      }),
    );

    const elapsed = Date.now() - levelStart;
    console.log(`  ⏱️  Level ${levelIdx} completed in ${elapsed}ms`);

    for (let i = 0; i < levelResults.length; i++) {
      const result = levelResults[i];
      results.push(result);
      if (result.success) {
        totalSpent += parseFloat(result.amount.replace("$", ""));
        const summary = extractSummary(result.response);
        if (summary) summaries.set(level[i].id, summary);
      }
    }
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`⚡ Parallel execution complete: ${successful}/${results.length} successful`);
  console.log(`   Total spent: $${totalSpent.toFixed(4)}`);
  console.log(`${"=".repeat(60)}`);

  return results;
}

/**
 * Execute all subtasks in order (respecting dependencies).
 */
export async function executeAllPayments(
  subtasks: Subtask[]
): Promise<PaymentResult[]> {
  const results: PaymentResult[] = [];
  const summaries = new Map<string, string>(); // subtaskId → summary
  let successful = 0;
  let failed = 0;
  let totalSpent = 0;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 Executing ${subtasks.length} subtask payments`);
  console.log(`${"=".repeat(60)}`);

  for (const subtask of subtasks) {
    // Inject context from completed dependencies
    let enrichedSubtask = subtask;
    if (subtask.dependsOn.length > 0) {
      const depSummaries = subtask.dependsOn
        .map((depId) => summaries.get(depId))
        .filter(Boolean)
        .join("; ");
      if (depSummaries) {
        const existingContext = subtask.context ? `${subtask.context} | ` : "";
        const url = new URL(subtask.url);
        url.searchParams.set("context", `${existingContext}${depSummaries}`);
        enrichedSubtask = { ...subtask, url: url.toString() };
      }
    }

    const result = await executePaymentWithRetry(enrichedSubtask);
    results.push(result);

    if (result.success) {
      successful++;
      totalSpent += parseFloat(result.amount.replace("$", ""));
      // Extract summary from response for dependent subtasks
      const summary = extractSummary(result.response);
      if (summary) {
        summaries.set(subtask.id, summary);
        console.log(`   📝 Context captured: ${summary.slice(0, 80)}...`);
      }
    } else {
      failed++;
    }

    // Brief delay between payments for visual effect in demo
    await sleep(1500);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 Execution Complete`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   💰 Total Spent: $${totalSpent.toFixed(3)}`);
  console.log(`   🔗 On-Chain Transactions: ${successful}`);
  console.log(`${"=".repeat(60)}\n`);

  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract a brief summary from an agent response for context passing.
 * Handles all four agent response types (research, code, test, review).
 */
function extractSummary(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const result = (data as { result?: unknown }).result;
  if (!result || typeof result !== "object") return null;

  const r = result as Record<string, unknown>;
  if (typeof r.summary === "string") return r.summary;
  if (typeof r.quality_score === "number")
    return `Quality score: ${r.quality_score}/100, approved: ${r.approved ?? false}`;
  if (typeof r.tests_generated === "number")
    return `${r.tests_generated} tests generated, ${r.passing} passing, ${r.coverage ?? 0}% coverage`;
  if (typeof r.test_coverage === "number") {
    const filesModified = r.files_modified;
    const fileCount = Array.isArray(filesModified) ? filesModified.length : 0;
    return `Code generated, ${fileCount} files, ${r.test_coverage * 100}% coverage`;
  }
  return null;
}
