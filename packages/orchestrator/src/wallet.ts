// ============================================================
// Wallet Connect — Wallet connection management
// ============================================================
// Manages wallet connections for the orchestrator to interact
// with agent wallets on Arc. Supports viem local accounts and
// mock mode when no wallet is configured.
// ============================================================

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// ── Types ────────────────────────────────────────────────────

export interface WalletState {
  address: string;
  isConnected: boolean;
  balance: number;
  network: string;
  chainId: number;
}

export interface WalletConfig {
  privateKey?: string;
  rpcUrl: string;
  chainId: number;
}

// ── State ────────────────────────────────────────────────────

let currentWallet: WalletState | null = null;

// ── Wallet Functions ─────────────────────────────────────────

/**
 * Connect a wallet from an existing private key or generate a new one.
 */
export function connectWallet(config: WalletConfig): WalletState {
  const pk = config.privateKey || generatePrivateKey();
  const account = privateKeyToAccount(pk as `0x${string}`);

  currentWallet = {
    address: account.address,
    isConnected: true,
    balance: 0,
    network: "Arc Testnet",
    chainId: config.chainId,
  };

  console.log(`   🔗 Wallet connected: ${account.address.slice(0, 10)}...`);
  return currentWallet;
}

/**
 * Update the wallet balance.
 */
export function updateWalletBalance(balance: number): void {
  if (currentWallet) {
    currentWallet.balance = balance;
  }
}

/**
 * Get the current wallet state.
 */
export function getWalletState(): WalletState | null {
  return currentWallet;
}

/**
 * Disconnect the wallet.
 */
export function disconnectWallet(): void {
  currentWallet = null;
  console.log("   🔗 Wallet disconnected");
}

/**
 * Check if a wallet is connected.
 */
export function isWalletConnected(): boolean {
  return currentWallet?.isConnected ?? false;
}

/**
 * Get the wallet address (throws if not connected).
 */
export function getWalletAddress(): string {
  if (!currentWallet?.isConnected) {
    throw new Error("Wallet not connected");
  }
  return currentWallet.address;
}

/**
 * Sign a message with the wallet (mock).
 */
export function signMessage(message: string): string {
  if (!currentWallet?.isConnected) {
    throw new Error("Wallet not connected");
  }
  // Mock signature
  return `0x_mock_sig_${Buffer.from(message).toString("hex").slice(0, 64)}`;
}

/**
 * Get a summary of wallet state for display.
 */
export function getWalletSummary(): string {
  if (!currentWallet) return "No wallet connected";
  return `${currentWallet.address.slice(0, 8)}...${currentWallet.address.slice(-6)} | $${currentWallet.balance.toFixed(2)} | ${currentWallet.network}`;
}
