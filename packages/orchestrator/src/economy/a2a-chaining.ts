// ============================================================
// Agent-to-Agent Payment Chaining
// ============================================================
// Enables agents to call and pay other agents directly.
// This demonstrates recursive nanopayments — the most powerful
// Arc use case where an agent receiving payment can then pay
// another agent from its own wallet.
// ============================================================

import { ARC_CONFIG, AGENT_ENDPOINTS } from "../config";
import { recordTaskEvent } from "./supabase-module";
import { initGateway } from "../executor";
import { isRealTransactionHash, resolveGatewaySettlement } from "../gateway-settlement";

// ── Types ────────────────────────────────────────────────────

export interface A2APayment {
  fromAgent: string;
  toAgent: string;
  amount: string;
  reason: string;
  parentTaskId: string;
  txHash: string;
  explorerUrl: string;
  mock: boolean;
}

export interface A2AChain {
  chainId: string;
  payments: A2APayment[];
  totalAmount: string;
  depth: number;
}

// ── Chain definitions ────────────────────────────────────────
// Pre-defined agent chains that demonstrate recursive payments:
//
// research → code:   "Research feeds implementation specs to code agent"
// code → test:       "Code agent submits code to test agent"
// test → review:     "Test results sent to review agent"
// research → review: "Research data cross-validated by review agent"

interface ChainStep {
  from: string;
  to: string;
  amount: string;
  reason: string;
}

const CHAIN_TEMPLATES: Record<string, ChainStep[]> = {
  // Full chain: research → code → test → review
  full_pipeline: [
    { from: "research", to: "code",   amount: "$0.003", reason: "Research output → Code implementation" },
    { from: "code",     to: "test",   amount: "$0.002", reason: "Code output → Test generation" },
    { from: "test",     to: "review", amount: "$0.002", reason: "Test results → Quality review" },
  ],
  // Cross-validation: research → review
  cross_validate: [
    { from: "research", to: "review", amount: "$0.003", reason: "Research findings → Cross-validation" },
  ],
  // Code review: code → review
  code_review: [
    { from: "code", to: "review", amount: "$0.003", reason: "Implementation → Security review" },
  ],
  // Deep pipeline: code → test → review
  quality_pipeline: [
    { from: "code",   to: "test",   amount: "$0.002", reason: "Implementation → Test suite" },
    { from: "test",   to: "review", amount: "$0.002", reason: "Test results → Final review" },
  ],
};

let chainCounter = 0;

/**
 * Execute an agent-to-agent payment chain.
 * Each step represents one agent paying another for a sub-service.
 * 
 * NEW: If the step is "recursive", the orchestrator calls the Research agent's /api/chain 
 * endpoint, which then triggers the Research agent to pay the Code agent.
 */
export async function executeA2AChain(
  templateName: string,
  parentTaskId: string,
  originalTask?: string,
): Promise<A2AChain> {
  const template = CHAIN_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Unknown A2A chain template: ${templateName}`);
  }

  const chainId = `a2a-chain-${++chainCounter}`;
  const payments: A2APayment[] = [];
  let totalAmount = 0;

  console.log(`\n${"=".repeat(50)}`);
  console.log(`🔗 Agent-to-Agent Chain: ${templateName}`);
  console.log(`   Chain ID: ${chainId}`);
  console.log(`${"=".repeat(50)}`);

  let gateway = await initGateway();

  for (const step of template) {
    const amountNum = parseFloat(step.amount.replace("$", ""));
    totalAmount += amountNum;

    let txHash: string;
    let isMock = false;
    let agentResponse: unknown = null;

    try {
      const endpoint = AGENT_ENDPOINTS.find((e) => e.type === step.from);
      if (!endpoint) throw new Error(`Unknown agent: ${step.from}`);

      // If it's the research agent, we can trigger the recursive /api/chain endpoint
      const path = (step.from === "research" && templateName === "full_pipeline") 
        ? "/api/chain" 
        : endpoint.apiPath;
      
      // Use original task as input (not step.reason) so agents generate relevant output
      const taskInput = originalTask || step.reason;
      const contextStr = `A2A chain (${step.from}→${step.to}): ${step.reason}`;
      const url = `${endpoint.baseUrl}${path}?input=${encodeURIComponent(taskInput)}&context=${encodeURIComponent(contextStr)}`;

      console.log(`   💸 ${step.from} initiating payment step...`);
      const result = await gateway.pay(url, { method: "GET" });
      txHash = result.transaction || "";
      agentResponse = result.data ?? null;
      
      console.log(`   ✅ Step complete: ${step.from} → ${step.to}`);
      if (path === "/api/chain") {
        console.log(`      ⚡ RECURSIVE A2A: Research agent paid Code agent autonomously!`);
      }
    } catch (err) {
      console.error(`   ❌ A2A payment failed: ${err instanceof Error ? err.message : String(err)}`);
      txHash = `MOCK_A2A_${step.from}_${step.to}`;
      isMock = true;
    }

    const payment: A2APayment = {
      fromAgent: step.from,
      toAgent: step.to,
      amount: step.amount,
      reason: step.reason,
      parentTaskId,
      txHash,
      explorerUrl: isRealTransactionHash(txHash) ? `${ARC_CONFIG.explorerUrl}${txHash}` : "",
      mock: isMock,
    };

    if (!isMock && !isRealTransactionHash(txHash)) {
      void resolveGatewaySettlement({
        gateway,
        taskId: `${parentTaskId}-a2a-${step.from}-${step.to}`,
        gatewayRef: txHash,
        onSettled: (settledHash) => {
          payment.txHash = settledHash;
          payment.explorerUrl = `${ARC_CONFIG.explorerUrl}${settledHash}`;
        },
      }).catch((err) => {
        console.log(`   ⚠️  Background settlement resolution failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    }

    payments.push(payment);

    // Record to Supabase — include actual agent response data
    recordTaskEvent({
      task_id: `${parentTaskId}-a2a-${step.from}-${step.to}`,
      agent_type: `${step.from}→${step.to}`,
      status: "completed",
      gateway_tx: txHash,
      amount: step.amount,
      result: agentResponse ?? step.reason,
      error: null,
    }).catch(() => {});
  }

  return {
    chainId,
    payments,
    totalAmount: `$${totalAmount.toFixed(4)}`,
    depth: template.length,
  };
}

/**
 * Execute all available A2A chain templates.
 * Produces maximum on-chain transaction count for the demo.
 */
export async function executeAllChains(
  parentTaskId: string,
  originalTask?: string,
): Promise<A2AChain[]> {
  const chains: A2AChain[] = [];
  for (const templateName of Object.keys(CHAIN_TEMPLATES)) {
    try {
      const chain = await executeA2AChain(templateName, parentTaskId, originalTask);
      chains.push(chain);
    } catch (err) {
      console.log(`   ⚠️  Chain '${templateName}' failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return chains;
}

/**
 * Get available chain templates.
 */
export function getChainTemplates(): string[] {
  return Object.keys(CHAIN_TEMPLATES);
}

/**
 * Get total A2A payment count for a set of chains.
 */
export function countA2APayments(chains: A2AChain[]): number {
  return chains.reduce((sum, chain) => sum + chain.payments.length, 0);
}
