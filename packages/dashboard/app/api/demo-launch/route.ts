import { NextRequest, NextResponse } from "next/server";
import { spawn, ChildProcess } from "node:child_process";
import { join } from "node:path";

// ============================================================
// One-Click Demo Launcher (M1: local-dev-only)
// ============================================================
// Spawns the orchestrator process and returns immediately.
// Progress flows through Supabase Realtime to the dashboard.
// Only works in local development — does NOT work in Docker
// (cannot spawn across containers).
// ============================================================

/** Singleton: only one orchestrator process at a time */
let activeProcess: ChildProcess | null = null;

/** Track last completion time to prevent rapid re-launches */
let lastCompletedAt = 0;

export async function POST(req: NextRequest) {
  // Prevent running in production
  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: "Demo launcher disabled in production" },
      { status: 403 },
    );
  }

  // Singleton guard — only one demo at a time
  if (activeProcess && activeProcess.exitCode === null) {
    return NextResponse.json(
      { error: "Demo already running", status: "running" },
      { status: 409 },
    );
  }

  // Rate limit: 5 seconds between launches
  if (Date.now() - lastCompletedAt < 5000) {
    return NextResponse.json(
      { error: "Please wait a moment before launching again" },
      { status: 429 },
    );
  }

  // Parse and validate input
  const body = await req.json().catch(() => ({}));
  const task = typeof body.task === "string" ? body.task : "";
  const runs = Math.min(Math.max(parseInt(String(body.runs || "15"), 10), 1), 50);
  const forceGroq = body.forceGroq === true;

  // Sanitize task input (M1: command injection prevention)
  if (task && !/^[\w\s.,!?()\-":;]+$/.test(task)) {
    return NextResponse.json(
      { error: "Invalid task input — only alphanumeric and basic punctuation allowed" },
      { status: 400 },
    );
  }

  // Resolve orchestrator path (relative to dashboard cwd)
  const orchestratorPath = join(process.cwd(), "..", "orchestrator");

  // Build environment for the child process
  const childEnv = {
    ...process.env,
    DEMO_RUNS: String(runs),
  } as NodeJS.ProcessEnv;
  if (task) {
    (childEnv as Record<string, string>).DEMO_TASK = task;
  }
  if (forceGroq) {
    (childEnv as Record<string, string>).FORCE_GROQ = "true";
  }

  const childProc = spawn("npx", ["tsx", "src/index.ts"], {
    cwd: orchestratorPath,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"] as const,
    shell: process.platform === 'win32',
  });

  activeProcess = childProc;

  const pid = childProc.pid;

  // Collect last few lines of output for debugging
  let outputBuffer = "";
  const MAX_BUFFER = 2000;

  childProc.stdout?.on("data", (data: Buffer) => {
    const chunk = data.toString();
    console.log(`[orchestrator-stdout] ${chunk}`);
    outputBuffer += chunk;
    if (outputBuffer.length > MAX_BUFFER) {
      outputBuffer = outputBuffer.slice(-MAX_BUFFER);
    }
  });

  childProc.stderr?.on("data", (data: Buffer) => {
    const chunk = data.toString();
    console.error(`[orchestrator-stderr] ${chunk}`);
    outputBuffer += chunk;
    if (outputBuffer.length > MAX_BUFFER) {
      outputBuffer = outputBuffer.slice(-MAX_BUFFER);
    }
  });

  // Cleanup on process exit
  const onExit = () => {
    lastCompletedAt = Date.now();
    if (activeProcess === childProc) {
      activeProcess = null;
    }
  };

  childProc.on("exit", onExit);
  childProc.on("error", onExit);

  // Cleanup on client disconnect (AbortSignal)
  const onAbort = () => {
    if (activeProcess === childProc && childProc.exitCode === null) {
      if (process.platform === "win32") {
        spawn("taskkill", ["/F", "/T", "/PID", String(childProc.pid)]);
      } else {
        childProc.kill("SIGTERM");
      }
      activeProcess = null;
    }
  };

  req.signal.addEventListener("abort", onAbort);

  // Return immediately — the orchestrator writes to Supabase,
  // and the dashboard reads updates via Supabase Realtime
  return NextResponse.json({
    status: "started",
    pid,
    runs,
    task: task || childEnv.DEMO_TASK || "default",
    message: `Orchestrator started with ${runs} run(s). Watch the Task Feed for live updates.`,
  });
}

/** GET: check current demo status */
export async function GET() {
  const isRunning = activeProcess !== null && activeProcess.exitCode === null;
  return NextResponse.json({
    status: isRunning ? "running" : "idle",
    pid: isRunning ? activeProcess?.pid : null,
  });
}
