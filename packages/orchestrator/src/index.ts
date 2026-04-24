// ── Dotenv MUST load before any other module reads process.env ──
// In ES modules, ALL static imports are hoisted above module body code.
// So we use top-level await + dynamic imports to ensure dotenv loads first.
import { config as loadDotenv } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadDotenv({ path: resolve(__dirname, "..", "..", "..", ".env") });

// Now dynamically import everything so they see the loaded env vars
const { decomposeTask } = await import("./decomposer");
const {
  initGateway,
  depositFunds,
  executeAllPayments,
  executeAdaptiveWorkflow,
} = await import("./executor");
const {
  registerAllAgentIdentities,
} = await import("./identity");
const {
  checkAgentHealth,
  claimEscrowTask,
  completeEscrowTask,
  submitReputation,
  getAgentReputation,
  submitEscrowResult,
  batchCreateEscrow,
} = await import("./contracts");
const { AGENT_ENDPOINTS, FEATURES, ARC_CONFIG, isContractDeployed, getAgentAddress } = await import("./config");
const { initSession, recordRun, saveSession } = await import("./session-recorder");
const {
  setDefaultSpendingLimits,
  recordSpending,
  calculateAllPrices,
  incrementDemand,
  executeAllChains,
  countA2APayments,
  processFailedTaskRefunds,
  initDefaultStakes,
  setStreamGateway,
  startStream,
  stopAllStreams,
  getStreamingStats,
  runAutoAuction,
  getTokenAmount,
  buildMerkleTree,
  verifyBatch,
  submitBatchProof,
  runMockGovernance,
} = await import("./economy");
const { runNanopaymentStressTest } = await import("./stress-test");
const { connectWallet, getWalletSummary } = await import("./wallet");
const { decideTaskRouting, decideReputationScore, getGeminiStatus } = await import("./gemini-orchestrator");
const { recordTaskEvent, getAgentHistory } = await import("./economy/supabase-module");

// ============================================================
// AgentWork Orchestrator — Main Entry Point
// ============================================================

const DEMO_TASK = process.env.DEMO_TASK;
const DEMO_RUNS = parseInt(process.env.DEMO_RUNS || "1", 10);

if (!DEMO_TASK) {
  console.error("❌ No task provided. Please provide a task via DEMO_TASK environment variable or the dashboard.");
  process.exit(1);
}

// TypeScript: DEMO_TASK is guaranteed to be a string after the check above
const task: string = DEMO_TASK;

