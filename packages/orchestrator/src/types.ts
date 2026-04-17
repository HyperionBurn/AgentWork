// ============================================================
// Shared Agent Response Types
// ============================================================
// Typed interfaces for agent responses across the orchestrator
// and dashboard. All agent types return a consistent envelope
// with a typed `result` payload.
// ============================================================

export interface AgentContext {
  prior_subtask_id: string;
  prior_agent_type: string;
  summary: string;
}

export interface ResearchResult {
  summary: string;
  key_findings: string[];
  sources: Array<{ title: string; relevance: number }>;
  confidence: number;
}

export interface CodeResult {
  code: string;
  language: string;
  files_modified: string[];
  test_coverage?: number;
}

export interface TestResult {
  tests_generated: number;
  passing: number;
  failing: number;
  coverage: number;
  test_suite: string;
}

export interface ReviewResult {
  quality_score: number;
  issues: Array<{ severity: string; description: string }>;
  approved: boolean;
  suggestions: string[];
}

export type AgentResult =
  | ResearchResult
  | CodeResult
  | TestResult
  | ReviewResult;

export interface AgentResponse {
  success: boolean;
  agent: string;
  task_id?: string;
  paid_by: string;
  amount: string;
  result: AgentResult;
  context?: AgentContext;
}
