// ============================================================
// Agent-to-Agent Payment Chaining
// ============================================================
// Enables agents to call and pay other agents directly.
// This demonstrates recursive nanopayments — the most powerful
// Arc use case where an agent receiving payment can then pay
// another agent from its own wallet.
// ============================================================

import { ARC_CONFIG } from "../config";
import { recordTaskEvent } from "./supabase-module";

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
 * In production, each agent would have its own wallet and use
 * GatewayClient.pay() directly. For demo, we simulate from the
 * orchestrator's wallet but track the A2A flow.
 */
export async function executeA2AChain(
  templateName: string,
  parentTaskId: string,
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
  console.log(`   Steps: ${template.length}`);
  console.log(`${"=".repeat(50)}`);

  for (const step of template) {
    const mockHash = `MOCK_A2A_${step.from}_${step.to}_${Date.now().toString(16)}`;
    const amount = parseFloat(step.amount.replace("$", ""));
    totalAmount += amount;

    const payment: A2APayment = {
      fromAgent: step.from,
      toAgent: step.to,
      amount: step.amount,
      reason: step.reason,
      parentTaskId,
      txHash: mockHash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${mockHash}`,
      mock: true,
    };

    payments.push(payment);

    console.log(`   💸 ${step.from} → ${step.to}: ${step.amount} — ${step.reason}`);
    console.log(`      TX: ${mockHash}`);

    // Record to Supabase for dashboard (non-blocking)
    recordTaskEvent({
      task_id: `${parentTaskId}-a2a-${step.from}-${step.to}`,
      agent_type: `${step.from}→${step.to}`,
      status: "completed",
      gateway_tx: mockHash,
      amount: step.amount,
      result: step.reason,
      error: null,
    }).catch(() => { /* non-blocking */ });
  }

  console.log(`\n   📊 Chain complete: ${payments.length} A2A payments, total: $${totalAmount.toFixed(4)}`);

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
): Promise<A2AChain[]> {
  const chains: A2AChain[] = [];
  for (const templateName of Object.keys(CHAIN_TEMPLATES)) {
    const chain = await executeA2AChain(templateName, parentTaskId);
    chains.push(chain);
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
