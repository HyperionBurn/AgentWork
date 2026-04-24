import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// SSE Stream — Real-time Supabase-backed payment feed
// ============================================================
// Polls task_events table for new rows and pushes them as
// SSE events. ZERO mock data — if Supabase is unreachable,
// emits a connection-error and closes.
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const EXPLORER_BASE = "https://testnet.arcscan.app/tx/";
const POLL_INTERVAL_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 30000;

function isRealTransactionHash(value?: string | null): boolean {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}

interface TaskEventRow {
  task_id: string;
  agent_type: string;
  status: string;
  gateway_tx: string | null;
  amount: string | null;
  created_at: string;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // --- Initialise Supabase client ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Cannot connect — single error event then close
    const body = `event: connection-error\ndata: ${JSON.stringify({
      type: "connection-error",
      message: "Supabase credentials not configured",
      timestamp: Date.now(),
    })}\n\n`;

    return new Response(body, {
      status: 503,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        ...CORS_HEADERS,
      },
    });
  }

  let cleanup: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      let pollInterval: NodeJS.Timeout | null = null;
      let heartbeatInterval: NodeJS.Timeout | null = null;
      let isClosed = false;

      const supabase = getSupabase();

      cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        if (pollInterval) clearInterval(pollInterval);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      };

      const send = (event: string, data: any) => {
        if (isClosed) return;
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          cleanup();
        }
      };

      // Heartbeat to keep connection alive (every 30s)
      heartbeatInterval = setInterval(() => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          } catch {
            cleanup();
          }
        }
      }, 30000);

      // Initial connection state
      send("connected", { status: "live", timestamp: Date.now() });

      // Track the most recent timestamp we've seen
      let lastSeenTimestamp = new Date(Date.now() - 300_000).toISOString(); 

      // Poll for new task events
      const fetchNewEvents = async () => {
        if (isClosed || !supabase) return;

        try {
          const { data, error } = await supabase
            .from("task_events")
            .select("task_id, agent_type, status, gateway_tx, amount, created_at")
            .gt("created_at", lastSeenTimestamp)
            .order("created_at", { ascending: true })
            .limit(50);

          if (error) {
            console.error("[SSE Stream] Supabase error:", error.message);
            return;
          }

          if (data && data.length > 0) {
            for (const row of data) {
              if (isClosed) break;
              
              const txHash = row.gateway_tx || "";
              const payload = {
                type: "payment",
                agentType: row.agent_type,
                amount: row.amount || "$0.005",
                txHash,
                explorerUrl: isRealTransactionHash(txHash) ? `${EXPLORER_BASE}${txHash}` : "",
                taskId: row.task_id,
                status: row.status,
                timestamp: new Date(row.created_at).getTime(),
              };

              send("payment", payload);
              lastSeenTimestamp = row.created_at;
            }
          }
        } catch (err) {
          // Silent catch to prevent stream crash
        }
      };

      fetchNewEvents();
      pollInterval = setInterval(fetchNewEvents, 5000);

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      cleanup();
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
