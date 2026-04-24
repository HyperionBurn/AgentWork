import { GatewayClient } from "@circle-fin/x402-batching/client";
import { ARC_CONFIG } from "./config";
import { Subtask } from "./config";
import { recordTaskEvent } from "./supabase";
import { isRealTransactionHash, resolveGatewaySettlement } from "./gateway-settlement";

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 2000;

// ============================================================
// Payment Executor
// ============================================================
// Uses the Circle Gateway x402 client to pay for each subtask.
// gateway.pay() returns an immediate payment reference; if it is not already
// a settled tx hash, we resolve settlement in the background and update Supabase.
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
 * Polls for transaction hash with 3-second delay before falling back to pending settlement.
 */
export async function executePayment(
  subtask: Subtask
): Promise<PaymentResult> {
  const gateway = await initGateway();

  console.log(`\n💸 Paying ${subtask.agentType} agent: $${subtask.price}`);
  console.log(`   URL: ${subtask.url}`);

  try {
    const result = await gateway.pay(subtask.url, { method: "GET" });

    // Gateway SDK returns an immediate payment reference in result.transaction.
    // If it is not already a settled hash, resolve settlement in the background.
    const txHash = result.transaction || null;
    const settled = isRealTransactionHash(txHash);

    const explorerUrl = isRealTransactionHash(txHash) ? `${ARC_CONFIG.explorerUrl}${txHash}` : null;

    console.log(`   ✅ Paid ${result.formattedAmount} USDC`);
    if (txHash && settled) {
      console.log(`   🔗 TX: ${txHash}`);
      console.log(`   🌐 Explorer: ${ARC_CONFIG.explorerUrl}${txHash}`);
    } else if (txHash) {
      console.log(`   🔗 Gateway Ref: ${txHash}`);
      console.log(`   ℹ️  Settlement pending — ref stored, will update on-chain later`);
    } else {
      console.log(`   ⚠️  No transaction reference returned from Gateway`);
    }

    const paymentResult: PaymentResult = {
      subtaskId: subtask.id,
      agentType: subtask.agentType,
      success: true,
      amount: result.formattedAmount,
      transactionHash: txHash,
      explorerUrl,
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

    if (txHash && !settled) {
      void resolveGatewaySettlement({
        gateway,
        taskId: subtask.id,
        gatewayRef: txHash,
        onSettled: (settledHash) => {
          paymentResult.transactionHash = settledHash;
          paymentResult.explorerUrl = `${ARC_CONFIG.explorerUrl}${settledHash}`;
        },
      }).catch((err) => {
        console.log(`   ⚠️  Background settlement resolution failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    }

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
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  // Final attempt (or only attempt if MAX_RETRIES is 1)
  return executePayment(subtask);
}

// ============================================================
// Adaptive Workflow Execution (#7)
// ============================================================
// Groups subtasks by dependency level and executes each level
// concurrently (Parallel Hybrid Mode). 
// Level 0 = no dependencies, Level 1 = depends on Level 0, etc.
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
 * Execute all subtasks using an adaptive hybrid approach.
 * Respects topological dependencies while maximizing concurrency.
 */
export async function executeAdaptiveWorkflow(
  subtasks: Subtask[],
  forceSequential: boolean = false
): Promise<PaymentResult[]> {
  if (forceSequential) {
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
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 Execution Complete`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   💰 Total Spent: $${totalSpent.toFixed(3)}`);
  console.log(`   🔗 On-Chain Transactions: ${successful}`);
  const realHashes = results.filter(
    (r) => r.success && r.transactionHash &&
           !r.transactionHash.startsWith("MOCK") &&
           !r.transactionHash.startsWith("0x_")
  );
  console.log(`   ✅ Real On-Chain Hashes: ${realHashes.length}/${successful}`);
  if (realHashes.length < successful) {
    console.log(`   ⚠️  ${successful - realHashes.length} payment(s) still pending settlement — check Gateway API`);
  }

  return results;
}

/**
 * Extract a brief summary from an agent response for context passing.
 * Handles all four agent response types (research, code, test, review).
 */
function extractSummary(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;

  const payload = response as Record<string, unknown>;
  const data = isRecord(payload.data) ? payload.data : payload;
  const result = isRecord((data as Record<string, unknown>).result)
    ? (data as Record<string, unknown>).result
    : data;

  const r = result as Record<string, unknown>;
  if (typeof r.code === "string") {
    const code = truncateForContext(r.code, 1200);
    const language = typeof r.language === "string" ? r.language : "text";
    const filesModified = Array.isArray(r.files_modified) ? r.files_modified.join(", ") : "";
    const summary = typeof r.summary === "string" ? r.summary : "Code generated";
    return [
      summary,
      `Language: ${language}`,
      filesModified ? `Files: ${filesModified}` : null,
      `Code excerpt:\n${code}`,
    ].filter(Boolean).join("\n");
  }

  if (typeof r.test_suite === "string") {
    const suite = truncateForContext(r.test_suite, 1200);
    const header = typeof r.summary === "string"
      ? r.summary
      : `${r.tests_generated ?? 0} tests generated, ${r.passing ?? 0} passing`;
    return [header, `Test suite:\n${suite}`].join("\n");
  }

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

function truncateForContext(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
