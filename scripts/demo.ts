/**
 * AgentWork — Deterministic Demo Script
 *
 * Runs the orchestrator, collects evidence, asserts 50+ real on-chain
 * transactions, and saves a JSON receipt for hackathon judges.
 *
 * Uses child_process.spawn to avoid the ESM dotenv-hoisting bug.
 * Dynamically adjusts DEMO_RUNS to hit the 50 real-txn target.
 *
 * Usage:
 *   npx tsx scripts/demo.ts
 *   npx tsx scripts/demo.ts --max-runs 10
 *   npx tsx scripts/demo.ts --target 100
 */

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

// ============================================================
// Types
// ============================================================

interface SessionResult {
  subtaskId: string;
  agentType: string;
  success: boolean;
  amount: string;
  transactionHash: string;
  explorerUrl: string;
  error?: string;
}

interface ContractInteraction {
  type: string;
  contractName: string;
  txHash: string;
  explorerUrl: string;
  mock?: boolean;
}

interface SessionRun {
  runIndex: number;
  taskId: string;
  results: SessionResult[];
  contractInteractions: ContractInteraction[];
  cost: string;
  transactionCount: number;
}

interface SessionSummary {
  totalSuccessful: number;
  totalFailed: number;
  totalCost: number;
  totalTransactions: number;
  allTxHashes: string[];
}

interface SessionRecord {
  timestamp: string;
  config: { task: string; totalRuns: number };
  runs: SessionRun[];
  summary: SessionSummary;
}

interface DemoReceipt {
  timestamp: string;
  targetTransactions: number;
  orchestratorRuns: number;
  sessionsAnalyzed: number;
  totalTransactions: number;
  realOnChain: number;
  mockSimulated: number;
  totalCost: number;
  avgCostPerTxn: string;
  pass: boolean;
  sampleTransactions: Array<{ hash: string; url: string }>;
  allRealTxHashes: string[];
  allSessions: string[];
}

// ============================================================
// Constants
// ============================================================

const EXPLORER_BASE = "https://testnet.arcscan.io/tx/";
const EVIDENCE_DIR = resolve(process.cwd(), "evidence");
const RECEIPT_PATH = join(EVIDENCE_DIR, "demo-receipt.json");
const DEFAULT_TARGET = 50;
const DEFAULT_MAX_RUNS = 10;
const INITIAL_DEMO_RUNS = 3;

// ============================================================
// Helpers
// ============================================================

function isRealTx(txHash: string): boolean {
  if (!txHash || txHash.length === 0) return false;
  if (txHash.startsWith("MOCK_")) return false;
  // Valid 64-char hex prefixed with 0x
  return /^0x[0-9a-fA-F]{64}$/.test(txHash);
}

function countRealTxHashes(hashes: string[]): number {
  return hashes.filter(isRealTx).length;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(3)}`;
}

// ============================================================
// Session Loading
// ============================================================

function loadLatestSession(): SessionRecord | null {
  if (!existsSync(EVIDENCE_DIR)) return null;

  const files = readdirSync(EVIDENCE_DIR)
    .filter((f) => f.startsWith("session-") && f.endsWith(".json"))
    .sort();

  if (files.length === 0) return null;

  const latest = files[files.length - 1];
  try {
    const raw = readFileSync(join(EVIDENCE_DIR, latest), "utf-8");
    return JSON.parse(raw) as SessionRecord;
  } catch {
    return null;
  }
}

function loadAllSessions(): SessionRecord[] {
  if (!existsSync(EVIDENCE_DIR)) return [];

  const files = readdirSync(EVIDENCE_DIR)
    .filter((f) => f.startsWith("session-") && f.endsWith(".json"))
    .sort();

  const sessions: SessionRecord[] = [];
  for (const file of files) {
    try {
      const raw = readFileSync(join(EVIDENCE_DIR, file), "utf-8");
      sessions.push(JSON.parse(raw) as SessionRecord);
    } catch {
      // Skip malformed sessions
    }
  }
  return sessions;
}

// ============================================================
// Orchestrator Runner (subprocess)
// ============================================================

function runOrchestrator(demoRuns: number): Promise<number> {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running orchestrator with DEMO_RUNS=${demoRuns}...`);

    const child = spawn(
      "npx",
      ["tsx", "packages/orchestrator/src/index.ts"],
      {
        cwd: process.cwd(),
        shell: true,
        stdio: "inherit",
        env: {
          ...process.env,
          DEMO_RUNS: String(demoRuns),
        },
      }
    );

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`   ✅ Orchestrator exited cleanly`);
        resolve(code);
      } else {
        console.log(`   ⚠️  Orchestrator exited with code ${code}`);
        // Don't reject — we still want to check evidence
        resolve(code ?? 1);
      }
    });

    child.on("error", (err) => {
      console.error(`   ❌ Failed to spawn orchestrator: ${err.message}`);
      reject(err);
    });
  });
}

