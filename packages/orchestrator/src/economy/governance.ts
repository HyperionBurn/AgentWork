// ============================================================
// On-Chain Governance — Token-weighted parameter voting
// ============================================================
// Manages proposals for agent parameters (pricing, new agents,
// slashing thresholds). Mock fallback when contract not deployed.
// ============================================================

// ── Types ────────────────────────────────────────────────────

export type ProposalState = "pending" | "active" | "passed" | "executed" | "rejected";

export interface GovernanceProposal {
  proposalId: string;
  proposer: string;
  parameter: string;
  currentValue: string;
  newValue: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  deadline: number;
  state: ProposalState;
  executedAt: number | null;
  executionTxHash: string | null;
}

export interface VoteResult {
  proposalId: string;
  support: boolean;
  weight: number;
  voterAddress: string;
  txHash: string;
  mock: boolean;
}

// ── State ────────────────────────────────────────────────────

const proposals = new Map<string, GovernanceProposal>();
let proposalCounter = 0;

// ── Governance Functions ─────────────────────────────────────

/**
 * Create a governance proposal.
 */
export function createProposal(
  parameter: string,
  currentValue: string,
  newValue: string,
  description: string,
  proposer: string = "0x_ORCHESTRATOR",
): GovernanceProposal {
  proposalCounter++;
  const proposalId = `proposal_${proposalCounter}`;

  const proposal: GovernanceProposal = {
    proposalId,
    proposer,
    parameter,
    currentValue,
    newValue,
    description,
    votesFor: 0,
    votesAgainst: 0,
    totalVotes: 0,
    deadline: Date.now() + 24 * 60 * 60 * 1000, // 24h
    state: "active",
    executedAt: null,
    executionTxHash: null,
  };

  proposals.set(proposalId, proposal);
  console.log(`   📋 Proposal created: ${proposalId} — ${parameter}: ${currentValue} → ${newValue}`);
  return proposal;
}

/**
 * Cast a vote on a proposal.
 */
export function castVote(
  proposalId: string,
  support: boolean,
  voterAddress: string = "0x_VOTER",
  weight: number = 1,
): VoteResult | null {
  const proposal = proposals.get(proposalId);
  if (!proposal || proposal.state !== "active") return null;

  if (support) {
    proposal.votesFor += weight;
  } else {
    proposal.votesAgainst += weight;
  }
  proposal.totalVotes += weight;

  // Auto-resolve if deadline passed or quorum met
  if (proposal.totalVotes >= 3) {
    proposal.state = proposal.votesFor > proposal.votesAgainst ? "passed" : "rejected";
  }

  const txHash = `MOCK_0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("")}`;

  return {
    proposalId,
    support,
    weight,
    voterAddress,
    txHash,
    mock: true,
  };
}

/**
 * Execute a passed proposal.
 */
export function executeProposal(proposalId: string): GovernanceProposal | null {
  const proposal = proposals.get(proposalId);
  if (!proposal || proposal.state !== "passed") return null;

  proposal.state = "executed";
  proposal.executedAt = Date.now();
  proposal.executionTxHash = `MOCK_0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("")}`;

  console.log(`   ✅ Proposal executed: ${proposalId} — ${proposal.parameter} = ${proposal.newValue}`);
  return proposal;
}

/**
 * Get a proposal by ID.
 */
export function getProposal(proposalId: string): GovernanceProposal | null {
  return proposals.get(proposalId) || null;
}

/**
 * Get all proposals.
 */
export function getAllProposals(): GovernanceProposal[] {
  return Array.from(proposals.values());
}

/**
 * Run a mock governance cycle with pre-defined proposals.
 */
export function runMockGovernance(): GovernanceProposal[] {
  const results: GovernanceProposal[] = [];

  // Proposal 1: Adjust research agent pricing
  const p1 = createProposal("research_agent_price", "$0.005", "$0.004", "Lower research agent pricing due to increased efficiency");
  castVote(p1.proposalId, true, "0x_AGENT_RESEARCH", 3);
  castVote(p1.proposalId, true, "0x_AGENT_CODE", 2);
  castVote(p1.proposalId, false, "0x_AGENT_REVIEW", 1);
  results.push(executeProposal(p1.proposalId)!);

  // Proposal 2: Approve new data-agent
  const p2 = createProposal("new_agent_approval", "none", "data-agent", "Approve new data processing specialist agent");
  castVote(p2.proposalId, true, "0x_AGENT_RESEARCH", 2);
  castVote(p2.proposalId, true, "0x_AGENT_TEST", 2);
  castVote(p2.proposalId, true, "0x_AGENT_CODE", 1);
  results.push(executeProposal(p2.proposalId)!);

  return results;
}
