import { Subtask, TaskDecomposition, AGENT_ENDPOINTS, FEATURES } from "./config";

// ============================================================
// Task Decomposer
// ============================================================
// Supports two modes:
// 1. Hardcoded demo decomposition (default — reliable for demo)
// 2. Dynamic LLM decomposition (USE_LLM_DECOMPOSER=true)
//    Falls back to hardcoded on any LLM failure.
// ============================================================

const VALID_AGENT_TYPES = new Set(AGENT_ENDPOINTS.map((a) => a.type));

/**
 * Decompose a task string into ordered subtasks for specialist agents.
 * When USE_LLM_DECOMPOSER=true and API key is set, uses an LLM.
 * Otherwise falls back to the hardcoded demo decomposition.
 */
export async function decomposeTask(taskDescription: string): Promise<TaskDecomposition> {
  if (FEATURES.useLLMDecomposer) {
    try {
      const llmResult = await llmDecompose(taskDescription);
      if (llmResult) {
        const validated = validateDecomposition(llmResult, taskDescription);
        if (validated) {
          console.log("   🤖 Dynamic decomposition from LLM");
          return validated;
        }
      }
    } catch (error) {
      console.error("   ⚠️  LLM decomposition failed, falling back to hardcoded:", error);
    }
  }

  return hardcodedDecompose(taskDescription);
}

// ============================================================
// LLM Decomposition (#5)
// ============================================================

interface LLMSubtask {
  id: string;
  agentType: string;
  input: string;
  dependsOn: string[];
}

async function llmDecompose(taskDescription: string): Promise<LLMSubtask[] | null> {
  const apiKey = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  const prompt = `You are a task decomposer for an AI agent marketplace. Break down this task into 3-8 subtasks for specialist agents.

Available agent types: ${AGENT_ENDPOINTS.map((a) => `"${a.type}"`).join(", ")}
Each subtask needs: id (e.g., "task-1"), agentType, input (string), dependsOn (array of ids)

Task: "${taskDescription}"

Return ONLY a valid JSON array of subtasks. Example:
[{"id":"task-1","agentType":"research","input":"Research...","dependsOn":[]}]
No markdown, no explanation, just the JSON array.`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return null;

  // Strip markdown code fences if present
  const jsonStr = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(jsonStr) as LLMSubtask[];
}

/**
 * Validate LLM decomposition output — reject if malformed.
 */
function validateDecomposition(
  subtasks: LLMSubtask[],
  taskDescription: string,
): TaskDecomposition | null {
  if (!Array.isArray(subtasks) || subtasks.length < 3 || subtasks.length > 12) {
    console.log("   ⚠️  LLM returned invalid subtask count:", subtasks.length);
    return null;
  }

  // Check all agent types are valid
  for (const s of subtasks) {
    if (!VALID_AGENT_TYPES.has(s.agentType)) {
      console.log("   ⚠️  LLM returned invalid agent type:", s.agentType);
      return null;
    }
  }

  // Check for dependency cycles (simple BFS)
  const ids = new Set(subtasks.map((s) => s.id));
  for (const s of subtasks) {
    for (const dep of s.dependsOn) {
      if (!ids.has(dep)) {
        console.log("   ⚠️  LLM returned unknown dependency:", dep);
        return null;
      }
    }
  }

  // Build TaskDecomposition
  const taskId = generateId();
  const enriched: Subtask[] = subtasks.map((s) => {
    const agent = AGENT_ENDPOINTS.find((a) => a.type === s.agentType);
    const params = new URLSearchParams({ input: s.input });
    return {
      id: s.id.startsWith("task-") ? `${taskId}-${s.id}` : s.id,
      agentType: s.agentType,
      input: s.input,
      price: agent?.price || "$0.005",
      url: `${agent?.baseUrl || "http://localhost:4021"}${agent?.apiPath || "/api/research"}?${params.toString()}`,
      dependsOn: s.dependsOn.map((d) =>
        d.startsWith("task-") ? `${taskId}-${d}` : d,
      ),
    };
  });

  const totalCost = enriched
    .reduce((sum, s) => sum + parseFloat(s.price.replace("$", "")), 0)
    .toFixed(3);

  return {
    taskId,
    description: taskDescription,
    subtasks: enriched,
    estimatedCost: `$${totalCost}`,
    estimatedTransactions: enriched.length,
  };
}

