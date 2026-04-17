/**
 * AgentWork — Environment Validation Script
 *
 * Validates all required environment variables before running the demo.
 * Tiered validation: critical (exit 1) → optional (warn) → advisory (info)
 *
 * Usage:
 *   npx tsx scripts/validate-env.ts
 *   npm run validate-env
 *   npm run validate-env -- --schema-only  (CI mode: checks .env.example only)
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================
// Types
// ============================================================

interface VarCheck {
  name: string;
  tier: "critical" | "optional" | "advisory";
  description: string;
  validate: (value: string | undefined) => { valid: boolean; message: string };
}

interface ValidationResult {
  passed: number;
  failed: number;
  warned: number;
  info: number;
}

// ============================================================
// Validation Functions
// ============================================================

function exists(value: string | undefined): boolean {
  return typeof value === "string" && value.length > 0;
}

function isHexAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

function isHexPrivateKey(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

function isPlaceholder(value: string): boolean {
  return value.includes("_your_") || value === "0x_" || /^0x_$/.test(value);
}

function startsWith(prefix: string) {
  return (value: string | undefined): boolean =>
    typeof value === "string" && value.startsWith(prefix);
}

// ============================================================
// Variable Definitions (per Architect M2 + Critic C2)
// ============================================================

const VAR_CHECKS: VarCheck[] = [
  // --- Critical: Orchestrator ---
  {
    name: "ORCHESTRATOR_PRIVATE_KEY",
    tier: "critical",
    description: "Orchestrator wallet private key",
    validate: (v) => {
      if (!exists(v)) return { valid: false, message: "Missing" };
      if (isPlaceholder(v!)) return { valid: false, message: "Still placeholder" };
      if (!isHexPrivateKey(v!)) return { valid: false, message: "Must be 0x + 64 hex chars" };
      return { valid: true, message: "OK" };
    },
  },

  // --- Critical: Wallets ---
  {
    name: "SELLER_WALLET",
    tier: "critical",
    description: "Dashboard receiving wallet",
    validate: (v) => {
      if (!exists(v)) return { valid: false, message: "Missing" };
      if (isPlaceholder(v!)) return { valid: false, message: "Still placeholder" };
      if (!isHexAddress(v!)) return { valid: false, message: "Must be 0x + 40 hex chars" };
      return { valid: true, message: "OK" };
    },
  },

  // --- Critical: Arc Blockchain ---
  {
    name: "ARC_RPC_URL",
    tier: "critical",
    description: "Arc RPC endpoint",
    validate: (v) => {
      if (!exists(v)) return { valid: false, message: "Missing" };
      if (!startsWith("https://")(v)) return { valid: false, message: "Must start with https://" };
      return { valid: true, message: "OK" };
    },
  },
  {
    name: "ARC_USDC_ADDRESS",
    tier: "critical",
    description: "USDC contract address",
    validate: (v) => {
      if (!exists(v)) return { valid: false, message: "Missing" };
      if (!isHexAddress(v!)) return { valid: false, message: "Must be 0x + 40 hex chars" };
      return { valid: true, message: "OK" };
    },
  },
  {
    name: "ARC_GATEWAY_ADDRESS",
    tier: "critical",
    description: "Circle Gateway address",
    validate: (v) => {
      if (!exists(v)) return { valid: false, message: "Missing" };
      if (!isHexAddress(v!)) return { valid: false, message: "Must be 0x + 40 hex chars" };
      return { valid: true, message: "OK" };
    },
  },
  {
    name: "ARC_EXPLORER",
    tier: "critical",
    description: "Arc explorer base URL",
    validate: (v) => {
      if (!exists(v)) return { valid: false, message: "Missing" };
      if (!startsWith("https://")(v)) return { valid: false, message: "Must start with https://" };
      return { valid: true, message: "OK" };
    },
  },

  // --- Critical: Agent URLs (M1: all 4) ---
  ...(["RESEARCH", "CODE", "TEST", "REVIEW"] as const).map((agent) => ({
    name: `${agent}_AGENT_URL` as string,
    tier: "critical" as const,
    description: `${agent.charAt(0) + agent.slice(1).toLowerCase()} agent URL`,
    validate: (v: string | undefined) => {
      if (!exists(v)) return { valid: false, message: "Missing" };
      if (!startsWith("http")(v)) return { valid: false, message: "Must start with http://" };
      return { valid: true, message: "OK" };
    },
  })),

  // --- Critical: Agent Pricing ---
  ...(["RESEARCH", "CODE", "TEST", "REVIEW"] as const).map((agent) => ({
    name: `${agent}_AGENT_PRICE` as string,
    tier: "critical" as const,
    description: `${agent.charAt(0) + agent.slice(1).toLowerCase()} agent price`,
    validate: (v: string | undefined) => {
      if (!exists(v)) return { valid: false, message: "Missing" };
      if (!startsWith("$")(v)) return { valid: false, message: "Must start with $ (e.g. $0.005)" };
      return { valid: true, message: "OK" };
    },
  })),

  // --- Critical: Supabase (Dashboard) ---
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    tier: "critical",
    description: "Supabase project URL (dashboard)",
    validate: (v) => {
      if (!exists(v)) return { valid: false, message: "Missing" };
      if (!startsWith("https://")(v)) return { valid: false, message: "Must start with https://" };
      return { valid: true, message: "OK" };
    },
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    tier: "critical",
    description: "Supabase anon key (dashboard)",
    validate: (v) => {
      if (!exists(v)) return { valid: false, message: "Missing" };
      if (v!.length < 20) return { valid: false, message: "Too short — check your key" };
      return { valid: true, message: "OK" };
    },
  },

  // --- Optional: Supabase (Orchestrator) ---
  {
    name: "SUPABASE_URL",
    tier: "optional",
    description: "Supabase project URL (orchestrator)",
    validate: (v) => {
      if (!exists(v)) return { valid: false, message: "Missing — orchestrator won't record events" };
      if (!startsWith("https://")(v)) return { valid: false, message: "Must start with https://" };
      return { valid: true, message: "OK" };
    },
  },
  {
    name: "SUPABASE_ANON_KEY",
    tier: "optional",
    description: "Supabase anon key (orchestrator)",
    validate: (v) => {
      if (!exists(v)) return { valid: false, message: "Missing — orchestrator won't record events" };
      if (v!.length < 20) return { valid: false, message: "Too short — check your key" };
      return { valid: true, message: "OK" };
    },
  },

  // --- Optional: Agent Wallets (used by Python agents for SELLER_ADDRESS) ---
  ...(["RESEARCH", "CODE", "TEST", "REVIEW"] as const).map((agent) => ({
    name: `${agent}_AGENT_WALLET` as string,
    tier: "optional" as const,
    description: `${agent.charAt(0) + agent.slice(1).toLowerCase()} agent wallet`,
    validate: (v: string | undefined) => {
      if (!exists(v)) return { valid: false, message: "Missing — agent will use SELLER_WALLET" };
      if (isPlaceholder(v!)) return { valid: false, message: "Still placeholder" };
      return { valid: true, message: "OK" };
    },
  })),

  // --- Optional: Contract Addresses ---
  ...(["IDENTITY_REGISTRY", "REPUTATION_REGISTRY", "AGENT_ESCROW", "PAYMENT_SPLITTER", "SPENDING_LIMITER"] as const).map((contract) => ({
    name: `${contract}_ADDRESS` as string,
    tier: "optional" as const,
    description: `${contract.replace(/_/g, " ")} contract`,
    validate: (v: string | undefined) => {
      if (!exists(v)) return { valid: false, message: "Not set — smart contract interactions disabled" };
      if (v === "0x_" || isPlaceholder(v!)) return { valid: false, message: "Placeholder — not deployed yet" };
      return { valid: true, message: "OK" };
    },
  })),

  // --- Advisory: Chain ID & Faucet (M3) ---
  {
    name: "ARC_CHAIN_ID",
    tier: "advisory",
    description: "Arc chain ID",
    validate: (v) => {
      if (!exists(v)) return { valid: true, message: "Not set (default: 5042002)" };
      if (v !== "5042002") return { valid: false, message: `Expected 5042002, got ${v}` };
      return { valid: true, message: "OK" };
    },
  },
  {
    name: "ARC_FAUCET",
    tier: "advisory",
    description: "Faucet URL",
    validate: (v) => {
      if (!exists(v)) return { valid: true, message: "Not set (default: https://faucet.circle.com)" };
      return { valid: true, message: "OK" };
    },
  },

  // --- Advisory: Ports (C2) ---
  ...(["RESEARCH", "CODE", "TEST", "REVIEW"] as const).map((agent, i) => ({
    name: `${agent}_AGENT_PORT` as string,
    tier: "advisory" as const,
    description: `${agent.charAt(0) + agent.slice(1).toLowerCase()} agent port`,
    validate: (v: string | undefined) => {
      const defaultPort = String(4021 + i);
      if (!exists(v)) return { valid: true, message: `Not set (default: ${defaultPort})` };
      if (!/^\d+$/.test(v!)) return { valid: false, message: "Must be numeric" };
      return { valid: true, message: "OK" };
    },
  })),
  {
    name: "ORCHESTRATOR_PORT",
    tier: "advisory",
    description: "Orchestrator port",
    validate: (v) => {
      if (!exists(v)) return { valid: true, message: "Not set (default: 4030)" };
      return { valid: true, message: "OK" };
    },
  },
  {
    name: "DASHBOARD_PORT",
    tier: "advisory",
    description: "Dashboard port",
    validate: (v) => {
      if (!exists(v)) return { valid: true, message: "Not set (default: 3000)" };
      return { valid: true, message: "OK" };
    },
  },

  // --- Advisory: Demo Config (C2) ---
  {
    name: "DEMO_TASK",
    tier: "advisory",
    description: "Demo task description",
    validate: (v) => {
      if (!exists(v)) return { valid: true, message: "Not set (default task will be used)" };
      return { valid: true, message: "OK" };
    },
  },
  {
    name: "DEMO_RUNS",
    tier: "advisory",
    description: "Number of orchestrator iterations",
    validate: (v) => {
      if (!exists(v)) return { valid: true, message: "Not set (default: 1)" };
      if (!/^\d+$/.test(v!)) return { valid: false, message: "Must be numeric" };
      return { valid: true, message: "OK" };
    },
  },
];

// ============================================================
// Main Validation Logic
// ============================================================

function loadEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  const content = fs.readFileSync(filePath, "utf-8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed.length === 0) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

function runValidation(env: Record<string, string>, schemaOnly: boolean): ValidationResult {
  const result: ValidationResult = { passed: 0, failed: 0, warned: 0, info: 0 };

  console.log("");
  console.log("═".repeat(60));
  console.log("  AgentWork — Environment Validation");
  console.log(schemaOnly ? "  Mode: Schema-only (CI)" : "  Mode: Full validation");
  console.log("═".repeat(60));
  console.log("");

  let criticalFailed = false;

  for (const check of VAR_CHECKS) {
    const value = env[check.name];

    // In schema-only mode, only check that vars exist, not format
    if (schemaOnly && check.tier === "critical") {
      if (!exists(value)) {
        console.log(`  ❌ ${check.name}: Missing from env`);
        result.failed++;
        criticalFailed = true;
      } else {
        console.log(`  ✅ ${check.name}: Present`);
        result.passed++;
      }
      continue;
    }

    const validation = check.validate(value);

    switch (check.tier) {
      case "critical":
        if (validation.valid) {
          console.log(`  ✅ ${check.name}: ${validation.message}`);
          result.passed++;
        } else {
          console.log(`  ❌ ${check.name}: ${validation.message}`);
          result.failed++;
          criticalFailed = true;
        }
        break;

      case "optional":
        if (validation.valid) {
          console.log(`  ✅ ${check.name}: ${validation.message}`);
          result.passed++;
        } else {
          console.log(`  ⚠️  ${check.name}: ${validation.message}`);
          result.warned++;
        }
        break;

      case "advisory":
        if (validation.valid) {
          console.log(`  ℹ️  ${check.name}: ${validation.message}`);
          result.info++;
        } else {
          console.log(`  ℹ️  ${check.name}: ${validation.message}`);
          result.info++;
        }
        break;
    }
  }

  // Summary
  console.log("");
  console.log("─".repeat(60));
  console.log(`  ✅ Passed: ${result.passed}  ❌ Failed: ${result.failed}  ⚠️ Warnings: ${result.warned}  ℹ️ Info: ${result.info}`);
  console.log("─".repeat(60));

  if (criticalFailed) {
    console.log("");
    console.log("  ❌ CRITICAL: Fix the errors above before running the demo.");
    console.log("     Run: cp .env.example .env  (then fill in your values)");
    console.log("");
    process.exit(1);
  }

  console.log("");
  if (result.warned > 0) {
    console.log("  ⚠️  Warnings detected — demo will run in degraded mode.");
  }
  console.log("  ✅ Environment is ready for demo!");
  console.log("");

  return result;
}

// ============================================================
// Entry Point
// ============================================================

const schemaOnly = process.argv.includes("--schema-only");
const envPath = path.resolve(process.cwd(), ".env");

// C4: Handle missing .env file
if (!schemaOnly && !fs.existsSync(envPath)) {
  console.error("");
  console.error("  ❌ .env file not found.");
  console.error("     Run: cp .env.example .env");
  console.error("     Then fill in your wallet keys and Supabase credentials.");
  console.error("");
  process.exit(1);
}

// Load env vars
let env: Record<string, string>;

if (schemaOnly) {
  // Schema-only mode: validate against .env.example
  const examplePath = path.resolve(process.cwd(), ".env.example");
  if (!fs.existsSync(examplePath)) {
    console.error("  ❌ .env.example not found");
    process.exit(1);
  }
  env = loadEnvFile(examplePath);
} else {
  env = loadEnvFile(envPath);
}

runValidation(env, schemaOnly);
