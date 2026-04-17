import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// Supabase Client — Orchestrator
// ============================================================
// Records task events and payment results to the shared
// Supabase instance for dashboard real-time feed.
// ============================================================

let supabase: SupabaseClient | null = null;

export interface TaskEventRecord {
  task_id: string;
  agent_type: string;
  status: "pending" | "paying" | "paid" | "completed" | "failed";
  gateway_tx: string | null;
  amount: string | null;
  result: unknown;
  error: string | null;
}

/**
 * Initialize the Supabase client. Safe to call multiple times.
 */
export function initSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      "⚠️ SUPABASE_URL or SUPABASE_ANON_KEY not set — task events will NOT be recorded to dashboard"
    );
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

/**
 * Record a task event to Supabase for the dashboard feed.
 * Non-blocking — errors are logged but never throw.
 */
export async function recordTaskEvent(
  event: TaskEventRecord
): Promise<void> {
  const client = initSupabase();
  if (!client) return;

  try {
    const { error } = await client.from("task_events").insert({
      task_id: event.task_id,
      agent_type: event.agent_type,
      status: event.status,
      gateway_tx: event.gateway_tx,
      amount: event.amount,
      result:
        event.result !== undefined
          ? JSON.stringify(event.result)
          : null,
      error: event.error,
    });

    if (error) {
      console.error(`❌ Failed to record task event: ${error.message}`);
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown Supabase error";
    console.error(`❌ Supabase insert failed: ${message}`);
  }
}
