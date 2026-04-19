import { describe, it, expect } from "vitest";
import { topologicalSort } from "../src/executor";

// ============================================================
// Executor Tests — Parallel execution (#8)
// ============================================================

describe("topologicalSort", () => {
  const makeSubtask = (id: string, dependsOn: string[] = []) => ({
    id,
    agentType: "research",
    input: `task-${id}`,
    price: "$0.005",
    url: "http://localhost:4021/api/research?input=test",
    dependsOn,
  });

  it("sorts independent tasks into one level", () => {
    const tasks = [
      makeSubtask("a"),
      makeSubtask("b"),
      makeSubtask("c"),
    ];
    const levels = topologicalSort(tasks);
    expect(levels).toHaveLength(1);
    expect(levels[0]).toHaveLength(3);
  });

  it("sorts sequential tasks into separate levels", () => {
    const tasks = [
      makeSubtask("a"),
      makeSubtask("b", ["a"]),
      makeSubtask("c", ["b"]),
    ];
    const levels = topologicalSort(tasks);
    expect(levels).toHaveLength(3);
    expect(levels[0].map((t) => t.id)).toEqual(["a"]);
    expect(levels[1].map((t) => t.id)).toEqual(["b"]);
    expect(levels[2].map((t) => t.id)).toEqual(["c"]);
  });

  it("sorts diamond dependency correctly", () => {
    const tasks = [
      makeSubtask("a"),
      makeSubtask("b", ["a"]),
      makeSubtask("c", ["a"]),
      makeSubtask("d", ["b", "c"]),
    ];
    const levels = topologicalSort(tasks);
    expect(levels).toHaveLength(3);
    expect(levels[0].map((t) => t.id)).toEqual(["a"]);
    expect(new Set(levels[1].map((t) => t.id))).toEqual(new Set(["b", "c"]));
    expect(levels[2].map((t) => t.id)).toEqual(["d"]);
  });

  it("handles empty input", () => {
    const levels = topologicalSort([]);
    expect(levels).toHaveLength(0);
  });

  it("handles single task", () => {
    const tasks = [makeSubtask("a")];
    const levels = topologicalSort(tasks);
    expect(levels).toHaveLength(1);
    expect(levels[0]).toHaveLength(1);
  });
});
