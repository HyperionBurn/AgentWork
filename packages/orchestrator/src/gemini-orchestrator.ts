// ============================================================
// Gemini Function Calling — Orchestrator AI Decision Engine
// ============================================================
// Uses Gemini 2 Flash or OpenAI/Groq to make autonomous decisions.
//
// The orchestrator is the BUYER — it owns GatewayClient and
// executes all financial actions. Gemini provides intelligence
// about WHICH actions to take, but doesn't execute them.
// ============================================================

import { recordTaskEvent } from "./economy/supabase-module";

// ── Types ────────────────────────────────────────────────────

export interface GeminiToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface GeminiDecision {
  agentType: string;
  createEscrow: boolean;
  suggestedPrice: string | null;
  reasoning: string;
  confidence: number;
  toolCalls: GeminiToolCall[];
}

export interface ReputationDecision {
  score: number;
  feedback: string;
  reasoning: string;
}

export interface TaskRoutingDecision {
  agentSequence: string[];
  reasoning: string;
  parallel: boolean;
  estimatedCost: string;
}

// ── Configuration ───────────────────────────────────────────

const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY || "";
const FEATHERLESS_BASE_URL = process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1";
const FEATHERLESS_MODEL = process.env.FEATHERLESS_MODEL || "google/gemma-4-31B-it";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_ENABLED = process.env.USE_GEMINI_ORCHESTRATOR === "true";

// ── LLM Client ───────────────────────────────────────────────

async function callLLM(
  prompt: string,
  systemInstruction: string,
): Promise<{
  text: string;
  toolCalls: GeminiToolCall[];
}> {
  // 1st tier: Featherless
  if (FEATHERLESS_API_KEY) {
    try {
      console.log(`   🪶 Attempting Featherless (${FEATHERLESS_MODEL})...`);
      const result = await _callFeatherless(prompt, systemInstruction);
      if (result && result.text) return result;
      console.warn(`   ⚠️ Featherless failed, falling back...`);
    } catch (err: any) {
      console.warn(`   ⚠️ Featherless failed: ${err.message}`);
    }
  }

  // 2nd tier: Gemini with 5s timeout
  if (GEMINI_API_KEY) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      console.log(`   🧠 Attempting Gemini (${GEMINI_MODEL})...`);
      const result = await _callGemini(prompt, systemInstruction, controller.signal);
      clearTimeout(timeoutId);
      if (result && result.text) return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError';
      console.warn(`   ⚠️ Gemini ${isTimeout ? 'timed out (5s)' : 'failed'}: ${err.message}`);
    }
  }

  return { text: "", toolCalls: [] };
}

async function _callGemini(prompt: string, systemInstruction: string, signal?: AbortSignal) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) return { text: "", toolCalls: [] };

  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts) return { text: "", toolCalls: [] };

  let text = "";
  for (const part of candidate.content.parts) {
    if (part.text) text += part.text;
  }
  return { text, toolCalls: [] };
}

