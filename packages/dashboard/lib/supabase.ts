import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// Supabase Client — Lazy Initialization
// ============================================================
// Prevents crash at module load if env vars are missing
// (e.g., during build or local dev without Supabase)
// ============================================================

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      _supabase = createClient(url, key);
    }
  }
  return _supabase;
}

// Convenience alias for backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop];
  },
});

// ============================================================
// Database Types
// ============================================================

export interface PaymentEvent {
  id: string;
  payer: string;
  payee: string;
  amount: string;
  token: string;
  gateway_tx: string;
  endpoint: string;
  created_at: string;
}

export interface TaskEvent {
  id: string;
  task_id: string;
  agent_type: string;
  status: "pending" | "paying" | "completed" | "failed";
  gateway_tx: string | null;
  amount: string;
  result: string | null;
  created_at: string;
}

// ============================================================
// Real-time subscription helper
// ============================================================

export function subscribeToPayments(
  callback: (event: PaymentEvent) => void
) {
  const client = getSupabase();
  if (!client) return null;
  return client
    .channel("payment-events")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "payment_events" },
      (payload) => callback(payload.new as PaymentEvent)
    )
    .subscribe();
}

export function subscribeToTasks(
  callback: (event: TaskEvent) => void
) {
  const client = getSupabase();
  if (!client) return null;
  return client
    .channel("task-events")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "task_events" },
      (payload) => callback(payload.new as TaskEvent)
    )
    .subscribe();
}
