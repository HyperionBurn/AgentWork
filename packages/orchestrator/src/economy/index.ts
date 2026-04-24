// ============================================================
// Economy module — Public API
// ============================================================

export { createSplit, distributeSplit, getDefaultSplit, type SplitRecipient, type SplitConfig, type DistributionResult } from "./splitter";
export { setSpendingLimit, recordSpending, checkSpendingLimit, setDefaultSpendingLimits, getAllSpendingStatuses, type SpendingBudget, type SpendingStatus, type SpendingRecord } from "./spending";
export { calculatePrice, calculateAllPrices, incrementDemand, getDemandSnapshot, type PricingQuote } from "./pricing";
export { executeA2AChain, executeAllChains, getChainTemplates, countA2APayments, type A2APayment, type A2AChain } from "./a2a-chaining";
export { processAutoRefund, checkRefundEligibility, startRefundTimer, cancelRefundTimer, processFailedTaskRefunds, type RefundResult, type RefundEligibility } from "./refunds";
export { getTieredPrice, getTierPricing, tierHasCapability, getDefaultTier, getHigherTier, TIERS, type TierLevel, type TierConfig, type TierPricingResult } from "./tiers";
export { stakeAgent, slashAgent, getStakeInfo, compensateUser, calculateSlashAmount, getAllStakes, initDefaultStakes, type SlashSeverity, type StakeInfo, type SlashResult, type CompensationResult } from "./slashing";
export { startStream, stopStream, getStream, getActiveStreams, stopAllStreams, getTotalStreamed, getStreamingStats, setStreamGateway, type PaymentStream, type StreamPayment } from "./streaming";
export { convertToUsdc, convertFromUsdc, formatTokenAmount, getTokenAmount, getSupportedTokenSymbols, getPrimaryToken, SUPPORTED_TOKENS, type TokenInfo, type TokenAmount } from "./multi-token";
export { createBatchAuction, submitBid, settleAuction, runAutoAuction, getAuction, getAllAuctions, type BatchAuction, type AuctionBid } from "./auction";
export { buildMerkleTree, generateProof, verifyProof, verifyBatch, submitBatchProof, type MerkleTree, type MerkleProof } from "./merkle-proofs";
export { createProposal, castVote, executeProposal, getProposal, getAllProposals, runMockGovernance, type GovernanceProposal, type ProposalState, type VoteResult } from "./governance";
export { runNanopaymentStressTest, type StressTestPayment, type StressTestResult } from "../stress-test";
