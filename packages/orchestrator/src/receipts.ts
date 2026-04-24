// ============================================================
// GC7: Payment Receipt Engine
// ============================================================
// Generates cryptographically-verifiable payment receipts
// after each orchestrator run. Each receipt contains all tx
// hashes, amounts, agent responses, and a Merkle root.
// ============================================================

import * as crypto from "crypto";

// ── Types ────────────────────────────────────────────────────

export interface ReceiptPayment {
  agentType: string;
  amount: string;
  txHash: string;
  explorerUrl: string;
  status: "completed" | "failed";
  responsePreview: string;
  timestamp: number;
}

export interface PaymentReceipt {
  receiptId: string;
  taskId: string;
  createdAt: string;
  chain: "arc";
  chainId: number;
  totalAmount: string;
  totalPayments: number;
  successfulPayments: number;
  payments: ReceiptPayment[];
  merkleRoot: string;
  verificationUrl: string;
}

// ── Receipt Generation ───────────────────────────────────────

function isRealTransactionHash(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

/**
 * Generate a payment receipt from orchestrator run results.
 * Includes a Merkle root over all tx hashes for batch verification.
 */
export function generateReceipt(params: {
  taskId: string;
  payments: Array<{
    agentType: string;
    amount: string;
    txHash: string;
    success: boolean;
    response?: string;
  }>;
}): PaymentReceipt {
  const { taskId, payments } = params;

  // Build receipt payments
  const receiptPayments: ReceiptPayment[] = payments.map((p) => ({
    agentType: p.agentType,
    amount: p.amount,
    txHash: p.txHash,
    explorerUrl: isRealTransactionHash(p.txHash)
      ? `https://testnet.arcscan.app/tx/${p.txHash}`
      : "",
    status: p.success ? "completed" as const : "failed" as const,
    responsePreview: p.response
      ? (typeof p.response === "string" ? p.response : JSON.stringify(p.response)).slice(0, 200)
      : "",
    timestamp: Date.now(),
  }));

  // Calculate Merkle root from all tx hashes
  const txHashes = receiptPayments
    .filter((p) => p.status === "completed" && p.txHash)
    .map((p) => p.txHash);
  const merkleRoot = computeMerkleRoot(txHashes);

  // Calculate total
  const successfulPayments = receiptPayments.filter((p) => p.status === "completed");
  const totalAmount = successfulPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount.replace("$", "")),
    0,
  );

  return {
    receiptId: generateReceiptId(),
    taskId,
    createdAt: new Date().toISOString(),
    chain: "arc",
    chainId: 5042002,
    totalAmount: `$${totalAmount.toFixed(4)}`,
    totalPayments: receiptPayments.length,
    successfulPayments: successfulPayments.length,
    payments: receiptPayments,
    merkleRoot,
    verificationUrl: `https://testnet.arcscan.app/tx/${merkleRoot}`,
  };
}

/**
 * Verify a receipt's Merkle root against its payments.
 * Returns true if all payment tx hashes hash to the stored root.
 */
export function verifyReceipt(receipt: PaymentReceipt): boolean {
  const txHashes = receipt.payments
    .filter((p) => p.status === "completed" && p.txHash)
    .map((p) => p.txHash);
  const computedRoot = computeMerkleRoot(txHashes);
  return computedRoot === receipt.merkleRoot;
}

/**
 * Export receipt as a downloadable JSON string.
 */
export function receiptToJson(receipt: PaymentReceipt): string {
  return JSON.stringify(receipt, null, 2);
}

// ── Internal Helpers ─────────────────────────────────────────

function generateReceiptId(): string {
  const hash = crypto.createHash("sha256");
  hash.update(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return `rcpt_${hash.digest("hex").slice(0, 16)}`;
}

function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return crypto.createHash("sha256").update("empty").digest("hex");
  if (hashes.length === 1) return sha256(hashes[0]);

  let current = hashes.map((h) => sha256(h));

  while (current.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = current[i + 1] || left; // duplicate last if odd
      next.push(sha256(left + right));
    }
    current = next;
  }

  return current[0];
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