async function _callFeatherless(prompt: string, systemInstruction: string) {
  const url = `${FEATHERLESS_BASE_URL}/chat/completions`;
  const body = {
    model: FEATHERLESS_MODEL,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 512,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${FEATHERLESS_API_KEY}` },
      body: JSON.stringify(body),
    });
    if (!response.ok) return { text: "", toolCalls: [] };
    const data = await response.json();
    return { text: data.choices?.[0]?.message?.content || "", toolCalls: [] };
  } catch {
    return { text: "", toolCalls: [] };
  }
}

// ── Decision Functions ───────────────────────────────────────

export async function decideTaskRouting(
  taskDescription: string,
  subtasks: Array<{ agentType: string; input: string; price: string }>,
  agentHistory?: Record<string, { avgScore: number; completedCount: number }>,
): Promise<TaskRoutingDecision> {
  const defaultSequence = subtasks.map((s) => s.agentType);

  if (!GEMINI_ENABLED) {
    return {
      agentSequence: defaultSequence,
      reasoning: "Deterministic routing: serial execution research → code → test → review",
      parallel: false,
      estimatedCost: `$${subtasks.reduce((sum, s) => sum + parseFloat(s.price.replace("$", "")), 0).toFixed(3)}`,
    };
  }

  try {
    const historyContext = agentHistory 
      ? `\nAgent Performance Data:\n${Object.entries(agentHistory).map(([type, stats]) => `- ${type}: ${stats.avgScore}/100 accuracy over ${stats.completedCount} cycles`).join("\n")}`
      : "";

    const prompt = `Task: "${taskDescription}"
Agents: ${subtasks.map((s, i) => `${i + 1}. ${s.agentType}: "${s.input}"`).join("\n")}${historyContext}

Decide the optimal autonomous workflow. 
Return your decision in JSON format:
{
  "sequence": ["research", "code", "test", "review"],
  "parallel": boolean,
  "reasoning": "string explaining why based on reputation and task complexity",
  "adjustments": "string"
}
IMPORTANT: Only use these exact agent types in the sequence: research, code, test, review. Do NOT use synonyms like 'researcher' or 'coder'.`;

    const result = await callLLM(prompt, "You are the Agentic Economy Orchestrator on Arc L1. Optimize for maximum efficiency and speed. Group independent subtasks for parallel execution whenever possible to reduce total time. Parallel execution is STRONGLY ENCOURAGED.");

    let parsed;
    try {
      const cleanJson = result.text.match(/\{[\s\S]*\}/)?.[0] || result.text;
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = { sequence: defaultSequence, parallel: false, reasoning: result.text };
    }

    const sequence = parsed.sequence || defaultSequence;
    const reasoning = parsed.reasoning || `Routing to specialists: ${sequence.join(" → ")}`;

    // Record reasoning to Supabase for the Reasoning Feed
    recordTaskEvent({
      task_id: `routing-${Date.now()}`,
      agent_type: "orchestrator",
      status: "routing_decision",
      gateway_tx: null,
      amount: "$0.000",
      result: {
        type: "routing",
        task: taskDescription.slice(0, 80),
        routing: sequence.join(" → "),
        reasoning,
        model: GEMINI_MODEL,
        parallel: !!parsed.parallel,
      },
      error: null,
    }).catch(() => {});

    return {
      agentSequence: sequence,
      reasoning,
      parallel: !!parsed.parallel,
      estimatedCost: `$${subtasks.reduce((sum, s) => sum + parseFloat(s.price.replace("$", "")), 0).toFixed(3)}`,
    };
  } catch (err) {
    return {
      agentSequence: defaultSequence,
      reasoning: "Fallback sequence",
      parallel: false,
      estimatedCost: "0.00",
    };
  }
}

export async function decideReputationScore(
  agentType: string,
  taskDescription: string,
  agentResponse: string,
  taskSucceeded: boolean,
): Promise<ReputationDecision> {
  const defaultScore = taskSucceeded ? 85 : 30;
  const defaultFeedback = taskSucceeded ? "Task completed successfully" : "Task failed";

  if (!GEMINI_ENABLED) return { score: defaultScore, feedback: defaultFeedback, reasoning: "Default scoring" };

  try {
    const prompt = `Rate performance (1-100): Agent ${agentType}, Task "${taskDescription}", Success ${taskSucceeded}. Response snippet: ${agentResponse.slice(0, 150)}...`;
    const result = await callLLM(prompt, "Evaluate agent performance. Return JSON: { \"score\": number, \"feedback\": \"string\", \"reasoning\": \"string\" }");

    let parsed;
    try {
      const cleanJson = result.text.match(/\{[\s\S]*\}/)?.[0] || result.text;
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = { score: defaultScore, feedback: result.text || defaultFeedback, reasoning: result.text };
    }

    const score = typeof parsed.score === 'number' ? parsed.score : defaultScore;
    const reasoning = parsed.reasoning || `Quality assessment: ${score}/100`;

    // Record reasoning to Supabase
    recordTaskEvent({
      task_id: `reputation-${agentType}-${Date.now()}`,
      agent_type: "review-agent",
      status: "reasoning",
      gateway_tx: null,
      amount: "$0.000",
      result: {
        type: "evaluation",
        agent: agentType,
        score,
        feedback: parsed.feedback || reasoning.slice(0, 80),
        reasoning,
        model: GEMINI_MODEL,
      },
      error: null,
    }).catch(() => {});

    return { score, feedback: parsed.feedback || reasoning.slice(0, 80), reasoning };
  } catch {
    return { score: defaultScore, feedback: defaultFeedback, reasoning: "Evaluation failed" };
  }
}

export function getGeminiStatus() {
  return {
    enabled: GEMINI_ENABLED,
    model: GEMINI_MODEL,
    hasApiKey: !!(GEMINI_API_KEY || FEATHERLESS_API_KEY),
  };
}
