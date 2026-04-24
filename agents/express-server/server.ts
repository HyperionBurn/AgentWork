/**
 * AgentWork — Express Agent Server
 *
 * Hosts all 4 specialist agents on a single Express server using the official
 * @circle-fin/x402-batching createGatewayMiddleware for REAL x402 payment
 * verification and settlement through Circle Gateway.
 *
 * Each agent is isolated at its own route prefix:
 *   /research  → Research Agent  (port delegated from RESEARCH_AGENT_PORT)
 *   /code      → Code Agent
 *   /test      → Test Agent
 *   /review    → Review Agent
 *
 * The server ALSO keeps the original per-port compatibility by running
 * sub-servers on the Python agent ports so orchestrator config stays unchanged.
 */

import express, { Request, Response, NextFunction } from "express";
import { createGatewayMiddleware } from "@circle-fin/x402-batching/server";
import { config as loadDotenv } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from repo root (two levels up from agents/express-server/)
loadDotenv({ path: resolve(__dirname, "..", "..", ".env") });

// ============================================================
// Configuration
// ============================================================

const SELLER_WALLET = process.env.SELLER_WALLET || "";
const RESEARCH_PORT = parseInt(process.env.RESEARCH_AGENT_PORT || "4021");
const CODE_PORT     = parseInt(process.env.CODE_AGENT_PORT     || "4022");
const TEST_PORT     = parseInt(process.env.TEST_AGENT_PORT     || "4023");
const REVIEW_PORT   = parseInt(process.env.REVIEW_AGENT_PORT   || "4024");

const RESEARCH_PRICE = normalizePrice(process.env.RESEARCH_AGENT_PRICE || "$0.005");
const CODE_PRICE     = normalizePrice(process.env.CODE_AGENT_PRICE     || "$0.005");
const TEST_PRICE     = normalizePrice(process.env.TEST_AGENT_PRICE     || "$0.005");
const REVIEW_PRICE   = normalizePrice(process.env.REVIEW_AGENT_PRICE   || "$0.005");

function normalizePrice(p: string): string {
  return p.startsWith("$") ? p : `$${p}`;
}

if (!SELLER_WALLET) {
  console.error("❌ SELLER_WALLET not set — all agents will reject payments");
  process.exit(1);
}

// ============================================================
// Gateway Middleware (one per agent → each has its own payTo address)
// ============================================================
// NOTE: Each agent in the original design has its own wallet address.
// We use the agent-specific wallet addresses from env vars so that payments
// go to the correct seller wallet per agent type.

function makeGateway(agentWallet: string) {
  const addr = agentWallet || SELLER_WALLET;
  return createGatewayMiddleware({
    sellerAddress: addr,
    networks: ["eip155:5042002"], // Arc Testnet only
  });
}

const researchGateway = makeGateway(process.env.RESEARCH_AGENT_WALLET || SELLER_WALLET);
const codeGateway     = makeGateway(process.env.CODE_AGENT_WALLET     || SELLER_WALLET);
const testGateway     = makeGateway(process.env.TEST_AGENT_WALLET     || SELLER_WALLET);
const reviewGateway   = makeGateway(process.env.REVIEW_AGENT_WALLET   || SELLER_WALLET);

// ============================================================
// CORS helper
// ============================================================

function corsMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers",
    "Content-Type, Payment-Signature, X-Payment-Version, payment-signature");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
}

// ============================================================
// LLM Configuration & Client
// ============================================================

const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY || "";
const FEATHERLESS_BASE_URL = process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1";
const FEATHERLESS_MODEL = process.env.FEATHERLESS_MODEL || "google/gemma-4-31B-it";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const USE_REAL_LLM = process.env.USE_REAL_LLM === "true";

async function callLLM(
  prompt: string,
  systemInstruction: string,
): Promise<{ text: string }> {
  // 1st tier: Featherless
  if (FEATHERLESS_API_KEY) {
    try {
      console.log(`   🪶 Agent LLM: Attempting Featherless (${FEATHERLESS_MODEL})...`);
      const result = await _callFeatherless(prompt, systemInstruction);
      if (result && result.text) return result;
    } catch (err: any) {
      console.warn(`   ⚠️ Agent LLM: Featherless failed: ${err.message}`);
    }
  }

  // 2nd tier: Gemini with 8s timeout
  if (GEMINI_API_KEY) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      console.log(`   🧠 Agent LLM: Attempting Gemini (${GEMINI_MODEL})...`);
      const result = await _callGemini(prompt, systemInstruction, controller.signal);
      clearTimeout(timeoutId);
      if (result && result.text) return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`   ⚠️ Agent LLM: Gemini failed: ${err.message}`);
    }
  }

  return { text: "" };
}

