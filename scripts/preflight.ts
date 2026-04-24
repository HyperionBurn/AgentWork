/**
 * AgentWork — Pre-flight Validation Script
 *
 * Runs before demo to catch build breaks, exposed secrets, missing env vars,
 * and agent health issues. FAIL-FAST on critical checks, WARN on advisory.
 *
 * Usage:
 *   npx tsx scripts/preflight.ts
 */

import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import * as http from "node:http";

// ============================================================
// Types
// ============================================================

interface CheckResult {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  message: string;
}

// ============================================================
// Constants
// ============================================================

const ENV_PATH = resolve(process.cwd(), ".env");
const AGENTS = [
  { name: "research-agent", port: 4021 },
  { name: "code-agent", port: 4022 },
  { name: "test-agent", port: 4023 },
  { name: "review-agent", port: 4024 },
] as const;

const CRITICAL_ENV_VARS = [
  "ORCHESTRATOR_PRIVATE_KEY",
  "SUPABASE_URL",
  "SELLER_WALLET",
];

// ============================================================
// 1. TypeScript Compilation Check
// ============================================================

function checkTypeScript(): Promise<CheckResult> {
  return new Promise((resolveCheck) => {
    const projects = [
      "packages/orchestrator/tsconfig.json",
      "packages/dashboard/tsconfig.json",
    ];

    let totalErrors = 0;
    let completed = 0;

    for (const project of projects) {
      const child = spawn(
        "npx",
        ["tsc", "--noEmit", "-p", project],
        {
          cwd: process.cwd(),
          shell: true,
          stdio: "pipe",
        }
      );

      let stderr = "";
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on("close", (code) => {
        if (code !== 0) {
          // Count error lines — "error TS" pattern
          const errorLines = stderr.split("\n").filter((l: string) => l.includes("error TS"));
          totalErrors += errorLines.length;
        }
        completed++;
        if (completed === projects.length) {
          if (totalErrors === 0) {
            resolveCheck({
              name: "TypeScript",
              status: "PASS",
              message: "0 errors",
            });
          } else {
            resolveCheck({
              name: "TypeScript",
              status: "FAIL",
              message: `${totalErrors} error(s) found`,
            });
          }
        }
      });

      child.on("error", () => {
        completed++;
        if (completed === projects.length) {
          resolveCheck({
            name: "TypeScript",
            status: "FAIL",
            message: "Failed to run tsc",
          });
        }
      });
    }
  });
}

// ============================================================
// 2. Secrets Exposure Check
// ============================================================

function checkSecrets(): CheckResult {
  if (!existsSync(ENV_PATH)) {
    return {
      name: "Secrets",
      status: "FAIL",
      message: ".env file not found",
    };
  }

  const envContent = readFileSync(ENV_PATH, "utf-8");
  const lines = envContent.split("\n");

  // Pattern: a line with 0x followed by exactly 64 hex chars that is NOT a placeholder
  const privateKeyPattern = /=0x[0-9a-fA-F]{64}\s*$/;
  const placeholderPattern = /_your_|_here_|placeholder|0x_+$|xxx/i;

  const exposedKeys: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (!line || line.startsWith("#")) continue;

    // Check for a private key value that isn't a placeholder
    if (privateKeyPattern.test(line) && !placeholderPattern.test(line)) {
      // Check if this line is for a variable that is SUPPOSED to have a private key
      const varName = line.split("=")[0]?.trim().toUpperCase();
      const expectedPrivateKeys = [
        "ORCHESTRATOR_PRIVATE_KEY",
        "AGENT_PRIVATE_KEY",
        "PRIVATE_KEY",
        "SELLER_PRIVATE_KEY",
      ];

      // Only flag if it's NOT in the expected list of private key variables
      if (!expectedPrivateKeys.some((k) => varName === k)) {
        exposedKeys.push(varName);
      }
    }
  }

  if (exposedKeys.length > 0) {
    return {
      name: "Secrets",
      status: "FAIL",
      message: `Potential exposed key(s) in: ${exposedKeys.join(", ")}`,
    };
  }

  return {
    name: "Secrets",
    status: "PASS",
    message: "no exposed keys",
  };
}

