import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import crypto from "crypto";

// ============================================================
// GC7: Receipts API
// ============================================================
// Lists payment receipts derived from task_events.
// Each "task_id" becomes a receipt with all its payments.
// Includes Merkle root computation for audit integrity.
// ============================================================

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return sha256("empty");
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

function isRealTransactionHash(value?: string | null): boolean {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}

interface TaskEventRow {
  task_id: string;
  agent_type: string;
  status: string;
  gateway_tx: string | null;
  amount: string | null;
  result: string | null;
  error: string | null;
  created_at: string;
}

export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({ receipts: [] });
  }

  // Fetch all completed task events
  const { data, error } = await supabase
    .from("task_events")
    .select("task_id, agent_type, status, gateway_tx, amount, result, error, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ receipts: [], error: error.message }, { status: 500 });
  }

  // Group by task_id to form receipts
  const grouped = new Map<string, TaskEventRow[]>();
  for (const row of (data || []) as TaskEventRow[]) {
    const existing = grouped.get(row.task_id) || [];
    existing.push(row);
    grouped.set(row.task_id, existing);
  }

  // Build receipt objects
  const receipts = Array.from(grouped.entries()).map(([taskId, events]) => {
    const payments = events
      .filter((e) => e.gateway_tx)
      .map((e) => ({
        agentType: e.agent_type,
        amount: e.amount || "$0.005",
        txHash: e.gateway_tx!,
        explorerUrl: isRealTransactionHash(e.gateway_tx) ? `https://testnet.arcscan.app/tx/${e.gateway_tx}` : undefined,
        status: e.status === "completed" ? "completed" : "failed",
      }));

    const completedPayments = payments.filter((p) => p.status === "completed");
    const totalAmount = completedPayments
      .reduce((sum, p) => sum + parseFloat(p.amount.replace("$", "")), 0);

    const merkleRoot = computeMerkleRoot(completedPayments.map((p) => p.txHash));

    return {
      receiptId: `rcpt_${taskId.slice(0, 16)}`,
      taskId,
      createdAt: events[0]?.created_at || new Date().toISOString(),
      chain: "arc",
      totalAmount: `$${totalAmount.toFixed(4)}`,
      totalPayments: payments.length,
      successfulPayments: completedPayments.length,
      merkleRoot,
      verificationUrl: "https://testnet.arcscan.app/",
      payments,
    };
  });

  return NextResponse.json({ receipts });
}
