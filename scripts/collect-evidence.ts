import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// ============================================================
// Evidence Collector
// ============================================================
// Reads session JSON files from evidence/ and generates:
// 1. A markdown summary for judges (evidence/summary.md)
// 2. A transaction count file (evidence/tx-count.txt)
// ============================================================

interface SessionResult {
  subtaskId: string;
  agentType: string;
  success: boolean;
  amount: string;
  transactionHash: string | null;
  explorerUrl: string | null;
  error?: string;
}

interface ContractInteraction {
  type: string;
  contractName: string;
  txHash: string;
  explorerUrl: string;
}

interface SessionRun {
  runIndex: number;
  taskId: string;
  results: SessionResult[];
  contractInteractions: ContractInteraction[];
  cost: string;
  transactionCount: number;
}

interface SessionRecord {
  timestamp: string;
  config: {
    task: string;
    totalRuns: number;
  };
  runs: SessionRun[];
  summary: {
    totalSuccessful: number;
    totalFailed: number;
    totalCost: number;
    totalTransactions: number;
    allTxHashes: string[];
  };
}

const EXPLORER_BASE = "https://testnet.arcscan.io/tx/";

function loadSessions(evidenceDir: string): SessionRecord[] {
  if (!existsSync(evidenceDir)) {
    console.error(`❌ Evidence directory not found: ${evidenceDir}`);
    console.error("   Run the orchestrator first: npm run demo");
    process.exit(1);
  }

  const files = readdirSync(evidenceDir)
    .filter((f) => f.startsWith("session-") && f.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    console.error("❌ No session files found in evidence/");
    console.error("   Run the orchestrator first: npm run demo");
    process.exit(1);
  }

  const sessions: SessionRecord[] = [];
  for (const file of files) {
    try {
      const raw = readFileSync(join(evidenceDir, file), "utf-8");
      sessions.push(JSON.parse(raw) as SessionRecord);
    } catch (err) {
      console.warn(`⚠️  Skipping ${file}: ${(err as Error).message}`);
    }
  }

  return sessions;
}

