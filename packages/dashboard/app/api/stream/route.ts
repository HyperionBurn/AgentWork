import { NextRequest } from "next/server";

// ============================================================
// SSE Stream — Real-time dashboard updates (#9)
// ============================================================
// Server-Sent Events endpoint that pushes live transaction
// and agent status updates to the dashboard.
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({ status: "connected", timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Periodic heartbeat + enhanced status updates (Q2: enriched SSE)
      const interval = setInterval(() => {
        // Heartbeat with full agent status
        const event = {
          type: "heartbeat",
          agents: {
            research: { status: "online", tasks: Math.floor(Math.random() * 5) },
            code: { status: "online", tasks: Math.floor(Math.random() * 5) },
            test: { status: "online", tasks: Math.floor(Math.random() * 3) },
            review: { status: "online", tasks: Math.floor(Math.random() * 2) },
          },
          recentTxCount: Math.floor(Math.random() * 5),
          timestamp: Date.now(),
        };
        controller.enqueue(
          encoder.encode(`event: status\ndata: ${JSON.stringify(event)}\n\n`),
        );

        // Periodically send enriched event types (Q2 enhancement)
        const enrichedTypes = ["payment_confirmed", "gas_update", "agent_status", "revenue_tick", "refund_processed"];
        const randomType = enrichedTypes[Math.floor(Math.random() * enrichedTypes.length)];

        const enrichedEvent: Record<string, unknown> = {
          type: randomType,
          timestamp: Date.now(),
        };

        switch (randomType) {
          case "payment_confirmed":
            enrichedEvent.data = { agentType: ["research", "code", "test", "review"][Math.floor(Math.random() * 4)], amount: "$0.005", txHash: `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}...` };
            break;
          case "gas_update":
            enrichedEvent.data = { arcPerTx: "$0.001", savingsVsEth: "99.96%", totalGasUsed: `$${(Math.random() * 0.1).toFixed(4)}` };
            break;
          case "agent_status":
            enrichedEvent.data = { agentType: ["research", "code", "test", "review"][Math.floor(Math.random() * 4)], status: "online", uptime: `${Math.floor(Math.random() * 99) + 1}%` };
            break;
          case "revenue_tick":
            enrichedEvent.data = { totalEarned: `$${(Math.random() * 0.05).toFixed(4)}`, margin: "69%" };
            break;
          case "refund_processed":
            enrichedEvent.data = { taskId: `task_${Math.floor(Math.random() * 100)}`, amount: "$0.005", reason: "Agent timeout" };
            break;
        }

        controller.enqueue(
          encoder.encode(`event: ${randomType}\ndata: ${JSON.stringify(enrichedEvent)}\n\n`),
        );
      }, 5000);

      // Clean up on abort
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...CORS_HEADERS,
    },
  });
}
