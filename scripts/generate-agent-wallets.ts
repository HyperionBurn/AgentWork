/**
 * AgentWork — Agent Wallet Generator
 * Generates 4 distinct Arc testnet wallet addresses for specialist agents.
 *
 * Usage:
 *   npx tsx scripts/generate-agent-wallets.ts
 *
 * After generating:
 *   1. Copy the RESEARCH/CODE/TEST/REVIEW_AGENT_WALLET lines to .env
 *   2. Fund each wallet at https://faucet.circle.com
 *   3. NEVER commit private keys to git
 */

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const agents = ["RESEARCH", "CODE", "TEST", "REVIEW"] as const;

console.log("=".repeat(60));
console.log("  AgentWork — Agent Wallet Generator");
console.log("=".repeat(60));
console.log("");
console.log("# Add these to your .env file:");
console.log("");

for (const agent of agents) {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  console.log(`${agent}_AGENT_WALLET=${account.address}`);
  console.log(`# ${agent}_AGENT_KEY=${privateKey}`);
  console.log("");
}

console.log("=".repeat(60));
console.log("  Next steps:");
console.log("  1. Copy the *_AGENT_WALLET lines to .env");
console.log("  2. Fund each wallet at: https://faucet.circle.com");
console.log("  3. NEVER commit private keys to git!");
console.log("=".repeat(60));
