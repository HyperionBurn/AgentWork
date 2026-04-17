import { Subtask, TaskDecomposition, AGENT_ENDPOINTS } from "./config";

// ============================================================
// Task Decomposer
// ============================================================
// In production, this would use an LLM to decompose tasks.
// For the hackathon demo, we use a hardcoded decomposition
// to ensure reliable, repeatable demo execution.
// ============================================================

/**
 * Decompose a task string into ordered subtasks for specialist agents.
 * Each subtask targets a specific agent type with an input prompt.
 */
export function decomposeTask(taskDescription: string): TaskDecomposition {
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
