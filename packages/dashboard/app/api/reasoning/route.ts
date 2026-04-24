import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GC3: Agent Reasoning Feed API
// Returns reasoning events from task_events where reasoning IS NOT NULL

export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { events: [], error: "Supabase not configured" },
      { status: 200 },
    );
  }

  try {
    // Dynamic import to avoid SSR issues without env vars
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("task_events")
      .select("id, task_id, agent_type, status, result, created_at")
      .not("result", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Reasoning fetch error:", error.message);
      return NextResponse.json(
        { events: [], error: error.message },
        { status: 200 },
      );
    }

    return NextResponse.json({
      events: (data || []).map(row => ({
        ...row,
        reasoning: row.result
      })),
      count: data?.length || 0,
    });
  } catch (err) {
    console.error("Reasoning API error:", err);
    return NextResponse.json(
      { events: [], error: "Internal error" },
      { status: 200 },
    );
  }
}
