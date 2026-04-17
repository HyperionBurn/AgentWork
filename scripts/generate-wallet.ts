/**
 * AgentWork — Wallet Generator
 * Generates a new private key and derived address for Arc testnet.
 *
 * Usage:
 *   npx tsx scripts/generate-wallet.ts
 *   npm run generate-wallet
 *
 * After generating:
 *   1. Copy the private key to .env as ORCHESTRATOR_PRIVATE_KEY
 *   2. Copy the address to .env as SELLER_WALLET
 *   3. Fund the wallet at https://faucet.circle.com
 *   4. NEVER commit the private key to git
 */

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("=".repeat(50));
console.log("  AgentWork — Wallet Generated");
console.log("=".repeat(50));
console.log(`  Address:     ${account.address}`);
console.log(`  Private Key: ${privateKey}`);
console.log("=".repeat(50));
console.log("");
console.log("  Next steps:");
console.log("  1. Add to .env as ORCHESTRATOR_PRIVATE_KEY=<key>");
console.log("  2. Add address as SELLER_WALLET=<address>");
console.log("  3. Fund at: https://faucet.circle.com");
console.log("  4. NEVER commit this key to git!");
console.log("");
