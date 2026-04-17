import { NextRequest, NextResponse } from "next/server";
import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import { supabase } from "./supabase";

// ============================================================
// Arc Testnet Constants
// ============================================================

export const ARC_CONFIG = {
  chainId: parseInt(process.env.ARC_CHAIN_ID || "5042002"),
  rpcUrl: process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network",
  usdcAddress: process.env.ARC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000",
  gatewayAddress: process.env.ARC_GATEWAY_ADDRESS || "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
  explorerUrl: process.env.ARC_EXPLORER || "https://testnet.arcscan.io/tx/",
} as const;

// ============================================================
// x402 Gateway Middleware for Next.js Route Handlers
// ============================================================
// Wraps a handler with x402 payment verification.
// - If no payment signature present → returns 402 with payment requirements
// - If payment present → verifies & settles via BatchFacilitatorClient, calls handler
// - Records every payment to Supabase payment_events table
// ============================================================

// Facilitator client for server-side verify + settle
let _facilitator: BatchFacilitatorClient | null = null;

function getFacilitator(): BatchFacilitatorClient {
  if (!_facilitator) {
    _facilitator = new BatchFacilitatorClient({
      url: process.env.GATEWAY_URL || "https://gateway-api-testnet.circle.com",
    });
  }
  return _facilitator;
}

export function withGateway(
  handler: (req: NextRequest, payment: PaymentInfo) => Promise<NextResponse>,
  price: string,
  endpoint: string
) {
  return async function gatewayHandler(req: NextRequest) {
    const paymentHeader = req.headers.get("payment-signature");

    if (!paymentHeader) {
      // Return 402 challenge — client should pay via x402 and retry
      return NextResponse.json(
        {
          error: "payment-required",
          message: `Send ${price} USDC to access ${endpoint}`,
          payment: {
            scheme: "exact",
            network: `eip155:${ARC_CONFIG.chainId}`,
            asset: ARC_CONFIG.usdcAddress,
            amount: price,
            payTo: process.env.SELLER_WALLET || "",
            maxTimeoutSeconds: 60,
            extra: {
              name: "GatewayWalletBatched",
              version: "1",
              verifyingContract: ARC_CONFIG.gatewayAddress as `0x${string}`,
            },
          },
        },
        {
          status: 402,
          headers: {
            "X-Payment-Required": "true",
            "X-Payment-Version": "1",
          },
        }
      );
    }

    try {
      const facilitator = getFacilitator();

      // Parse the payment payload from the header
      let paymentPayload: unknown;
      try {
        paymentPayload = JSON.parse(paymentHeader);
      } catch {
        return NextResponse.json(
          { error: "payment-invalid", message: "Malformed payment payload" },
          { status: 400 }
        );
      }

      // Build payment requirements for verification
      const paymentRequirements = {
        scheme: "exact",
        network: `eip155:${ARC_CONFIG.chainId}`,
        asset: ARC_CONFIG.usdcAddress,
        amount: price,
        payTo: process.env.SELLER_WALLET || "",
        maxTimeoutSeconds: 60,
        extra: {
          name: "GatewayWalletBatched",
          version: "1",
          verifyingContract: ARC_CONFIG.gatewayAddress as `0x${string}`,
        },
      };

      // Verify the payment
      const verifyResult = await facilitator.verify(
        paymentPayload as Parameters<typeof facilitator.verify>[0],
        paymentRequirements
      );

      if (!verifyResult.isValid) {
        return NextResponse.json(
          {
            error: "payment-invalid",
            message: verifyResult.invalidReason || "Payment verification failed",
          },
          { status: 402 }
        );
      }

      // Settle the payment (batch on-chain)
      const settleResult = await facilitator.settle(
        paymentPayload as Parameters<typeof facilitator.settle>[0],
        paymentRequirements
      );

      if (!settleResult.success) {
        return NextResponse.json(
          {
            error: "settlement-failed",
            message: settleResult.errorReason || "Payment settlement failed",
          },
          { status: 402 }
        );
      }

      const payment: PaymentInfo = {
        payer: verifyResult.payer || "unknown",
        payee: process.env.SELLER_WALLET,
        amount: price,
        formattedAmount: `$${price} USDC`,
        transactionHash: settleResult.transaction,
        network: settleResult.network,
      };

      // Record payment event to Supabase
      try {
        const { error } = await supabase.from("payment_events").insert({
          payer: payment.payer,
          payee: payment.payee,
          amount: payment.amount,
          token: ARC_CONFIG.usdcAddress,
          gateway_tx: payment.transactionHash,
          endpoint,
        });

        if (error) {
          console.error("[Supabase] Failed to record payment:", error.message);
        } else {
          console.log(`[Supabase] Payment recorded: ${payment.transactionHash}`);
        }
      } catch (dbError) {
        console.error("[Supabase] Error recording payment:", dbError);
      }

      // Call the actual handler with payment info
      return await handler(req, payment);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Payment processing failed";
      console.error("[x402] Payment error:", message);
      return NextResponse.json(
        { error: "payment-error", message },
        { status: 500 }
      );
    }
  };
}

// ============================================================
// Types
// ============================================================

export interface PaymentInfo {
  payer: string;
  payee?: string;
  amount: string;
  formattedAmount: string;
  transactionHash: string;
  network: string;
}