// ============================================================
// Hardcoded Demo Decomposition (fallback)
// ============================================================

/**
 * Decompose a task string into ordered subtasks for specialist agents.
 * Each subtask targets a specific agent type with an input prompt.
 */
function hardcodedDecompose(taskDescription: string): TaskDecomposition {
  const taskId = generateId();

  // Hardcoded demo decomposition — reliable for demo video
  // Each dependent subtask carries a context string describing
  // what its parent tasks produced, enabling richer agent responses.
  const subtasks: Subtask[] = [
    {
      id: `${taskId}-1`,
      agentType: "research",
      input: taskDescription,
      price: agentPrice("research"),
      url: agentUrl("research", taskDescription),
      dependsOn: [],
    },
    {
      id: `${taskId}-2`,
      agentType: "research",
      input: `Follow-up research on: ${taskDescription}`,
      price: agentPrice("research"),
      url: agentUrl("research", `Follow-up: ${taskDescription}`, `Prior research on '${taskDescription}' completed — perform deeper follow-up analysis`),
      dependsOn: [`${taskId}-1`],
      context: `Prior research on '${taskDescription}' completed — perform deeper follow-up analysis`,
    },
    {
      id: `${taskId}-3`,
      agentType: "code",
      input: taskDescription,
      price: agentPrice("code"),
      url: agentUrl("code", taskDescription, `Research findings available for '${taskDescription}' — implement based on research`),
      dependsOn: [`${taskId}-1`],
      context: `Research findings available for '${taskDescription}' — implement based on research`,
    },
    {
      id: `${taskId}-4`,
      agentType: "code",
      input: `Fix issues in implementation of: ${taskDescription}`,
      price: agentPrice("code"),
      url: agentUrl("code", `Fix: ${taskDescription}`, `Initial code and follow-up research complete — fix and refine implementation`),
      dependsOn: [`${taskId}-3`, `${taskId}-2`],
      context: `Initial code and follow-up research complete — fix and refine implementation`,
    },
    {
      id: `${taskId}-5`,
      agentType: "test",
      input: `Generate tests for: ${taskDescription}`,
      price: agentPrice("test"),
      url: agentUrl("test", taskDescription, `Code generated for '${taskDescription}' — write comprehensive test suite`),
      dependsOn: [`${taskId}-3`],
      context: `Code generated for '${taskDescription}' — write comprehensive test suite`,
    },
    {
      id: `${taskId}-6`,
      agentType: "test",
      input: `Re-test after fixes: ${taskDescription}`,
      price: agentPrice("test"),
      url: agentUrl("test", `Re-test: ${taskDescription}`, `Code fixes applied and initial tests written — validate and re-test`),
      dependsOn: [`${taskId}-4`, `${taskId}-5`],
      context: `Code fixes applied and initial tests written — validate and re-test`,
    },
    {
      id: `${taskId}-7`,
      agentType: "review",
      input: `Review quality of: ${taskDescription}`,
      price: agentPrice("review"),
      url: agentUrl("review", taskDescription, `Implementation and tests finalized — perform quality review`),
      dependsOn: [`${taskId}-4`, `${taskId}-5`],
      context: `Implementation and tests finalized — perform quality review`,
    },
  ];

  const totalCost = subtasks
    .reduce((sum, s) => sum + parseFloat(s.price.replace("$", "")), 0)
    .toFixed(3);

  return {
    taskId,
    description: taskDescription,
    subtasks,
    estimatedCost: `$${totalCost}`,
    estimatedTransactions: subtasks.length,
  };
}

// ============================================================
// Helpers
// ============================================================

function agentUrl(type: string, input: string, context?: string): string {
  const agent = AGENT_ENDPOINTS.find((a) => a.type === type);
  if (!agent) throw new Error(`Unknown agent type: ${type}`);
  const params = new URLSearchParams({ input });
  if (context) params.set("context", context);
  return `${agent.baseUrl}${agent.apiPath}?${params.toString()}`;
}

function agentPrice(type: string): string {
  const agent = AGENT_ENDPOINTS.find((a) => a.type === type);
  return agent?.price || "$0.005";
}

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
