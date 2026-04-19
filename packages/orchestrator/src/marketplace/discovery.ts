// ============================================================
// Agent Discovery & Capability Query
// ============================================================
// Allows the orchestrator to discover available agents,
// query their capabilities, and match them to task requirements.
// ============================================================

import { AGENT_ENDPOINTS } from "../config";

// ── Types ────────────────────────────────────────────────────

export interface AgentCapability {
  name: string;
  description: string;
  keywords: string[];
}

export interface DiscoveredAgent {
  type: string;
  label: string;
  baseUrl: string;
  price: string;
  capabilities: AgentCapability[];
  status: "available" | "busy" | "offline";
  load: number; // 0-100, current workload
}

// ── Agent capability registry ───────────────────────────────

const CAPABILITY_REGISTRY: Record<string, AgentCapability[]> = {
  research: [
    { name: "web_search", description: "Search the web for information", keywords: ["search", "find", "lookup", "research"] },
    { name: "summarization", description: "Summarize long texts", keywords: ["summarize", "summarise", "tldr", "brief"] },
    { name: "citation", description: "Generate citations and references", keywords: ["cite", "reference", "citation", "source"] },
    { name: "deep_analysis", description: "Deep analysis of complex topics", keywords: ["analyze", "analyse", "investigate", "deep dive"] },
  ],
  code: [
    { name: "code_generation", description: "Generate code from specifications", keywords: ["generate", "write", "create", "implement", "code"] },
    { name: "refactoring", description: "Refactor existing code", keywords: ["refactor", "improve", "clean", "optimize"] },
    { name: "debugging", description: "Debug and fix code issues", keywords: ["debug", "fix", "repair", "troubleshoot"] },
    { name: "implementation", description: "Full feature implementation", keywords: ["implement", "build", "develop", "feature"] },
  ],
  test: [
    { name: "test_generation", description: "Generate test suites", keywords: ["test", "unit test", "integration test", "spec"] },
    { name: "qa", description: "Quality assurance checks", keywords: ["qa", "quality", "verify", "validate"] },
    { name: "coverage", description: "Analyze test coverage", keywords: ["coverage", "branch", "line", "path"] },
    { name: "validation", description: "Validate outputs and schemas", keywords: ["validate", "check", "assert", "expect"] },
  ],
  review: [
    { name: "code_review", description: "Review code for quality", keywords: ["review", "audit", "inspect", "examine"] },
    { name: "security_audit", description: "Security vulnerability scanning", keywords: ["security", "vulnerability", "exploit", "safe"] },
    { name: "quality_scoring", description: "Score code quality", keywords: ["score", "rate", "grade", "rank"] },
    { name: "feedback", description: "Generate improvement feedback", keywords: ["feedback", "suggest", "improve", "recommend"] },
  ],
};

// ── In-memory agent state (for demo) ────────────────────────

const agentStates = new Map<string, { status: DiscoveredAgent["status"]; load: number }>();

/**
 * Discover all available agents and their capabilities.
 */
export function discoverAgents(): DiscoveredAgent[] {
  return AGENT_ENDPOINTS.map((endpoint) => {
    const state = agentStates.get(endpoint.type) || { status: "available", load: 0 };
    return {
      type: endpoint.type,
      label: endpoint.label,
      baseUrl: endpoint.baseUrl,
      price: endpoint.price,
      capabilities: CAPABILITY_REGISTRY[endpoint.type] || [],
      status: state.status,
      load: state.load,
    };
  });
}

/**
 * Find agents matching a task description by keyword matching.
 * Returns agents sorted by relevance score (number of keyword matches).
 */
export function findAgentsForTask(taskDescription: string): DiscoveredAgent[] {
  const lower = taskDescription.toLowerCase();
  const words = lower.split(/\s+/);

  const agents = discoverAgents();
  const scored = agents.map((agent) => {
    let score = 0;
    for (const cap of agent.capabilities) {
      for (const keyword of cap.keywords) {
        if (lower.includes(keyword) || words.some((w) => w.includes(keyword))) {
          score += 2;
        }
      }
      if (lower.includes(cap.name.replace("_", " "))) {
        score += 3;
      }
    }
    return { agent, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.agent);
}

/**
 * Update an agent's status (busy/available/offline) and load.
 */
export function updateAgentStatus(
  agentType: string,
  status: DiscoveredAgent["status"],
  load: number,
): void {
  agentStates.set(agentType, { status, load: Math.min(100, Math.max(0, load)) });
}

/**
 * Get capability registry for a specific agent type.
 */
export function getAgentCapabilities(agentType: string): AgentCapability[] {
  return CAPABILITY_REGISTRY[agentType] || [];
}
