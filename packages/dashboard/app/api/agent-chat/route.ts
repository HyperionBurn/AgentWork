// ============================================================
// Agent Chat API Route — Real Groq LLM Responses
// ============================================================
// Calls Groq API server-side (API key never reaches client).
// Falls back to short demo responses on timeout/error.
// ============================================================

import { NextResponse } from "next/server";
import { config as loadDotenv } from "dotenv";
import { resolve } from "path";

// Load root .env (Next.js only loads its own directory's .env)
loadDotenv({ path: resolve(process.cwd(), "..", "..", ".env") });
// Also try loading from dashboard directory if above fails
loadDotenv({ path: resolve(process.cwd(), ".env"), override: false });

const GROQ_API_KEY = process.env.LLM_API_KEY || "";
const GROQ_BASE_URL = process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.LLM_MODEL || "llama-3.3-70b-versatile";

const SYSTEM_PROMPTS: Record<string, string> = {
  research:
    "You are a deep research specialist AI agent. Given a task, provide a concise but insightful analysis with 2-3 key findings. Keep responses under 3 sentences. Be specific and data-driven.",
  code:
    "You are an expert software engineer AI agent. Given a task, describe how you would implement it — mention the architecture, key modules, and one clever design choice. Keep responses under 3 sentences.",
  test:
    "You are a QA/testing specialist AI agent. Given a task, briefly describe your testing strategy — what you'd test, tools used, and a key edge case you'd cover. Keep responses under 3 sentences.",
  review:
    "You are a senior code reviewer AI agent. Given a task, provide a brief quality assessment — architecture score out of 10, one strength, and one improvement suggestion. Keep responses under 3 sentences.",
};

const FALLBACK_RESPONSES: Record<string, string> = {
  research:
    "Research complete. Analysis indicates strong feasibility with 3 key technical considerations identified.",
  code:
    "Implementation ready. Designed a modular pipeline with proper error handling and type safety.",
  test:
    "Test suite passed: 12 unit tests, 3 integration tests. Coverage: 94%. All edge cases verified.",
  review:
    "Code quality: 9/10. Clean architecture with good separation of concerns. Minor suggestion: add rate limiting.",
};

interface ChatRequestBody {
  message: string;
  agentType: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as ChatRequestBody;
    const { message, agentType } = body;

    if (!message || !agentType) {
      return NextResponse.json(
        { error: "message and agentType are required" },
        { status: 400 },
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[agentType] ?? SYSTEM_PROMPTS.research;

    // If no API key, return fallback immediately
    if (!GROQ_API_KEY) {
      return NextResponse.json({
        response: FALLBACK_RESPONSES[agentType] ?? FALLBACK_RESPONSES.research,
        fallback: true,
      });
    }

    // Call Groq with 5s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const groqResponse = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!groqResponse.ok) {
        throw new Error(`Groq API returned ${groqResponse.status}`);
      }

      const data = await groqResponse.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error("Empty response from Groq");
      }

      return NextResponse.json({ response: content, fallback: false });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error("Agent chat error:", error);
    const agentType = (error instanceof Error) ? "research" : "research";
    return NextResponse.json({
      response: FALLBACK_RESPONSES[agentType],
      fallback: true,
    });
  }
}
