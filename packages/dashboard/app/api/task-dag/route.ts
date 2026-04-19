import { NextResponse } from "next/server";

// ============================================================
// HF-9: Task DAG API
// Returns the most recent task decomposition as a DAG
// for the pipeline visualization component.
// ============================================================

interface DAGNode {
  id: string;
  agentType: string;
  status: "pending" | "running" | "completed" | "failed";
  input: string;
  output?: string;
  cost: string;
  txHash?: string;
}

interface TaskDAG {
  nodes: DAGNode[];
  edges: { from: string; to: string }[];
  taskId: string;
  createdAt: string;
}

// In-memory store (resets on redeploy; fine for demo)
let latestDAG: TaskDAG | null = null;

/**
 * Build a DAG from the standard 4-agent pipeline.
 * In production, this would query the orchestrator's actual state.
 */
function buildDemoDAG(): TaskDAG {
  const taskId = `task_${Date.now().toString(36)}`;
  const agents: Array<{ type: string; input: string }> = [
    { type: "research", input: "Research the topic and gather key findings" },
    { type: "code",     input: "Implement solution based on research" },
    { type: "test",     input: "Write and execute tests for the implementation" },
    { type: "review",   input: "Review code quality and suggest improvements" },
  ];

  const nodes: DAGNode[] = agents.map((agent, i) => ({
    id: `${taskId}_${agent.type}`,
    agentType: agent.type,
    status: "completed" as const,
    input: agent.input,
    output: `${agent.type} task completed successfully`,
    cost: "$0.005",
    txHash: undefined,
  }));

  const edges = nodes.slice(1).map((node, i) => ({
    from: nodes[i].id,
    to: node.id,
  }));

  return {
    nodes,
    edges,
    taskId,
    createdAt: new Date().toISOString(),
  };
}

export async function GET() {
  if (!latestDAG) {
    latestDAG = buildDemoDAG();
  }
  return NextResponse.json({ dag: latestDAG });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.dag) {
      latestDAG = body.dag;
      return NextResponse.json({ ok: true });
    }
  } catch {
    // Ignore parse errors
  }

  // Rebuild from demo
  latestDAG = buildDemoDAG();
  return NextResponse.json({ dag: latestDAG });
}
