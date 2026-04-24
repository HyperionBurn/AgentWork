"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================
// LivePaymentFeed — Real-time SSE payment card feed
// ============================================================
// Connects to /api/stream and renders animated payment cards
// with zero mock data. Shows "Waiting for payments..." when
// idle and "Reconnecting..." on errors.
// ============================================================

const EXPLORER_BASE = "https://testnet.arcscan.io/tx/";
const MAX_EVENTS = 50;

interface PaymentEvent {
  type: "payment";
  agentType: string;
  amount: string;
  txHash: string;
  explorerUrl: string;
  taskId: string;
  status: string;
  timestamp: number;
}

const AGENT_COLORS: Record<string, string> = {
  research: "#06B6D4", // cyan
  code: "#10B981",     // emerald
  test: "#F59E0B",     // amber
  review: "#7C3AED",   // purple
};

const AGENT_NAMES: Record<string, string> = {
  research: "Research Agent",
  code: "Code Agent",
  test: "Test Agent",
  review: "Review Agent",
};

function truncateHash(hash: string): string {
  if (!hash || hash.length <= 13) return hash || "—";
  return `${hash.slice(0, 10)}...`;
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function LivePaymentFeed() {
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [status, setStatus] = useState<"connecting" | "waiting" | "live" | "reconnecting">("connecting");
  const feedRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstEventTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Relative timestamps tick every second
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(() => {
    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const es = new EventSource("/api/stream");
    eventSourceRef.current = es;

    // If no events arrive within 5s, show "waiting"
    firstEventTimeoutRef.current = setTimeout(() => {
      setStatus((prev) => (prev === "connecting" ? "waiting" : prev));
    }, 5000);

    es.addEventListener("connected", () => {
      setStatus("waiting");
    });

    es.addEventListener("payment", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as PaymentEvent;
        setStatus("live");

        setEvents((prev) => {
          const next = [data, ...prev];
          return next.slice(0, MAX_EVENTS);
        });

        if (firstEventTimeoutRef.current) {
          clearTimeout(firstEventTimeoutRef.current);
          firstEventTimeoutRef.current = null;
        }
      } catch {
        // Malformed payload — ignore
      }
    });

    es.addEventListener("connection-error", () => {
      setStatus("reconnecting");
      es.close();
      // Retry in 5 seconds
      reconnectTimerRef.current = setTimeout(connect, 5000);
    });

    es.onerror = () => {
      setStatus("reconnecting");
      es.close();
      if (firstEventTimeoutRef.current) {
        clearTimeout(firstEventTimeoutRef.current);
        firstEventTimeoutRef.current = null;
      }
      // Retry in 5 seconds
      reconnectTimerRef.current = setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (firstEventTimeoutRef.current) {
        clearTimeout(firstEventTimeoutRef.current);
        firstEventTimeoutRef.current = null;
      }
    };
  }, [connect]);

  // Auto-scroll to top when new event arrives
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events.length]);

  const agentColor = (type: string) => AGENT_COLORS[type] ?? "#94A3B8";

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              status === "live"
                ? "bg-green-400 animate-pulse"
                : status === "reconnecting"
                  ? "bg-red-400 animate-pulse"
                  : "bg-slate-500"
            }`}
          />
          <h2 className="text-lg font-semibold text-slate-100">
            Live Transaction Feed
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          {events.length} payment{events.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Feed container */}
      <div
        ref={feedRef}
        className="h-[420px] overflow-y-auto rounded-xl border border-[#334155] bg-[#0F172A]/60 p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {/* Status overlays */}
        {events.length === 0 && (
          <div className="flex items-center justify-center h-full">
            {status === "connecting" && (
              <p className="text-slate-400 text-sm animate-pulse">
                Connecting...
              </p>
            )}
            {status === "waiting" && (
              <p className="text-slate-500 text-sm animate-pulse">
                Waiting for payments...
              </p>
            )}
            {status === "reconnecting" && (
              <p className="text-red-400 text-sm animate-pulse">
                Reconnecting...
              </p>
            )}
          </div>
        )}

        {/* Payment cards */}
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={`${event.taskId}-${event.timestamp}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="rounded-lg border border-[#334155] bg-[#1E293B] px-4 py-3 flex items-center gap-3 hover:border-[#475569] transition-colors"
            >
              {/* Agent color dot */}
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: agentColor(event.agentType),
                  boxShadow: `0 0 8px ${agentColor(event.agentType)}40`,
                }}
              />

              {/* Agent name + amount */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#F1F5F9] truncate">
                    {AGENT_NAMES[event.agentType] ?? event.agentType}
                  </span>
                  <span className="text-sm font-mono text-white">
                    {event.amount}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {event.explorerUrl ? (
                    <a
                      href={event.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors underline decoration-slate-600"
                    >
                      {truncateHash(event.txHash)}
                    </a>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">
                      {truncateHash(event.txHash)}
                    </span>
                  )}
                  <span className="text-xs text-slate-600">·</span>
                  <span className="text-xs text-slate-500">
                    {relativeTime(event.timestamp)}
                  </span>
                </div>
              </div>

              {/* Status badge */}
              <span
                className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                  event.status === "completed"
                    ? "bg-green-500/20 text-green-400"
                    : event.status === "failed"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {event.status}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}