async function _callGemini(prompt: string, systemInstruction: string, signal?: AbortSignal) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { 
      temperature: 0.7, 
      maxOutputTokens: 1024,
      response_mime_type: "application/json"
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) return { text: "" };

  const data = await response.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { text };
}

async function _callFeatherless(prompt: string, systemInstruction: string) {
  const url = `${FEATHERLESS_BASE_URL}/chat/completions`;
  const body = {
    model: FEATHERLESS_MODEL,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1024,
    response_format: { type: "json_object" }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${FEATHERLESS_API_KEY}` 
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) return { text: "" };
  const data = await response.json() as any;
  return { text: data.choices?.[0]?.message?.content || "" };
}

// ============================================================
// Agent Logic (REAL LLM-Powered)
// ============================================================

async function performResearch(topic: string, context?: string) {
  if (!USE_REAL_LLM) {
    return {
      summary: `[MOCK] Comprehensive research analysis on '${topic}'`,
      key_findings: [`Pattern identified in ${topic}: convergence`, `Best practice: event-driven`],
      sources: [{ title: `Primary Analysis: ${topic}`, relevance: 0.95 }],
      confidence: 0.91,
    };
  }

  const system = `You are the Research_Alpha specialist agent. Analyze the provided topic and return a JSON object.
Structure: { "summary": string, "key_findings": string[], "sources": { "title": string, "relevance": number }[], "confidence": number }
IMPORTANT: Always provide a substantive analysis with at least 3 key findings relevant to the topic.`;
  const prompt = `Topic: ${topic}\nContext: ${context || "Standalone research task"}\n\nPerform deep research.`;
  
  const result = await callLLM(prompt, system);
  try {
    return JSON.parse(result.text.match(/\{[\s\S]*\}/)?.[0] || "{}");
  } catch {
    return { summary: result.text, key_findings: [], sources: [], confidence: 0.5 };
  }
}

async function performCodeGeneration(task: string, context?: string) {
  if (!USE_REAL_LLM) {
    return {
      code: `# [MOCK] implementation for: ${task}\ndef hello(): pass`,
      language: "python",
      files_modified: ["src/main.py"],
      summary: `Generated implementation for: ${task}`,
    };
  }

  const system = `You are the Code_Weaver specialist agent. Implement the requested task and return a JSON object.
Structure: { "code": string, "language": string, "files_modified": string[], "summary": string }
IMPORTANT: Always generate working code that directly addresses the task.`;
  const prompt = `Task: ${task}\nResearch Context: ${context || "No prior research — implement based on task description"}\n\nWrite high-quality code.`;
  
  const result = await callLLM(prompt, system);
  try {
    return JSON.parse(result.text.match(/\{[\s\S]*\}/)?.[0] || "{}");
  } catch {
    return { code: result.text, language: "text", files_modified: [], summary: "Failed to parse code" };
  }
}

async function performTesting(task: string, context?: string) {
  if (!USE_REAL_LLM) {
    return {
      tests_generated: 2,
      passing: 2,
      failing: 0,
      coverage: 0.8,
      test_suite: "test_main.py PASSED",
    };
  }

  const system = `You are the QA_Sentinel specialist agent. Generate tests for the code and return a JSON object.
Structure: { "tests_generated": number, "passing": number, "failing": number, "coverage": number, "test_suite": string }
IMPORTANT: Even without implementation context, generate relevant test cases based on the task description. Never return empty results.`;
  const prompt = `Task: ${task}\nImplementation Context: ${context || "No specific implementation provided — generate tests based on the task description."}\n\nGenerate and run tests.`;
  
  const result = await callLLM(prompt, system);
  try {
    return JSON.parse(result.text.match(/\{[\s\S]*\}/)?.[0] || "{}");
  } catch {
    return { tests_generated: 0, passing: 0, failing: 0, coverage: 0, test_suite: result.text };
  }
}

async function performReview(task: string, context?: string) {
  if (!USE_REAL_LLM) {
    return {
      quality_score: 85,
      issues: ["Minor nitpick"],
      approved: true,
      suggestions: ["Add logs"],
      summary: `Review completed for: ${task}`,
    };
  }

  const system = `You are the Quality Review specialist agent. Evaluate the implementation and return a JSON object.
Structure: { "quality_score": number, "issues": string[], "approved": boolean, "suggestions": string[], "summary": string }
IMPORTANT: Always provide a substantive review with specific feedback.`;
  const prompt = `Task: ${task}\nFull Context: ${context || "No prior context — review based on task description"}\n\nPerform final quality review.`;
  
  const result = await callLLM(prompt, system);
  try {
    return JSON.parse(result.text.match(/\{[\s\S]*\}/)?.[0] || "{}");
  } catch {
    return { quality_score: 50, issues: [], approved: false, suggestions: [], summary: result.text };
  }
}

