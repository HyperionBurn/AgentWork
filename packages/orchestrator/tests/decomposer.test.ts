import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// Decomposer Tests — Dynamic decomposition (#8)
// ============================================================

// Mock environment before importing
vi.stubEnv("USE_LLM_DECOMPOSER", "false");
vi.stubEnv("LLM_API_KEY", "");

// Import after env stubs
const { decomposeTask } = await import("../src/decomposer");

describe("decomposeTask", () => {
  it("returns hardcoded decomposition by default", async () => {
    const result = await decomposeTask("Build a REST API");
    expect(result.subtasks.length).toBeGreaterThanOrEqual(3);
    expect(result.taskId).toMatch(/^task-/);
    expect(result.estimatedCost).toMatch(/^\$/);
    expect(result.estimatedTransactions).toBe(result.subtasks.length);
  });

  it("includes all 4 agent types", async () => {
    const result = await decomposeTask("Build a REST API");
    const types = new Set(result.subtasks.map((s) => s.agentType));
    expect(types.has("research")).toBe(true);
    expect(types.has("code")).toBe(true);
    expect(types.has("test")).toBe(true);
    expect(types.has("review")).toBe(true);
  });

  it("maintains valid dependency graph", async () => {
    const result = await decomposeTask("Build a REST API");
    const ids = new Set(result.subtasks.map((s) => s.id));
    for (const subtask of result.subtasks) {
      for (const dep of subtask.dependsOn) {
        expect(ids.has(dep)).toBe(true);
      }
    }
  });

  it("first task has no dependencies", async () => {
    const result = await decomposeTask("Build a REST API");
    const rootTasks = result.subtasks.filter((s) => s.dependsOn.length === 0);
    expect(rootTasks.length).toBeGreaterThanOrEqual(1);
  });
});
