import { GatewayClient } from "@circle-fin/x402-batching/client";

import { updateTaskEventTxHash } from "./supabase";

const SETTLEMENT_TIMEOUT_MS = 30_000;
const SETTLEMENT_POLL_MS = 3_000;

export function isRealTransactionHash(value?: string | null): boolean {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}

export async function pollForSettlement(
  gateway: GatewayClient,
  transferRef: string,
): Promise<string> {
  if (
    !transferRef ||
    transferRef.startsWith("MOCK") ||
    transferRef.startsWith("0x_") ||
    isRealTransactionHash(transferRef)
  ) {
    return transferRef;
  }

  const deadline = Date.now() + SETTLEMENT_TIMEOUT_MS;
  console.log(`   ⏳ Polling Gateway for settlement of ref: ${transferRef.slice(0, 16)}...`);

  while (Date.now() < deadline) {
    try {
      const { transfers } = await gateway.searchTransfers({
        status: "completed",
      });

      const match = transfers.find(
        (t) =>
          t.id === transferRef ||
          (t as unknown as Record<string, unknown>)["txHash"] === transferRef ||
          (t as unknown as Record<string, unknown>)["transactionHash"] === transferRef,
      );

      if (match) {
        const txHash =
          (match as unknown as Record<string, unknown>)["txHash"] as string ||
          (match as unknown as Record<string, unknown>)["transactionHash"] as string ||
          transferRef;
        console.log(`   ✅ Settlement confirmed! On-chain TX: ${txHash}`);
        return txHash;
      }
    } catch (err) {
      console.log(`   ⚠️  Settlement poll error: ${err instanceof Error ? err.message : String(err)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, SETTLEMENT_POLL_MS));
  }

  console.log(`   ⚠️  Settlement not confirmed within ${SETTLEMENT_TIMEOUT_MS / 1000}s — using Gateway ref`);
  return transferRef;
}

export async function resolveGatewaySettlement(options: {
  gateway: GatewayClient;
  taskId: string;
  gatewayRef: string;
  onSettled?: (settledHash: string) => void;
}): Promise<void> {
  const { gateway, taskId, gatewayRef, onSettled } = options;

  if (!gatewayRef || gatewayRef.startsWith("MOCK") || gatewayRef.startsWith("0x_") || isRealTransactionHash(gatewayRef)) {
    return;
  }

  const settledHash = await pollForSettlement(gateway, gatewayRef);
  if (settledHash && settledHash !== gatewayRef) {
    onSettled?.(settledHash);
    await updateTaskEventTxHash(taskId, gatewayRef, settledHash);
  }
}