// ============================================================
// Receipt Generation
// ============================================================

function buildReceipt(
  target: number,
  orchestratorRuns: number,
  sessions: SessionRecord[]
): DemoReceipt {
  const allTxHashes = sessions.flatMap((s) => s.summary.allTxHashes);
  const totalCost = sessions.reduce((s, sess) => s + sess.summary.totalCost, 0);
  const realTxHashes = allTxHashes.filter(isRealTx);
  const mockCount = allTxHashes.length - realTxHashes.length;

  const samples: Array<{ hash: string; url: string }> = realTxHashes
    .slice(0, 10)
    .map((hash) => ({
      hash,
      url: `${EXPLORER_BASE}${hash}`,
    }));

  return {
    timestamp: new Date().toISOString(),
    targetTransactions: target,
    orchestratorRuns,
    sessionsAnalyzed: sessions.length,
    totalTransactions: allTxHashes.length,
    realOnChain: realTxHashes.length,
    mockSimulated: mockCount,
    totalCost,
    avgCostPerTxn:
      allTxHashes.length > 0
        ? (totalCost / allTxHashes.length).toFixed(4)
        : "0.0000",
    pass: realTxHashes.length >= target,
    sampleTransactions: samples,
    allRealTxHashes: realTxHashes,
    allSessions: sessions.map((s) => s.timestamp),
  };
}

