import { ARC_CONFIG, AGENT_ENDPOINTS, isContractDeployed } from "./config";
import {
  getClients,
  sendContractTx,
  ESCROW_ABI,
  REPUTATION_ABI,
} from "./contracts-client";

// ============================================================
// Contract Interaction Layer
// ============================================================
// Handles on-chain escrow and reputation contract calls.
// When contracts are deployed (feature flag = true), uses real
// viem calls. Otherwise falls back to mock interactions.
// ============================================================

export interface ContractInteraction {
  type: "escrow_create" | "escrow_claim" | "escrow_complete" | "reputation";
  contractName: string;
  functionCall: string;
  txHash: string;
  explorerUrl: string;
}

// ── Escrow: create ────────────────────────────────────────────

export async function createEscrowTask(
  taskId: string,
  description: string,
  reward: string
): Promise<ContractInteraction> {
  const escrowAddress = process.env.AGENT_ESCROW_ADDRESS;

  if (!escrowAddress || !isContractDeployed("agentEscrow")) {
    console.log("⚠️  AgentEscrow not deployed — using mock escrow");
    return mockInteraction(
      "escrow_create", "AgentEscrow",
      `createTask("${taskId}", "${reward}")`,
    );
  }

  try {
    const clients = getClients();
    if (!clients) {
      console.log("⚠️  No wallet configured — using mock escrow");
      return mockInteraction(
        "escrow_create", "AgentEscrow",
        `createTask("${taskId}", "${reward}")`,
      );
    }

    const rewardAtomic = BigInt(
      Math.round(parseFloat(reward.replace("$", "")) * 1_000_000),
    );
    // Agent address is placeholder — in production this would be the real agent wallet
    const agentAddr = `0x0000000000000000000000000000000000000001` as `0x${string}`;
    const hash = await sendContractTx({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "createTask",
      args: [agentAddr, rewardAtomic, description],
    });
    await clients.publicClient.waitForTransactionReceipt({ hash });

    const interaction: ContractInteraction = {
      type: "escrow_create",
      contractName: "AgentEscrow",
      functionCall: `createTask("${taskId}", "${reward}")`,
      txHash: hash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${hash}`,
    };
    console.log(`📋 Escrow created on-chain: ${hash}`);
    console.log(`   🔗 Explorer: ${interaction.explorerUrl}`);
    return interaction;
  } catch (error) {
    console.error(`❌ Escrow creation failed: ${error}`);
    console.log("   Falling back to mock escrow");
    return mockInteraction(
      "escrow_create", "AgentEscrow",
      `createTask("${taskId}", "${reward}")`,
    );
  }
}

// ── Escrow: claim ─────────────────────────────────────────────

export async function claimEscrowTask(
  taskId: string,
  agentAddress: string,
): Promise<ContractInteraction> {
  const escrowAddress = process.env.AGENT_ESCROW_ADDRESS;

  if (!escrowAddress || !isContractDeployed("agentEscrow")) {
    return mockInteraction(
      "escrow_claim", "AgentEscrow",
      `claimTask("${taskId}", "${agentAddress}")`,
    );
  }

  try {
    const clients = getClients();
    if (!clients) {
      return mockInteraction(
        "escrow_claim", "AgentEscrow",
        `claimTask("${taskId}", "${agentAddress}")`,
      );
    }

    const taskIdNum = BigInt(taskId.replace(/\D/g, "") || "0");
    const hash = await sendContractTx({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "claimTask",
      args: [taskIdNum],
    });
    await clients.publicClient.waitForTransactionReceipt({ hash });

    const interaction: ContractInteraction = {
      type: "escrow_claim",
      contractName: "AgentEscrow",
      functionCall: `claimTask("${taskId}", "${agentAddress}")`,
      txHash: hash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${hash}`,
    };
    console.log(`👋 Task claimed on-chain: ${hash}`);
    return interaction;
  } catch (error) {
    console.error(`❌ Task claim failed: ${error}`);
    return mockInteraction(
      "escrow_claim", "AgentEscrow",
      `claimTask("${taskId}", "${agentAddress}")`,
    );
  }
}

