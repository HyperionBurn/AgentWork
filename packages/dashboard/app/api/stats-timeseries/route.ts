import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

interface TimeseriesPoint {
  timestamp: string;
  count: number;
  totalAmount: number;
}

interface AgentBreakdownPoint {
  agentType: string;
  count: number;
  totalAmount: number;
}

interface StatsResponse {
  timeseries: TimeseriesPoint[];
  agentBreakdown: AgentBreakdownPoint[];
}

interface EventRow {
  created_at: string;
  agent_type: string;
  amount: string | null;
}

export async function GET(_req: NextRequest): Promise<NextResponse<StatsResponse>> {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({ timeseries: [], agentBreakdown: [] });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("task_events")
    .select("created_at, agent_type, amount")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return NextResponse.json({ timeseries: [], agentBreakdown: [] });
  }

  const rows: EventRow[] = data;

  // Build timeseries: bucket by minute
  const minuteMap = new Map<string, { count: number; totalAmount: number }>();

  for (const row of rows) {
    const d = new Date(row.created_at);
    const minuteKey = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes()
    ).toISOString();

    const entry = minuteMap.get(minuteKey) ?? { count: 0, totalAmount: 0 };
    entry.count += 1;
    entry.totalAmount += parseAmount(row.amount);
    minuteMap.set(minuteKey, entry);
  }

  const timeseries: TimeseriesPoint[] = Array.from(minuteMap.entries())
    .map(([timestamp, { count, totalAmount }]) => ({ timestamp, count, totalAmount }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Build agentBreakdown: group by agent_type
  const agentMap = new Map<string, { count: number; totalAmount: number }>();

  for (const row of rows) {
    const key = row.agent_type ?? "unknown";
    const entry = agentMap.get(key) ?? { count: 0, totalAmount: 0 };
    entry.count += 1;
    entry.totalAmount += parseAmount(row.amount);
    agentMap.set(key, entry);
  }

  const agentBreakdown: AgentBreakdownPoint[] = Array.from(agentMap.entries())
    .map(([agentType, { count, totalAmount }]) => ({ agentType, count, totalAmount }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ timeseries, agentBreakdown });
}

function parseAmount(raw: string | null | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/^\$/, "");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}