function printReceipt(receipt: DemoReceipt): void {
  const lines: string[] = [
    "",
    "╔══════════════════════════════════════════════════════════╗",
    "║            AgentWork Demo Receipt                        ║",
    "╚══════════════════════════════════════════════════════════╝",
    "",
    "📊 Results:",
    `   Total transactions: ${receipt.totalTransactions}`,
    `   Real on-chain:      ${receipt.realOnChain} ${receipt.pass ? "✅" : "❌"}`,
    `   Mock/simulated:     ${receipt.mockSimulated}`,
    `   Total cost:         ${formatCurrency(receipt.totalCost)}`,
    `   Avg cost/txn:       $${receipt.avgCostPerTxn}`,
    "",
  ];

  if (receipt.sampleTransactions.length > 0) {
    lines.push("🔗 Sample transactions (verify on arcscan.io):");
    receipt.sampleTransactions.forEach((tx, i) => {
      const shortHash = `${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}`;
      lines.push(`   ${i + 1}. ${shortHash} → ${tx.url}`);
    });
    lines.push("");
  }

  if (receipt.pass) {
    lines.push(
      `✅ PASS: ${receipt.realOnChain} real on-chain transactions (>= ${receipt.targetTransactions} required)`
    );
  } else {
    lines.push(
      `❌ FAIL: ${receipt.realOnChain} real on-chain transactions (< ${receipt.targetTransactions} required)`
    );
  }

  lines.push("");
  console.log(lines.join("\n"));
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  // Parse CLI flags
  const args = process.argv.slice(2);
  let target = DEFAULT_TARGET;
  let maxRuns = DEFAULT_MAX_RUNS;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--target" && args[i + 1]) {
      target = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--max-runs" && args[i + 1]) {
      maxRuns = parseInt(args[i + 1], 10);
      i++;
    }
  }

  console.log("");
  console.log("══════════════════════════════════════════════════════════");
  console.log("       AgentWork Deterministic Demo Runner");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`   Target:  ${target} real on-chain transactions`);
  console.log(`   Max runs: ${maxRuns}`);
  console.log(`   Evidence: ${EVIDENCE_DIR}`);
  console.log("");

  // Ensure evidence directory exists
  if (!existsSync(EVIDENCE_DIR)) {
    mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  // Count existing real transactions from previous sessions
  const existingSessions = loadAllSessions();
  const existingRealTx = existingSessions.reduce(
    (count, s) => count + countRealTxHashes(s.summary.allTxHashes),
    0
  );

  console.log(`📦 Found ${existingSessions.length} existing session(s) with ${existingRealTx} real transactions`);

  if (existingRealTx >= target) {
    console.log(`✅ Already have ${existingRealTx} real transactions — target met!`);
    const receipt = buildReceipt(target, 0, existingSessions);
    writeFileSync(RECEIPT_PATH, JSON.stringify(receipt, null, 2));
    printReceipt(receipt);
    process.exit(0);
  }

  // Run orchestrator in a loop until we hit the target
  let totalOrchestratorRuns = 0;
  let demoRuns = INITIAL_DEMO_RUNS;
  let cumulativeRealTx = existingRealTx;

  while (cumulativeRealTx < target && totalOrchestratorRuns < maxRuns) {
    totalOrchestratorRuns++;
    console.log("\n" + "━".repeat(60));
    console.log(`📋 Attempt ${totalOrchestratorRuns}/${maxRuns} | DEMO_RUNS=${demoRuns} | Current real tx: ${cumulativeRealTx}/${target}`);
    console.log("━".repeat(60));

    try {
      await runOrchestrator(demoRuns);
    } catch (err) {
      console.error(`   ❌ Orchestrator run failed: ${(err as Error).message}`);
    }

    // Reload sessions after this run
    const allSessions = loadAllSessions();
    cumulativeRealTx = allSessions.reduce(
      (count, s) => count + countRealTxHashes(s.summary.allTxHashes),
      0
    );

    console.log(`   📈 Cumulative real transactions: ${cumulativeRealTx}/${target}`);

    // If still below target, calculate how many more runs we need
    if (cumulativeRealTx < target && totalOrchestratorRuns < maxRuns) {
      const latestSession = loadLatestSession();
      if (latestSession && latestSession.runs.length > 0) {
        // Calculate real txns per orchestrator run from the latest session
        const realInSession = countRealTxHashes(latestSession.summary.allTxHashes);
        const runsInSession = latestSession.config.totalRuns;
        const realPerRun = realInSession / runsInSession;

        if (realPerRun > 0) {
          const remaining = target - cumulativeRealTx;
          demoRuns = Math.ceil(remaining / realPerRun) + 1;
          // Cap demoRuns to something reasonable
          demoRuns = Math.min(demoRuns, 20);
        } else {
          // No real transactions from last run — increment DEMO_RUNS
          demoRuns = Math.min(demoRuns + 2, 20);
        }
      } else {
        demoRuns = Math.min(demoRuns + 2, 20);
      }
    }
  }

  // Build final receipt from ALL sessions
  const allSessions = loadAllSessions();
  const receipt = buildReceipt(target, totalOrchestratorRuns, allSessions);

  // Save receipt
  writeFileSync(RECEIPT_PATH, JSON.stringify(receipt, null, 2));
  console.log(`\n💾 Receipt saved to ${RECEIPT_PATH}`);

  // Print receipt
  printReceipt(receipt);

  // Exit code
  if (receipt.pass) {
    console.log(`\n🎉 Demo successful — receipt saved with ${receipt.realOnChain} real on-chain transactions.`);
    process.exit(0);
  } else {
    console.error(
      `\n⚠️  Demo incomplete — only ${receipt.realOnChain}/${target} real transactions after ${totalOrchestratorRuns} runs.`
    );
    console.error("   Check that ORCHESTRATOR_PRIVATE_KEY is funded and agents are healthy.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
