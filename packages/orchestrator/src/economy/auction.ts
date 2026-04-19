// ============================================================
// Batch Auction Settlement — Auction-based batch settlement
// ============================================================
// Creates auctions where agents bid for tasks, lowest bidder
// wins, and settlement happens in a single batch transaction.
// ============================================================

// ── Types ────────────────────────────────────────────────────

export interface BatchAuction {
  auctionId: string;
  taskDescription: string;
  minPrice: number;
  bids: AuctionBid[];
  winner: AuctionBid | null;
  status: "open" | "settling" | "settled";
  createdAt: number;
  settledAt: number | null;
  settlementTxHash: string | null;
}

export interface AuctionBid {
  agentType: string;
  agentAddress: string;
  price: number;
  quality: number;
  score: number;
  timestamp: number;
}

// ── State ────────────────────────────────────────────────────

const auctions = new Map<string, BatchAuction>();
let auctionCounter = 0;

// ── Auction Functions ────────────────────────────────────────

/**
 * Create a new batch auction for a task.
 */
export function createBatchAuction(
  taskDescription: string,
  minPrice: number = 0.003,
): BatchAuction {
  auctionCounter++;
  const auctionId = `auction_${auctionCounter}`;

  const auction: BatchAuction = {
    auctionId,
    taskDescription,
    minPrice,
    bids: [],
    winner: null,
    status: "open",
    createdAt: Date.now(),
    settledAt: null,
    settlementTxHash: null,
  };

  auctions.set(auctionId, auction);
  return auction;
}

/**
 * Submit a bid for an auction.
 */
export function submitBid(
  auctionId: string,
  agentType: string,
  agentAddress: string,
  price: number,
  quality: number = 80,
): AuctionBid | null {
  const auction = auctions.get(auctionId);
  if (!auction || auction.status !== "open") return null;

  // Score: 70% price weight, 30% quality weight
  const maxPrice = auction.minPrice * 3;
  const priceScore = Math.max(0, 1 - (price - auction.minPrice) / (maxPrice - auction.minPrice));
  const score = priceScore * 0.7 + (quality / 100) * 0.3;

  const bid: AuctionBid = {
    agentType,
    agentAddress,
    price,
    quality,
    score,
    timestamp: Date.now(),
  };

  auction.bids.push(bid);
  return bid;
}

/**
 * Settle an auction — lowest bidder wins.
 */
export function settleAuction(auctionId: string): BatchAuction | null {
  const auction = auctions.get(auctionId);
  if (!auction || auction.status !== "open" || auction.bids.length === 0) return null;

  // Sort by score descending (lower price + higher quality = higher score)
  const sorted = [...auction.bids].sort((a, b) => b.score - a.score);
  auction.winner = sorted[0];
  auction.status = "settled";
  auction.settledAt = Date.now();
  auction.settlementTxHash = `MOCK_0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("")}`;

  return auction;
}

/**
 * Auto-run an auction with simulated bids.
 */
export function runAutoAuction(
  taskDescription: string,
  agentTypes: string[],
  basePrice: number = 0.005,
): BatchAuction {
  const auction = createBatchAuction(taskDescription, basePrice * 0.5);

  // Simulate 3 bids per agent type
  for (const agentType of agentTypes) {
    const bidCount = 3;
    for (let i = 0; i < bidCount; i++) {
      const priceVariance = 0.7 + Math.random() * 0.6; // 70%-130% of base
      const quality = 70 + Math.floor(Math.random() * 30);
      submitBid(
        auction.auctionId,
        agentType,
        `0x_AGENT_${agentType.toUpperCase()}_BIDDER_${i}`,
        basePrice * priceVariance,
        quality,
      );
    }
  }

  // Settle
  return settleAuction(auction.auctionId)!;
}

/**
 * Get an auction by ID.
 */
export function getAuction(auctionId: string): BatchAuction | null {
  return auctions.get(auctionId) || null;
}

/**
 * Get all auctions.
 */
export function getAllAuctions(): BatchAuction[] {
  return Array.from(auctions.values());
}
