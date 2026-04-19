import { NextResponse } from "next/server";

// ============================================================
// Governance API — On-chain governance proposals for dashboard
// ============================================================

interface GovernanceProposal {
  proposalId: string;
  parameter: string;
  currentValue: string;
  newValue: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  state: string;
}

function generateProposals(): GovernanceProposal[] {
  return [
    {
      proposalId: "proposal_1",
      parameter: "research_agent_price",
      currentValue: "$0.005",
      newValue: "$0.004",
      description: "Lower research agent pricing due to increased efficiency",
      votesFor: 5,
      votesAgainst: 1,
      state: "executed",
    },
    {
      proposalId: "proposal_2",
      parameter: "new_agent_approval",
      currentValue: "none",
      newValue: "data-agent",
      description: "Approve new data processing specialist agent",
      votesFor: 5,
      votesAgainst: 0,
      state: "executed",
    },
    {
      proposalId: "proposal_3",
      parameter: "slashing_threshold",
      currentValue: "50%",
      newValue: "30%",
      description: "Lower slashing threshold for minor infractions",
      votesFor: 2,
      votesAgainst: 3,
      state: "rejected",
    },
  ];
}

export async function GET() {
  return NextResponse.json({
    proposals: generateProposals(),
    summary: {
      total: 3,
      executed: 2,
      rejected: 1,
      active: 0,
    },
  });
}
