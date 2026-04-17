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
      response: result,
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
