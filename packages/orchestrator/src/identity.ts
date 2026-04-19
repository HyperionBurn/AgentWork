// ============================================================
// Agent Identity — On-chain ERC-8004 identity registration
// ============================================================
// Mints identity NFTs for each agent via IdentityRegistry.vy.
// When contracts are deployed, uses real viem calls.
// Otherwise falls back to mock interactions.
// ============================================================

import { ARC_CONFIG, AGENT_ENDPOINTS, isContractDeployed } from "./config";
import { getClients, sendContractTx } from "./contracts-client";
import type { Hash } from "viem";

// ── Minimal ABI for IdentityRegistry ────────────────────────

export const IDENTITY_ABI = [
  {
    name: "registerAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_name", type: "string" },
      { name: "_metadata_uri", type: "string" },
      { name: "_capabilities", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_token_id", type: "uint256" }],
    outputs: [
      { name: "", type: "address" },
      { name: "", type: "string" },
      { name: "", type: "string" },
      { name: "", type: "string" },
      { name: "", type: "bool" },
    ],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_token_id", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "agent_count",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ── Agent metadata ──────────────────────────────────────────

interface AgentMetadata {
  name: string;
  capabilities: string;
  metadataUri: string;
}

const AGENT_METADATA: Record<string, AgentMetadata> = {
  research: {
    name: "Research Agent",
    capabilities: "web_search,summarization,citation,deep_analysis",
    metadataUri: "https://agentwork.dev/agents/research.json",
  },
  code: {
    name: "Code Agent",
    capabilities: "code_generation,implementation,refactoring,bug_fixing",
    metadataUri: "https://agentwork.dev/agents/code.json",
  },
  test: {
    name: "Test Agent",
    capabilities: "test_generation,qa,coverage,validation",
    metadataUri: "https://agentwork.dev/agents/test.json",
  },
  review: {
    name: "Review Agent",
    capabilities: "code_review,quality_scoring,security_audit,feedback",
    metadataUri: "https://agentwork.dev/agents/review.json",
  },
};

// ── Result types ────────────────────────────────────────────

export interface IdentityRegistration {
  agentType: string;
  tokenId: number | null;
  txHash: string;
  explorerUrl: string;
  mock: boolean;
}

// ── Register a single agent identity ────────────────────────

export async function registerAgentIdentity(
  agentType: string,
): Promise<IdentityRegistration> {
  const identityAddress = process.env.IDENTITY_REGISTRY_ADDRESS;
  const meta = AGENT_METADATA[agentType];

  if (!meta) {
    return {
      agentType,
      tokenId: null,
      txHash: `MOCK_UNKNOWN_${agentType}`,
      explorerUrl: "",
      mock: true,
    };
  }

  if (!identityAddress || !isContractDeployed("identityRegistry")) {
    console.log(`   ⚠️  IdentityRegistry not deployed — mock identity for ${agentType}`);
    return {
      agentType,
      tokenId: null,
      txHash: `MOCK_IDENTITY_${agentType.toUpperCase()}`,
      explorerUrl: "",
      mock: true,
    };
  }

  try {
    const clients = getClients();
    if (!clients) {
      console.log(`   ⚠️  No wallet configured — mock identity for ${agentType}`);
      return {
        agentType,
        tokenId: null,
        txHash: `MOCK_IDENTITY_${agentType.toUpperCase()}`,
        explorerUrl: "",
        mock: true,
      };
    }

    const hash: Hash = await sendContractTx({
      address: identityAddress as `0x${string}`,
      abi: IDENTITY_ABI,
      functionName: "registerAgent",
      args: [meta.name, meta.metadataUri, meta.capabilities],
    });

    await clients.publicClient.waitForTransactionReceipt({ hash });

    console.log(`   🆔 ${meta.name} registered on-chain: ${hash}`);
    console.log(`      🔗 Explorer: ${ARC_CONFIG.explorerUrl}${hash}`);

    return {
      agentType,
      tokenId: null, // Would need to parse event logs for exact ID
      txHash: hash,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${hash}`,
      mock: false,
    };
  } catch (error) {
    console.error(`   ❌ Identity registration failed for ${agentType}: ${error}`);
    return {
      agentType,
      tokenId: null,
      txHash: `MOCK_IDENTITY_${agentType.toUpperCase()}`,
      explorerUrl: "",
      mock: true,
    };
  }
}

// ── Register all agents ─────────────────────────────────────

export async function registerAllAgentIdentities(): Promise<IdentityRegistration[]> {
  console.log("🆔 Registering agent identities on-chain...");
  const results: IdentityRegistration[] = [];

  for (const agent of AGENT_ENDPOINTS) {
    const reg = await registerAgentIdentity(agent.type);
    results.push(reg);
  }

  const realCount = results.filter((r) => !r.mock).length;
  const mockCount = results.filter((r) => r.mock).length;
  console.log(`   ${realCount} real identities, ${mockCount} mock identities\n`);

  return results;
}