// ── Escrow: complete (approveCompletion) ──────────────────────

export async function completeEscrowTask(
  taskId: string,
): Promise<ContractInteraction> {
  const escrowAddress = process.env.AGENT_ESCROW_ADDRESS;

  if (!escrowAddress || !isContractDeployed("agentEscrow")) {
    return mockInteraction(
      "escrow_complete", "AgentEscrow",
      `approveCompletion("${taskId}")`,
    );
  }

  try {
    const clients = getClients();
    if (!clients) {
      return mockInteraction(
        "escrow_complete", "AgentEscrow",
        `approveCompletion("${taskId}")`,
      );
    }

    const taskIdNum = BigInt(taskId.replace(/\D/g, "") || "0");
    const hash = await sendContractTx({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "approveCompletion",
      args: [taskIdNum],
    });
    await clients.publicClient.waitForTransactionReceipt({ hash });

    const interaction: ContractInteraction = {
      type: "escrow_complete",
      contractName: "AgentEscrow",
      functionCall: `approveCompletion("${taskId}")`,
      txHash: hash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${hash}`,
    };
    console.log(`✅ Escrow completed on-chain: ${hash}`);
    return interaction;
  } catch (error) {
    console.error(`❌ Escrow completion failed: ${error}`);
    return mockInteraction(
      "escrow_complete", "AgentEscrow",
      `approveCompletion("${taskId}")`,
    );
  }
}

// ── Reputation ────────────────────────────────────────────────

export async function submitReputation(
  agentAddress: string,
  score: number,
  feedback: string,
): Promise<ContractInteraction> {
  const reputationAddress = process.env.REPUTATION_REGISTRY_ADDRESS;

  if (!reputationAddress || !isContractDeployed("reputationRegistry")) {
    return mockInteraction(
      "reputation", "ReputationRegistry",
      `giveFeedback("${agentAddress}", ${score}, "${feedback}")`,
    );
  }

  try {
    const clients = getClients();
    if (!clients) {
      return mockInteraction(
        "reputation", "ReputationRegistry",
        `giveFeedback("${agentAddress}", ${score}, "${feedback}")`,
      );
    }

    const hash = await sendContractTx({
      address: reputationAddress as `0x${string}`,
      abi: REPUTATION_ABI,
      functionName: "giveFeedback",
      args: [agentAddress as `0x${string}`, score, feedback],
    });
    await clients.publicClient.waitForTransactionReceipt({ hash });

    const interaction: ContractInteraction = {
      type: "reputation",
      contractName: "ReputationRegistry",
      functionCall: `giveFeedback("${agentAddress}", ${score}, "${feedback}")`,
      txHash: hash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${hash}`,
    };
    console.log(`⭐ Reputation submitted on-chain: ${hash}`);
    return interaction;
  } catch (error) {
    console.error(`❌ Reputation submission failed: ${error}`);
    return mockInteraction(
      "reputation", "ReputationRegistry",
      `giveFeedback("${agentAddress}", ${score}, "${feedback}")`,
    );
  }
}

// ============================================================
// Helpers
// ============================================================

function mockInteraction(
  type: ContractInteraction["type"],
  contractName: string,
  functionCall: string,
): ContractInteraction {
  const txHash = `MOCK_0x${generateMockHash()}`;
  return {
    type,
    contractName,
    functionCall,
    txHash,
    explorerUrl: `${ARC_CONFIG.explorerUrl}${txHash}`,
  };
}

function generateMockHash(): string {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

/**
 * Check health of all agent endpoints.
 */
export async function checkAgentHealth(): Promise<
  Array<{ type: string; url: string; status: "online" | "offline" }>
> {
  const results = await Promise.all(
    AGENT_ENDPOINTS.map(async (agent) => {
      try {
        const res = await fetch(agent.baseUrl, { signal: AbortSignal.timeout(3000) });
        return {
          type: agent.type,
          url: agent.baseUrl,
          status: (res.ok ? "online" : "offline") as "online" | "offline",
        };
      } catch {
        return { type: agent.type, url: agent.baseUrl, status: "offline" as const };
      }
    }),
  );
  return results;
}
