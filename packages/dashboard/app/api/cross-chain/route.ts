import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// GC9: Cross-Chain Withdrawal API
// ============================================================
// Returns supported chains for withdrawal from Arc Gateway,
// along with estimated bridge fees and status.
// Uses Circle Bridge Kit (recommended by hackathon).
// ============================================================

import type { BridgeChainIdentifier } from "@circle-fin/bridge-kit";

// BridgeStep is not exported from bridge-kit — define locally
interface BridgeStepResult {
  name: string;
  state: "pending" | "success" | "error" | "noop";
  txHash?: string;
  explorerUrl?: string;
}

interface SupportedChain {
  id: string;
  name: string;
  testnetName: string;
  chainId: number;
  estimatedFee: string;
  estimatedTime: string;
  color: string;
  enabled: boolean;
  bridgeKitChainName?: string;
}

const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    id: "base",
    name: "Base",
    testnetName: "Base Sepolia",
    chainId: 84532,
    estimatedFee: "$0.01",
    estimatedTime: "~30 seconds",
    color: "#0052FF",
    enabled: true,
    bridgeKitChainName: "Base_Sepolia",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    testnetName: "Sepolia",
    chainId: 11155111,
    estimatedFee: "$0.05",
    estimatedTime: "~2 minutes",
    color: "#627EEA",
    enabled: true,
    bridgeKitChainName: "Ethereum_Sepolia",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    testnetName: "Arbitrum Sepolia",
    chainId: 421614,
    estimatedFee: "$0.01",
    estimatedTime: "~1 minute",
    color: "#28A0F0",
    enabled: true,
    bridgeKitChainName: "Arbitrum_Sepolia",
  },
  {
    id: "optimism",
    name: "Optimism",
    testnetName: "OP Sepolia",
    chainId: 11155420,
    estimatedFee: "$0.01",
    estimatedTime: "~1 minute",
    color: "#FF0420",
    enabled: true,
    bridgeKitChainName: "Optimism_Sepolia",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    testnetName: "Avalanche Fuji",
    chainId: 43113,
    estimatedFee: "$0.01",
    estimatedTime: "~30 seconds",
    color: "#E84142",
    enabled: true,
    bridgeKitChainName: "Avalanche_Fuji",
  },
  {
    id: "polygon",
    name: "Polygon",
    testnetName: "Polygon Amoy",
    chainId: 80002,
    estimatedFee: "$0.01",
    estimatedTime: "~1 minute",
    color: "#8247E5",
    enabled: true,
    bridgeKitChainName: "Polygon_Amoy_Testnet",
  },
  {
    id: "solana",
    name: "Solana",
    testnetName: "Solana Devnet",
    chainId: 0,
    estimatedFee: "$0.005",
    estimatedTime: "~5 seconds",
    color: "#9945FF",
    enabled: false,
    // Solana requires a different adapter — not supported via EVM bridge kit
  },
];

export async function GET() {
  const supabase = getSupabase();

  let gatewayBalance = "$0.0000";

  if (supabase) {
    const { data } = await supabase
      .from("gateway_state")
      .select("balance")
      .eq("id", "default")
      .single();

    if (data?.balance) {
      gatewayBalance = data.balance;
    }
  }

  return NextResponse.json({
    chains: SUPPORTED_CHAINS,
    gatewayBalance,
    sourceChain: {
      name: "Arc Testnet",
      chainId: 5042002,
      nativeToken: "USDC",
    },
    note: "Cross-chain withdrawal uses Circle Bridge Kit for USDC transfer. In production, transactions are settled via CCTP (Circle Cross-Chain Transfer Protocol).",
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { chainId, amount } = body as { chainId?: number; amount?: string };

  if (!chainId || !amount) {
    return NextResponse.json(
      { error: "Missing chainId or amount" },
      { status: 400 },
    );
  }

  const chain = SUPPORTED_CHAINS.find((c) => c.chainId === chainId);
  if (!chain) {
    return NextResponse.json(
      { error: `Unsupported chain: ${chainId}` },
      { status: 400 },
    );
  }

  // Try real Bridge Kit integration
  const privateKey = process.env.ORCHESTRATOR_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (privateKey && chain.bridgeKitChainName) {
    try {
      // Dynamic import — bridge-kit may not be installed
      const { BridgeKit } = await import("@circle-fin/bridge-kit");
      const { createViemAdapterFromPrivateKey } = await import(
        "@circle-fin/adapter-viem-v2"
      );

      const kit = new BridgeKit();
      const adapter = createViemAdapterFromPrivateKey({ privateKey });

      const numericAmount = parseFloat(amount.replace("$", ""));
      const destChain = chain.bridgeKitChainName as BridgeChainIdentifier;

      const bridgeResult = await kit.bridge({
        from: { adapter, chain: "Arc_Testnet" as BridgeChainIdentifier },
        to: { adapter, chain: destChain },
        amount: numericAmount.toFixed(2),
        config: { transferSpeed: "FAST" as const },
      });

      return NextResponse.json({
        status: bridgeResult.state,
        amount: bridgeResult.amount,
        token: bridgeResult.token,
        sourceChain: bridgeResult.source.chain.name,
        destinationChain: bridgeResult.destination.chain.name,
        steps: bridgeResult.steps.map((step) => ({
          name: step.name,
          state: step.state,
          txHash: step.txHash || null,
          explorerUrl: step.explorerUrl || null,
        })),
        note: "Real CCTP bridge via Circle Bridge Kit",
      });
    } catch (bridgeError: unknown) {
      const msg =
        bridgeError instanceof Error ? bridgeError.message : String(bridgeError);
      // Bridge failed — return detailed error with fallback
      return NextResponse.json({
        status: "error",
        message: `Bridge attempt failed: ${msg}`,
        chain: chain.testnetName,
        amount,
        estimatedFee: chain.estimatedFee,
        estimatedTime: chain.estimatedTime,
        note: "Bridge Kit installed but transfer failed. Check wallet balance and RPC connectivity.",
        fallback: true,
      });
    }
  }

  // Fallback: simulated bridge (bridge-kit not installed or no private key)
  return NextResponse.json({
    status: "simulated",
    message: `Bridge transfer simulated: ${amount} USDC from Arc → ${chain.name}`,
    chain: chain.testnetName,
    amount,
    estimatedFee: chain.estimatedFee,
    estimatedTime: chain.estimatedTime,
    note: privateKey
      ? "Bridge Kit not installed — install @circle-fin/bridge-kit for real transfers"
      : "No PRIVATE_KEY configured — set ORCHESTRATOR_PRIVATE_KEY or PRIVATE_KEY in .env",
    fallback: true,
  });
}
