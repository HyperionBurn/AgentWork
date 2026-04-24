// ============================================================
// Escrow Refund Automation — Auto-refund for failed tasks
// ============================================================
// Processes automatic refunds for failed or disputed tasks.
// Supports time-locked refund timers and batch refund processing.
// ============================================================

import { ARC_CONFIG, isContractDeployed } from "../config";

// ── Types ────────────────────────────────────────────────────

export interface RefundResult {
  taskId: string;
  agentType?: string;
  amount: string;
  reason: string;
  txHash: string;
  explorerUrl: string;
  mock: boolean;
}

export interface RefundEligibility {
  taskId: string;
  eligible: boolean;
  reason: string;
  estimatedRefund: string;
}

// ── Refund Processing ────────────────────────────────────────

/**
 * Process an auto-refund for a failed/disputed task.
 * Uses real on-chain disputeEscrowTask when contracts are deployed.
 * Falls back to mock if contract not deployed.
 */
export async function processAutoRefund(
  taskId: string,
  reason: string,
  amount: string = "$0.005",
): Promise<RefundResult> {
  if (!isContractDeployed("agentEscrow")) {
    console.log(`⚠️  AgentEscrow not deployed — using mock refund for ${taskId}`);
    return mockRefund(taskId, undefined, amount, reason);
  }

  try {
    // F6: Real on-chain refund via AgentEscrow.dispute()
    const { disputeEscrowTask } = await import("../contracts");
    console.log(`💸 Processing real on-chain refund for task ${taskId}: ${amount} — ${reason}`);
    const dispute = await disputeEscrowTask(taskId, reason);

    if (!dispute.mock && dispute.txHash) {
      console.log(`   ✅ On-chain dispute: ${dispute.txHash.slice(0, 18)}...`);
      console.log(`   🔗 Explorer: ${dispute.explorerUrl}`);
      return {
        taskId,
        amount,
        reason,
        txHash: dispute.txHash,
        explorerUrl: dispute.explorerUrl,
        mock: false,
      };
    }

    // Contract call returned mock — use mock refund
    console.log(`   ⚠️ Dispute returned mock — using mock refund`);
    return mockRefund(taskId, undefined, amount, reason);
  } catch (error) {
    console.error(`❌ Refund processing failed: ${error}`);
    return mockRefund(taskId, undefined, amount, `Fallback: ${reason}`);
  }
}

/**
 * Check if a task is eligible for refund.
 */
export function checkRefundEligibility(
  taskId: string,
  taskStatus: string,
): RefundEligibility {
  const eligibleStatuses = ["disputed", "failed", "timeout", "cancelled"];

  if (eligibleStatuses.includes(taskStatus.toLowerCase())) {
    return {
      taskId,
      eligible: true,
      reason: `Task is in '${taskStatus}' state — eligible for refund`,
      estimatedRefund: "$0.005",
    };
  }

  return {
    taskId,
    eligible: false,
    reason: `Task is in '${taskStatus}' state — not eligible for refund`,
    estimatedRefund: "$0.000",
  };
}

/**
 * Start a refund timer that auto-refunds after a timeout.
 * Returns a timer ID that can be used to cancel.
 */
export function startRefundTimer(
  taskId: string,
  amount: string,
  timeoutSeconds: number = 300,
  onRefund?: (result: RefundResult) => void,
): NodeJS.Timeout {
  console.log(`⏱️  Refund timer started for task ${taskId}: ${timeoutSeconds}s`);

  const timer = setTimeout(async () => {
    console.log(`⏱️  Refund timer expired for task ${taskId} — processing auto-refund`);
    const result = await processAutoRefund(taskId, "Timer expired — auto-refund", amount);
    console.log(`   ✅ Auto-refund processed: ${result.txHash}`);
    onRefund?.(result);
  }, timeoutSeconds * 1000);

  return timer;
}

/**
 * Cancel a pending refund timer.
 */
export function cancelRefundTimer(timerId: NodeJS.Timeout): void {
  clearTimeout(timerId);
}

/**
 * Process batch refunds for all failed agents in a run.
 */
export async function processFailedTaskRefunds(
  results: Array<{ agentType: string; success: boolean; amount: string; subtaskId: string }>,
  taskId: string,
): Promise<RefundResult[]> {
  const refunds: RefundResult[] = [];
  const failedAgents = results.filter((r) => !r.success);

  if (failedAgents.length === 0) {
    console.log("   No failed agents — no refunds needed");
    return refunds;
  }

  console.log(`💸 Processing ${failedAgents.length} refund(s) for failed agents...`);

  for (const failed of failedAgents) {
    const refund = await processAutoRefund(
      `${taskId}_${failed.agentType}`,
      `Agent ${failed.agentType} failed during execution`,
      failed.amount,
    );
    refunds.push(refund);
    console.log(`   Refund for ${failed.agentType}: ${refund.txHash}`);
  }

  return refunds;
}

// ── Helpers ──────────────────────────────────────────────────

function mockRefund(
  taskId: string,
  agentType: string | undefined,
  amount: string,
  reason: string,
): RefundResult {
  const txHash = `MOCK_0x${generateMockHash()}`;
  return {
    taskId,
    agentType,
    amount,
    reason,
    txHash,
    explorerUrl: `${ARC_CONFIG.explorerUrl}${txHash}`,
    mock: true,
  };
}

function generateMockHash(): string {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}
