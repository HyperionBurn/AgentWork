import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ============================================================
// Session Recorder
// ============================================================
// Records all orchestrator session data (tasks, payments, tx hashes)
// to timestamped JSON files for demo evidence and judge review.
// ============================================================

export interface SessionRecord {
  timestamp: string;
  config: {
    task: string;
    totalRuns: number;
  };
  runs: Array<{
    runIndex: number;
    taskId: string;
    results: Array<{
      subtaskId: string;
      agentType: string;
      success: boolean;
      amount: string;
      transactionHash: string | null;
      explorerUrl: string | null;
      error?: string;
    }>;
    contractInteractions: Array<{
      type: string;
      contractName: string;
      txHash: string;
      explorerUrl: string;
    }>;
    cost: string;
    transactionCount: number;
  }>;
  summary: {
    totalSuccessful: number;
    totalFailed: number;
    totalCost: number;
    totalTransactions: number;
    allTxHashes: string[];
  };
}

let currentSession: SessionRecord | null = null;

/**
 * Initialize a new recording session.
 */
export function initSession(task: string, totalRuns: number): void {
  currentSession = {
    timestamp: new Date().toISOString(),
    config: { task, totalRuns },
    runs: [],
    summary: {
      totalSuccessful: 0,
      totalFailed: 0,
      totalCost: 0,
      totalTransactions: 0,
      allTxHashes: [],
    },
  };
}

/**
 * Record a single run's results.
 */
export function recordRun(
  runIndex: number,
  taskId: string,
  results: Array<{
    subtaskId: string;
    agentType: string;
    success: boolean;
    amount: string;
    transactionHash: string | null;
    explorerUrl: string | null;
    error?: string;
  }>,
  contractInteractions: Array<{
    type: string;
    contractName: string;
    txHash: string;
    explorerUrl: string;
  }>
): void {
  if (!currentSession) return;

  const cost = results
    .filter((r) => r.success)
    .reduce((sum, r) => sum + parseFloat(r.amount.replace("$", "")), 0);

  const txHashes = [
    ...results.filter((r) => r.transactionHash).map((r) => r.transactionHash!),
    ...contractInteractions.map((c) => c.txHash),
  ];

  currentSession.runs.push({
    runIndex,
    taskId,
    results,
    contractInteractions,
    cost: `$${cost.toFixed(3)}`,
    transactionCount: txHashes.length,
  });

  currentSession.summary.totalSuccessful += results.filter((r) => r.success).length;
  currentSession.summary.totalFailed += results.filter((r) => !r.success).length;
  currentSession.summary.totalCost += cost;
  currentSession.summary.totalTransactions += txHashes.length;
  currentSession.summary.allTxHashes.push(...txHashes);
}

/**
 * Save the session to a JSON file in the evidence/ directory.
 */
export function saveSession(): string | null {
  if (!currentSession) return null;

  const evidenceDir = join(process.cwd(), "evidence");
  mkdirSync(evidenceDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `session-${timestamp}.json`;
  const filepath = join(evidenceDir, filename);

  writeFileSync(filepath, JSON.stringify(currentSession, null, 2), "utf-8");
  console.log(`\n📁 Session saved to: ${filepath}`);
  console.log(`   Total transactions: ${currentSession.summary.totalTransactions}`);
  console.log(`   Total cost: $${currentSession.summary.totalCost.toFixed(3)}`);
  return filepath;
}

/**
 * Get the current session (for reading).
 */
export function getSession(): SessionRecord | null {
  return currentSession;
}
