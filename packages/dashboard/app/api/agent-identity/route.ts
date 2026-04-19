import { NextResponse } from "next/server";

// ============================================================
// Agent Identity API Route
// ============================================================
// Returns agent identity data for the AgentRegistry component.
// When contracts are deployed, queries IdentityRegistry on-chain.
// Otherwise returns mock identity data.
// ============================================================

const AGENT_TYPES = [
  { type: "research", name: "Research Agent", capabilities: ["web_search", "summarization", "citation", "analysis"] },
  { type: "code", name: "Code Agent", capabilities: ["code_generation", "implementation", "refactoring", "bug_fixing"] },
  { type: "test", name: "Test Agent", capabilities: ["test_generation", "qa", "coverage", "validation"] },
  { type: "review", name: "Review Agent", capabilities: ["code_review", "quality_scoring", "security_audit", "feedback"] },
];

export async function GET() {
  // In production, this would query the IdentityRegistry contract
  // For now, return mock identities
  const identities = AGENT_TYPES.map((agent, index) => ({
    name: agent.name,
    type: agent.type,
    tokenId: null,
    owner: `0x${index.toString().padStart(40, "0")}`,
    capabilities: agent.capabilities,
    registeredAt: new Date().toISOString(),
    mock: true,
  }));

  return NextResponse.json({ identities });
}
