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
  tokens?: number;
  // GC3: Agent Reasoning Feed — AI decision trace
  reasoning?: {
    agent: string;
    model?: string;
    decision: string;
    factors?: Record<string, unknown>;
    timestamp: number;
  };
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
        // GC3: Reasoning JSONB — temporarily disabled if missing from schema
        // ...(event.reasoning ? { reasoning: event.reasoning } : {}),
      });

    if (error) {
      console.error(`   ⚠️  Supabase insert failed: ${error.message}`);
    }
  } catch (err) {
    console.error(`   ⚠️  Supabase error: ${err}`);
  }
}
/**
 * Fetch agent history for reputation-based routing.
 */
export async function getAgentHistory(): Promise<Record<string, { avgScore: number; completedCount: number }>> {
  const client = getSupabase();
  if (!client) return {};

  try {
    // Fetch all evaluation events (status changed from "reasoning" to include evaluation data in result)
    const { data, error } = await client
      .from("task_events")
      .select("agent_type, result")
      .eq("status", "reasoning");

    if (error || !data) return {};

    const stats: Record<string, { totalScore: number; count: number }> = {};
    
    data.forEach(item => {
      const result = typeof item.result === 'string' ? (() => { try { return JSON.parse(item.result); } catch { return null; } })() : item.result;
      const score = result?.score || result?.factors?.score;
      if (score) {
        const type = item.agent_type === "review-agent" ? "code-agent" : item.agent_type;
        if (!stats[type]) stats[type] = { totalScore: 0, count: 0 };
        stats[type].totalScore += score;
        stats[type].count += 1;
      }
    });

    const result: Record<string, { avgScore: number; completedCount: number }> = {};
    Object.entries(stats).forEach(([type, s]) => {
      result[type] = {
        avgScore: Math.round(s.totalScore / s.count),
        completedCount: s.count
      };
    });

    return result;
  } catch {
    return {};
  }
}