function generateMarkdown(sessions: SessionRecord[]): string {
  const now = new Date().toISOString();

  // Aggregate stats across all sessions
  const totalTxns = sessions.reduce((s, sess) => s + sess.summary.totalTransactions, 0);
  const totalCost = sessions.reduce((s, sess) => s + sess.summary.totalCost, 0);
  const totalSuccessful = sessions.reduce((s, sess) => s + sess.summary.totalSuccessful, 0);
  const totalFailed = sessions.reduce((s, sess) => s + sess.summary.totalFailed, 0);
  const allTxHashes = sessions.flatMap((s) => s.summary.allTxHashes);

  const lines: string[] = [
    "# 🧾 AgentWork — Demo Evidence Summary",
    "",
    `> Generated: ${now}`,
    `> Sessions: ${sessions.length}`,
    "",
    "---",
    "",
    "## 📊 Aggregate Statistics",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Total Transactions | **${totalTxns}** |`,
    `| Total Cost | **$${totalCost.toFixed(3)}** |`,
    `| Successful Payments | **${totalSuccessful}** |`,
    `| Failed Payments | **${totalFailed}** |`,
    `| Cost per Transaction | **$${totalTxns > 0 ? (totalCost / totalTxns).toFixed(4) : "N/A"}** |`,
    `| Arc Explorer | [testnet.arcscan.io](https://testnet.arcscan.io) |`,
    "",
    "---",
    "",
    "## 💰 Cost Comparison",
    "",
    "| Method | Cost (est.) | Savings |",
    "|--------|------------|---------|",
    `| **Arc (actual)** | $${totalCost.toFixed(3)} | — |`,
    `| L2 (Arbitrum/Base) | $${(totalTxns * 0.10).toFixed(2)} | ${totalCost > 0 ? ((1 - totalCost / (totalTxns * 0.10)) * 100).toFixed(0) : "0}% |`,
    `| Stripe / PayPal | $${(totalTxns * 0.30).toFixed(2)} | ${totalCost > 0 ? ((1 - totalCost / (totalTxns * 0.30)) * 100).toFixed(0) : "0}% |`,
    "",
    "---",
    "",
  ];

  // Per-session breakdown
  for (const session of sessions) {
    const date = new Date(session.timestamp).toLocaleString();
    lines.push(`## Session: ${date}`);
    lines.push("");
    lines.push(`- **Task**: "${session.config.task}"`);
    lines.push(`- **Runs**: ${session.config.totalRuns}`);
    lines.push(`- **Transactions**: ${session.summary.totalTransactions}`);
    lines.push(`- **Cost**: $${session.summary.totalCost.toFixed(3)}`);
    lines.push("");

    // Per-run breakdown
    for (const run of session.runs) {
      lines.push(`### Run ${run.runIndex + 1}`);
      lines.push("");
      lines.push("| # | Agent | Amount | Status | Transaction |");
      lines.push("|---|-------|--------|--------|-------------|");

      run.results.forEach((r, i) => {
        const status = r.success ? "✅" : "❌";
        const txLink = r.transactionHash
          ? `[${r.transactionHash.slice(0, 10)}...](${EXPLORER_BASE}${r.transactionHash})`
          : "—";
        lines.push(`| ${i + 1} | ${r.agentType} | ${r.amount} | ${status} | ${txLink} |`);
      });

      if (run.contractInteractions.length > 0) {
        lines.push("");
        lines.push("**Contract Interactions:**");
        lines.push("");
        for (const ci of run.contractInteractions) {
          lines.push(
            `- ${ci.type} (${ci.contractName}): [${ci.txHash.slice(0, 10)}...](${ci.explorerUrl})`,
          );
        }
      }

      lines.push("");
    }
  }

  // Full transaction list
  if (allTxHashes.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## 🔗 All Transaction Hashes");
    lines.push("");
    lines.push("```");
    for (const hash of allTxHashes) {
      lines.push(hash);
    }
    lines.push("```");
    lines.push("");
  }

  return lines.join("\n");
}

function generateTxCount(sessions: SessionRecord[]): string {
  const totalTxns = sessions.reduce((s, sess) => s + sess.summary.totalTransactions, 0);
  return [
    `AgentWork Transaction Count: ${totalTxns}`,
    `Generated: ${new Date().toISOString()}`,
    `Sessions analyzed: ${sessions.length}`,
    `Meets 60+ requirement: ${totalTxns >= 60 ? "YES ✅" : "NO ❌ (need more runs)"}`,
  ].join("\n");
}

// ============================================================
// Main
// ============================================================

const evidenceDir = resolve(process.cwd(), "evidence");

console.log("📊 AgentWork Evidence Collector");
console.log(`   Scanning: ${evidenceDir}\n`);

const sessions = loadSessions(evidenceDir);
console.log(`   Found ${sessions.length} session(s)\n`);

const markdown = generateMarkdown(sessions);
const txCount = generateTxCount(sessions);

// Write outputs
mkdirSync(evidenceDir, { recursive: true });

const summaryPath = join(evidenceDir, "summary.md");
writeFileSync(summaryPath, markdown, "utf-8");
console.log(`✅ Markdown summary: ${summaryPath}`);

const txCountPath = join(evidenceDir, "tx-count.txt");
writeFileSync(txCountPath, txCount, "utf-8");
console.log(`✅ Transaction count: ${txCountPath}`);

const totalTxns = sessions.reduce((s, sess) => s + sess.summary.totalTransactions, 0);
console.log(`\n📈 Total on-chain transactions: ${totalTxns}`);
console.log(`   ${totalTxns >= 60 ? "✅ Meets 60+ requirement!" : "⚠️  Need more runs to reach 60+"}`);
