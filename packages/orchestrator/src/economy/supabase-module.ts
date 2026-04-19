// ============================================================
// Supabase recording module (shared across economy modules)
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface TaskEventRecord {
  task_id: string;
  agent_type: string;
  status: string;
  gateway_tx: string | null;
  amount: string;
  result: unknown;
  error: string | null;
}

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      supabaseClient = createClient(url, key);
    }
  }
  return supabaseClient;
}

/**
 * Record a task event to Supabase (non-blocking).
 * Silently fails if Supabase is not configured.
 */
export async function recordTaskEvent(event: TaskEventRecord): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    const { error } = await client
      .from("task_events")
      .insert({
        task_id: event.task_id,
        agent_type: event.agent_type,
        status: event.status,
        gateway_tx: event.gateway_tx,
        amount: event.amount,
        result: typeof event.result === "string" ? event.result : JSON.stringify(event.result),
        error: event.error,
      });

    if (error) {
      console.error(`   ⚠️  Supabase insert failed: ${error.message}`);
    }
  } catch (err) {
    console.error(`   ⚠️  Supabase error: ${err}`);
  }
}