// ============================================================
// 3. Environment Variables Check
// ============================================================

function checkEnvVars(): CheckResult {
  if (!existsSync(ENV_PATH)) {
    return {
      name: "Env vars",
      status: "FAIL",
      message: ".env file not found",
    };
  }

  const envContent = readFileSync(ENV_PATH, "utf-8");
  const envVars = new Map<string, string>();

  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      envVars.set(key, value);
    }
  }

  let found = 0;
  const missing: string[] = [];

  for (const varName of CRITICAL_ENV_VARS) {
    const value = envVars.get(varName);
    if (value && value.length > 0 && !value.includes("_your_") && value !== "0x_") {
      found++;
    } else {
      missing.push(varName);
    }
  }

  if (found === CRITICAL_ENV_VARS.length) {
    return {
      name: "Env vars",
      status: "PASS",
      message: `${found}/${CRITICAL_ENV_VARS.length} critical`,
    };
  }

  return {
    name: "Env vars",
    status: "FAIL",
    message: `Missing: ${missing.join(", ")}`,
  };
}

// ============================================================
// 4. Agent Health Check
// ============================================================

function checkAgentHealth(agent: { name: string; port: number }): Promise<boolean> {
  return new Promise((resolveCheck) => {
    const req = http.get(
      `http://localhost:${agent.port}/health`,
      { timeout: 3000 },
      (res) => {
        resolveCheck(res.statusCode === 200);
        res.resume(); // Drain the response
      }
    );

    req.on("error", () => resolveCheck(false));
    req.on("timeout", () => {
      req.destroy();
      resolveCheck(false);
    });
  });
}

async function checkAllAgents(): Promise<CheckResult> {
  const results = await Promise.all(
    AGENTS.map(async (agent) => {
      const healthy = await checkAgentHealth(agent);
      return { ...agent, healthy };
    })
  );

  const online = results.filter((r) => r.healthy);
  const offline = results.filter((r) => !r.healthy);

  if (online.length === AGENTS.length) {
    return {
      name: "Agents",
      status: "PASS",
      message: `${online.length}/${AGENTS.length} online`,
    };
  }

  if (online.length === 0) {
    return {
      name: "Agents",
      status: "WARN",
      message: `0/${AGENTS.length} online (all offline)`,
    };
  }

  const offlineNames = offline.map((o) => o.name).join(", ");
  return {
    name: "Agents",
    status: "WARN",
    message: `${online.length}/${AGENTS.length} online (${offlineNames} offline)`,
  };
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  console.log("");
  console.log("🔍 AgentWork Pre-flight Check");

  // Run all checks in parallel where possible
  const [tsResult, secretsResult, envResult, agentsResult] = await Promise.all([
    checkTypeScript(),
    Promise.resolve(checkSecrets()),
    Promise.resolve(checkEnvVars()),
    checkAllAgents(),
  ]);

  const checks: CheckResult[] = [tsResult, secretsResult, envResult, agentsResult];

  // Print results
  for (const check of checks) {
    let icon: string;
    switch (check.status) {
      case "PASS":
        icon = "✅";
        break;
      case "FAIL":
        icon = "❌";
        break;
      case "WARN":
        icon = "⚠️";
        break;
    }
    console.log(`   ${check.name.padEnd(12)} ${icon} ${check.status} (${check.message})`);
  }

  // Determine overall status
  const hasFail = checks.some((c) => c.status === "FAIL");
  const hasWarn = checks.some((c) => c.status === "WARN");

  console.log("");
  if (hasFail) {
    console.log("   Overall: ❌ FIX ISSUES BEFORE DEMO");
    process.exit(1);
  } else if (hasWarn) {
    console.log("   Overall: ⚠️  READY WITH WARNINGS");
    process.exit(0);
  } else {
    console.log("   Overall: ✅ READY FOR DEMO");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
