// ============================================================
// Contract Client — viem setup + minimal ABIs
// ============================================================
// Lazily-initialized viem clients and inline ABIs for AgentEscrow
// and ReputationRegistry. Extracted from contracts.ts to keep
// that file under 300 lines.
// ============================================================

import { createPublicClient, createWalletClient, http, defineChain, type Hash } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_CONFIG } from "./config";

// ── Arc testnet chain definition for viem ─────────────────────

export const arcTestnet = defineChain({
  id: ARC_CONFIG.chainId,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: [ARC_CONFIG.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.io" },
  },
});

// ── Minimal ABIs (matching Vyper source signatures) ──────────

export const ESCROW_ABI = [
  {
    name: "createTask",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_agent", type: "address" },
      { name: "_reward", type: "uint256" },
      { name: "_description", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "claimTask",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_task_id", type: "uint256" }],
    outputs: [],
  },
  {
    name: "submitResult",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_task_id", type: "uint256" },
      { name: "_result", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "approveCompletion",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_task_id", type: "uint256" }],
    outputs: [],
  },
  {
    name: "dispute",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_task_id", type: "uint256" },
      { name: "_reason", type: "string" },
    ],
    outputs: [],
  },
] as const;

export const REPUTATION_ABI = [
  {
    name: "giveFeedback",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_agent", type: "address" },
      { name: "_score", type: "uint8" },
      { name: "_comment", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ── Lazy viem client singleton ───────────────────────────────

interface ViemClients {
  publicClient: ReturnType<typeof createPublicClient>;
  /** walletClient carries chain=arcTestnet but viem's ReturnType loses it;
   *  use writeContract() directly — it works at runtime. */
  walletClient: ReturnType<typeof createWalletClient>;
}

let cachedClients: ViemClients | null = null;

/**
 * Lazily initialise viem public + wallet clients.
 * Returns null if ORCHESTRATOR_PRIVATE_KEY is not configured.
 */
export function getClients(): ViemClients | null {
  if (cachedClients) return cachedClients;

  const pk = process.env.ORCHESTRATOR_PRIVATE_KEY;
  if (!pk) return null;

  const account = privateKeyToAccount(pk as `0x${string}`);

  const publicClient = createPublicClient({
    transport: http(ARC_CONFIG.rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(ARC_CONFIG.rpcUrl),
  });

  cachedClients = { publicClient, walletClient };
  return cachedClients;
}

/**
 * Type-safe writeContract wrapper that works around viem's complex generics.
 * The walletClient is created with chain=arcTestnet and account, so both are
 * injected automatically at runtime.
 */
export async function sendContractTx(
  params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  },
): Promise<Hash> {
  const clients = getClients();
  if (!clients) throw new Error("No wallet client configured");

  // walletClient was created with both chain and account. We cast through
  // unknown to bypass viem's complex WriteContractParameters generics — at
  // runtime the call is fully type-safe because chain + account are set.
  const writeContract = clients.walletClient.writeContract as unknown as (
    p: typeof params & { chain: typeof arcTestnet },
  ) => Promise<Hash>;

  return writeContract({ ...params, chain: arcTestnet });
}
