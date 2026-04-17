import { withGateway, PaymentInfo } from "@/lib/x402";
import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

/**
 * Paywalled endpoint — returns live agent stats.
 * Cost: $0.001 per call.
 */
export const GET = withGateway(
  async (req: NextRequest, payment: PaymentInfo) => {
    const supabase = getSupabase();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        paid_by: payment.payer,
        amount: payment.formattedAmount,
        tx: payment.transactionHash,
        explorer: `https://testnet.arcscan.io/tx/${payment.transactionHash}`,
        payments: [],
        total_payments: 0,
      });
    }

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agent");

    let query = supabase
      .from("payment_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (agentId) {
      query = query.eq("endpoint", agentId);
    }

    const { data: payments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paid_by: payment.payer,
      amount: payment.formattedAmount,
      tx: payment.transactionHash,
      explorer: `https://testnet.arcscan.io/tx/${payment.transactionHash}`,
      payments: payments || [],
      total_payments: payments?.length || 0,
    });
  },
  "$0.001",
  "/api/agent-stats"
);