// ============================================================
// Build individual Express apps per agent port
// (keeps orchestrator config unchanged — agents still on ports 4021-4024)
// ============================================================

async function buildAgentApp(
  agentType: string,
  agentName: string,
  apiPath: string,
  price: string,
  gateway: ReturnType<typeof createGatewayMiddleware>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agentLogic: (input: string, context?: string) => Promise<Record<string, any>>,
): Promise<express.Express> {
  const app = express();
  app.use(corsMiddleware);

  // Logging middleware
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${agentName} received: ${req.method} ${req.url}`);
    next();
  });

  // OPTIONS preflight
  app.options("*", (_req, res) => {
    res.status(200).end();
  });

  // Free metadata endpoint (ERC-8004 style)
  app.get("/", (_req, res) => {
    res.json({
      name: agentName,
      type: agentType,
      version: "1.0.0",
      gateway_mode: "real",
      pricing: { [apiPath]: price },
      chain: "arcTestnet",
    });
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({
      status: "healthy",
      agent: agentType,
      gateway_ready: true,
      mode: "express-real-payments",
    });
  });

  // Paywalled endpoint
  app.get(
    apiPath,
    gateway.require(price) as express.RequestHandler,
    async (req: Request, res: Response) => {
      const input   = (req.query["input"] as string)
                   || (req.query["topic"] as string)
                   || (req.query["task"] as string)
                   || "general";
      const context = req.query["context"] as string | undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reqWithPayment = req as any;
      const payer = reqWithPayment.payment?.payer ?? "unknown";

      const result = await agentLogic(input, context);

      const response: Record<string, unknown> = {
        success: true,
        agent: agentName,
        paid_by: payer,
        amount: price,
        result,
      };
      if (context) response["context"] = { prior_summary: context };

      res.json(response);
    }
  );

  // Special /api/chain endpoint for research agent (recursive A2A payments)
  if (agentType === "research") {
    app.get(
      "/api/chain",
      gateway.require(price) as express.RequestHandler,
      async (req: Request, res: Response) => {
        const input = (req.query["input"] as string) || "general";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reqWithPayment = req as any;
        const payer = reqWithPayment.payment?.payer ?? "unknown";

        const result = await agentLogic(input, "recursive-a2a");

        const response: Record<string, unknown> = {
          success: true,
          agent: agentName,
          paid_by: payer,
          amount: price,
          result,
          context: { mode: "recursive-a2a" },
        };

        res.json(response);
      }
    );
  }

  return app;
}

// ============================================================
// Instantiate and start each agent server
// ============================================================

// ============================================================
// Instantiate and start each agent server
// ============================================================

async function startAllAgents() {
  const researchApp = await buildAgentApp(
    "research", "Research Agent", "/api/research", RESEARCH_PRICE,
    researchGateway, performResearch
  );

  const codeApp = await buildAgentApp(
    "code", "Code Agent", "/api/generate", CODE_PRICE,
    codeGateway, performCodeGeneration
  );

  const testApp = await buildAgentApp(
    "test", "Test Agent", "/api/test", TEST_PRICE,
    testGateway, performTesting
  );

  const reviewApp = await buildAgentApp(
    "review", "Review Agent", "/api/review", REVIEW_PRICE,
    reviewGateway, performReview
  );

  researchApp.listen(RESEARCH_PORT, () => {
    console.log(`🔬 Research Agent  → http://localhost:${RESEARCH_PORT}  [${RESEARCH_PRICE}/call] REAL x402`);
  });

  codeApp.listen(CODE_PORT, () => {
    console.log(`💻 Code Agent      → http://localhost:${CODE_PORT}  [${CODE_PRICE}/call] REAL x402`);
  });

  testApp.listen(TEST_PORT, () => {
    console.log(`🧪 Test Agent      → http://localhost:${TEST_PORT}  [${TEST_PRICE}/call] REAL x402`);
  });

  reviewApp.listen(REVIEW_PORT, () => {
    console.log(`📋 Review Agent    → http://localhost:${REVIEW_PORT}  [${REVIEW_PRICE}/call] REAL x402`);
  });

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║         AgentWork Express Gateway — REAL x402            ║");
  console.log("║   Using @circle-fin/x402-batching createGatewayMiddleware ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
}

startAllAgents().catch(err => {
  console.error("❌ Failed to start agents:", err);
  process.exit(1);
});
