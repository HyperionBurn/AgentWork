/**
 * AgentWork — Smoke Test Script
 *
 * Verifies the full stack is operational post-launch.
 * Dual-mode: reads *_AGENT_URL from env for Docker or local.
 *
 * Usage:
 *   npx tsx scripts/smoke-test.ts
 *   npm run smoke-test
 *
 * Checks:
 *   1. Agent health endpoints (:4021-:4024/health)
 *   2. Dashboard responds on port 3000
 *   3. Agent 402 payment challenge responses
 *   4. Supabase reachability (if configured)
 */

import * as http from "http";

// ============================================================
// Config
// ============================================================

const AGENTS = ["RESEARCH", "CODE", "TEST", "REVIEW"] as const;
const TIMEOUT_MS = 10_000;

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

// ============================================================
// HTTP Helper
// ============================================================

function fetchWithTimeout(url: string, timeoutMs: number): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      req.destroy();
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    const req = http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk: Buffer) => (body += chunk.toString()));
      res.on("end", () => {
        clearTimeout(timer);
        resolve({ status: res.statusCode || 0, body });
      });
    });

    req.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// ============================================================
// Load env from .env if present
// ============================================================

function loadEnv(): Record<string, string> {
  const fs = require("fs");
  const path = require("path");
  const envPath = path.resolve(process.cwd(), ".env");
  const env: Record<string, string> = {};

  if (!fs.existsSync(envPath)) return env;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed.length === 0) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }

  return env;
}

// ============================================================
// Checks
// ============================================================

async function checkAgentHealth(env: Record<string, string>): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  for (const agent of AGENTS) {
    const url = env[`${agent}_AGENT_URL`] || `http://localhost:${4021 + AGENTS.indexOf(agent)}`;
    const healthUrl = `${url}/health`;
    const name = `${agent.charAt(0) + agent.slice(1).toLowerCase()} Agent`;

    try {
      const res = await fetchWithTimeout(healthUrl, TIMEOUT_MS);
      if (res.status === 200) {
        results.push({ name, passed: true, message: `${healthUrl} → 200 OK` });
      } else {
        results.push({ name, passed: false, message: `${healthUrl} → ${res.status}` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ name, passed: false, message: `${healthUrl} → ${msg}` });
    }
  }

  return results;
}

async function checkDashboard(env: Record<string, string>): Promise<CheckResult> {
  const port = env.DASHBOARD_PORT || "3000";
  const url = `http://localhost:${port}`;

  try {
    const res = await fetchWithTimeout(url, TIMEOUT_MS);
    if (res.status === 200 || res.status === 301 || res.status === 302) {
      return { name: "Dashboard", passed: true, message: `${url} → ${res.status}` };
    }
    return { name: "Dashboard", passed: false, message: `${url} → ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name: "Dashboard", passed: false, message: `${url} → ${msg}` };
  }
}

async function checkAgent402(env: Record<string, string>): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const agentPaths = {
    RESEARCH: "/api/research",
    CODE: "/api/generate",
    TEST: "/api/test",
    REVIEW: "/api/review",
  };

  for (const agent of AGENTS) {
    const url = env[`${agent}_AGENT_URL`] || `http://localhost:${4021 + AGENTS.indexOf(agent)}`;
    const fullPath = `${url}${agentPaths[agent]}`;
    const name = `${agent.charAt(0) + agent.slice(1).toLowerCase()} 402`;

    try {
      const res = await fetchWithTimeout(fullPath, TIMEOUT_MS);
      if (res.status === 402) {
        results.push({ name, passed: true, message: `${fullPath} → 402 Payment Required ✓` });
      } else {
        results.push({ name, passed: false, message: `${fullPath} → ${res.status} (expected 402)` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ name, passed: false, message: `${fullPath} → ${msg}` });
    }
  }

  return results;
}

async function checkSupabase(env: Record<string, string>): Promise<CheckResult> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return { name: "Supabase", passed: false, message: "NEXT_PUBLIC_SUPABASE_URL not set — skipping" };
  }

  try {
    const https = require("https");
    const res = await new Promise<{ status: number }>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS);
      https.get(`${url}/rest/v1/`, { headers: { apikey: "check" } }, (res: any) => {
        clearTimeout(timer);
        resolve({ status: res.statusCode || 0 });
      }).on("error", (err: Error) => {
        clearTimeout(timer);
        reject(err);
      });
    });
    // Any response means Supabase is reachable (even 401 = good, it's just unauthorized)
    return { name: "Supabase", passed: true, message: `${url} → reachable (status ${res.status})` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name: "Supabase", passed: false, message: `${url} → ${msg}` };
  }
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  console.log("");
  console.log("═".repeat(60));
  console.log("  AgentWork — Smoke Test");
  console.log("═".repeat(60));
  console.log("");

  const env = loadEnv();
  const allResults: CheckResult[] = [];

  // Run all checks
  console.log("Checking agent health...");
  const healthResults = await checkAgentHealth(env);
  allResults.push(...healthResults);

  console.log("Checking dashboard...");
  allResults.push(await checkDashboard(env));

  console.log("Checking agent 402 responses...");
  allResults.push(...(await checkAgent402(env)));

  console.log("Checking Supabase...");
  allResults.push(await checkSupabase(env));

  // Print results
  console.log("");
  console.log("─".repeat(60));
  for (const result of allResults) {
    const icon = result.passed ? "✅" : "❌";
    console.log(`  ${icon} ${result.name}: ${result.message}`);
  }
  console.log("─".repeat(60));

  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;
  console.log(`  ✅ Passed: ${passed}  ❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("");
    console.log("  ❌ Some services are not responding. Check:");
    console.log("     - Are agents running? (python agents/*/server.py)");
    console.log("     - Is dashboard running? (npm run dev:dashboard)");
    console.log("     - Is Supabase configured? (check .env)");
    console.log("");
    process.exit(1);
  }

  console.log("");
  console.log("  ✅ All services operational!");
  console.log("");
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
