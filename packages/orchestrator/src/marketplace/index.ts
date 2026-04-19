// ============================================================
// Marketplace module — Public API
// ============================================================

export { generateBids, selectBestBid, getBidHistory, type AgentBid, type BidSelection } from "./bidding";
export { discoverAgents, findAgentsForTask, updateAgentStatus, getAgentCapabilities, type DiscoveredAgent, type AgentCapability } from "./discovery";
export { routeTask, routeAllAgents, getReputationCache, type RoutingDecision, type RoutingConfig } from "./routing";