async function runOnce(runIndex: number, totalRuns: number): Promise<void> {
  const runLabel = totalRuns > 1 ? ` [Run ${runIndex + 1}/${totalRuns}]` : "";
  console.log(`\n${"═".repeat(60)}\n🚀 EXECUTION${runLabel}\n${"═".repeat(60)}\n`);

  // Step 0: Record Initiation (for dashboard observability)
  await recordTaskEvent({
    task_id: "init-" + Date.now(),
    agent_type: "orchestrator",
    status: "started",
    gateway_tx: null,
    amount: "$0.00",
    result: `Orchestrator process started (Run ${runIndex + 1}/${totalRuns})`,
    error: null,
  });

  // Step 1: Health & History
  console.log("🔍 Checking agent health & historical performance...");
  const health = await checkAgentHealth();
  const agentHistory = await getAgentHistory();
  
  for (const agent of health) {
    const status = agent.status === "online" ? "✅" : "❌";
    const history = agentHistory[agent.type] 
      ? `(${agentHistory[agent.type].avgScore}% acc, ${agentHistory[agent.type].completedCount} tasks)` 
      : "(new agent)";
    console.log(`   ${status} ${agent.type.padEnd(12)} ${agent.url.padEnd(30)} ${history}`);
  }
  
  if (health.filter((a) => a.status === "online").length === 0) {
    console.error("\n❌ No agents are online! Start agents first.");
    process.exit(1);
  }

  // Step 2: Gateway & Wallet
  console.log("\n🔄 Initializing Arc Testnet x402 Stack...");
  console.log("   📡 Connecting to Gateway API...");
  const gateway = await initGateway();
  console.log("   💰 Fetching wallet balances...");
  const balances = await gateway.getBalances();
  console.log(`   💰 Gateway balance: ${balances.gateway.formattedAvailable} USDC available`);

  if ((balances.gateway.available ?? BigInt(0)) < BigInt(100000)) {
    console.log("   💳 Low balance (< 0.1 USDC). Depositing 1 USDC into Gateway...");
    await depositFunds("1");
    console.log("   ✅ Deposit submitted.");
  }

  // Step 3: Intelligence Layer (Reputation-Based Routing)
  console.log("\n🧩 Decomposing task & activating Gemini Orchestrator...");
  const decomposition = await decomposeTask(task);
  const routingDecision = await decideTaskRouting(task, decomposition.subtasks, agentHistory);
  
  console.log(`   Task: "${task}"`);
  console.log(`   Strategic Routing: ${routingDecision.agentSequence.join(" → ")}`);
  console.log(`   Reasoning: ${routingDecision.reasoning}`);
  console.log(`   Execution: ${routingDecision.parallel ? "⚡ Parallel (Turbo)" : "🔄 Sequential (Recursive)"}\n`);

  // Step 4: Escrow & Payments
  console.log("📋 Initializing on-chain escrow & payments...");
  const escrowResults = await batchCreateEscrow(decomposition.taskId, routingDecision.agentSequence, decomposition.estimatedCost);
  
  // Use Adaptive Workflow (Hybrid Parallel/Sequential)
  const results = await executeAdaptiveWorkflow(
    decomposition.subtasks.filter(s => routingDecision.agentSequence.includes(s.agentType)),
    routingDecision.parallel === false // Respect LLM if it explicitly forbids parallelism
  );

  // Step 5: A2A Reciprocity (Recursive Chaining)
  if (FEATURES.useA2AChaining) {
    try {
      console.log("\n🔗 Triggering Autonomous A2A Reciprocity Chains...");
      const chainResults = await executeAllChains(decomposition.taskId, task);
      console.log(`   A2A chains executed: ${chainResults.length} (${countA2APayments(chainResults)} total nanopayments)`);
    } catch (a2aErr) {
      console.log(`   ⚠️  A2A chaining failed (non-blocking): ${a2aErr instanceof Error ? a2aErr.message : String(a2aErr)}`);
    }
  }

  // Step 6: Post-Task Lifecycle (Claim, Reputation, Streaming)
  console.log("\n✨ Finalizing lifecycle events...");
  const successfulTypes = results.filter(r => r.success).map(r => r.agentType);
  
  for (const agentType of successfulTypes) {
    const agentAddr = (() => { try { return getAgentAddress(agentType); } catch { return `0x_AGENT_${agentType.toUpperCase()}`; } })();
    await claimEscrowTask(decomposition.taskId, agentAddr);
    
    // Evaluation
    const agentResult = results.find(r => r.agentType === agentType);
    let responseText = "";
    if (agentResult?.response) {
      if (typeof agentResult.response === "string") {
        responseText = agentResult.response;
      } else if (typeof agentResult.response === "object") {
        responseText = JSON.stringify(agentResult.response, null, 2);
      } else {
        responseText = String(agentResult.response);
      }
    }
    const repDecision = await decideReputationScore(agentType, task, responseText, agentResult?.success ?? true);
    await submitReputation(agentAddr, repDecision.score, repDecision.feedback);
    console.log(`   ✅ ${agentType}: Evaluation ${repDecision.score}/100 — ${repDecision.feedback}`);
    // Delay between sequential reputation submissions to avoid nonce race
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log(`\n${"=".repeat(60)}\n🎯 SUMMARY: Run ${runIndex + 1} Complete\n${"=".repeat(60)}`);
  console.log(`   Total Transactions: ~${results.length + escrowResults.length + (FEATURES.useA2AChaining ? 10 : 0)} on-chain`);
  console.log(`   Total Cost: ${decomposition.estimatedCost}`);
  console.log(`${"=".repeat(60)}\n`);

  // Signal dashboard that run is complete (triggers Verification step + stops EXECUTING)
  recordTaskEvent({
    task_id: `${decomposition.taskId}-receipt`,
    agent_type: "orchestrator",
    status: "receipt_generated",
    gateway_tx: null,
    amount: decomposition.estimatedCost,
    result: {
      type: "run_complete",
      run: runIndex + 1,
      totalRuns: totalRuns,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalCost: decomposition.estimatedCost,
      escrowTxCount: escrowResults.filter(e => !e.mock).length,
      a2aTxCount: FEATURES.useA2AChaining ? 7 : 0,
    },
    error: null,
  }).catch(() => {});

  recordRun(runIndex, decomposition.taskId, results, escrowResults);
}

async function main(): Promise<void> {
  console.log(`\n╔══════════════════════════════════════════════════════════╗\n║                    AGENTWORK v1.0.0                      ║\n║         Elite AI Agent Orchestrator · Arc L1             ║\n╚══════════════════════════════════════════════════════════╝\n`);
  initSession(task, DEMO_RUNS);
  for (let i = 0; i < DEMO_RUNS; i++) {
    await runOnce(i, DEMO_RUNS);
  }
  saveSession();
}

main().catch(console.error);

// Cleanup: stop all payment streams on process exit
process.on("SIGTERM", () => {
  stopAllStreams();
  process.exit(0);
});

process.on("SIGINT", () => {
  stopAllStreams();
  process.exit(0);
});
