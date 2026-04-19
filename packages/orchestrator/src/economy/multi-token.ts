// ============================================================
// Multi-Token Pricing — Support for multiple payment tokens
// ============================================================
// Enables pricing in multiple tokens on Arc with conversion
// rates back to USDC for accounting.
// ============================================================

// ── Types ────────────────────────────────────────────────────

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  priceInUsdc: number; // conversion rate
}

export interface TokenAmount {
  amount: number;
  token: string;
  usdcEquivalent: number;
  formatted: string;
}

// ── Supported Tokens ─────────────────────────────────────────

export const SUPPORTED_TOKENS: Record<string, TokenInfo> = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
    priceInUsdc: 1.0,
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xMOCK_USDT_ADDRESS",
    decimals: 6,
    priceInUsdc: 1.0,
  },
  EURC: {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0xMOCK_EURC_ADDRESS",
    decimals: 6,
    priceInUsdc: 1.08,
  },
  WETH: {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xMOCK_WETH_ADDRESS",
    decimals: 18,
    priceInUsdc: 3500.0,
  },
};

// ── Conversion Functions ─────────────────────────────────────

/**
 * Convert an amount from a given token to USDC equivalent.
 */
export function convertToUsdc(amount: number, tokenSymbol: string): number {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  if (!token) return amount; // Assume USDC if unknown
  return amount * token.priceInUsdc;
}

/**
 * Convert a USDC amount to a target token.
 */
export function convertFromUsdc(usdcAmount: number, targetToken: string): number {
  const token = SUPPORTED_TOKENS[targetToken];
  if (!token || token.priceInUsdc === 0) return usdcAmount;
  return usdcAmount / token.priceInUsdc;
}

/**
 * Format a token amount for display.
 */
export function formatTokenAmount(amount: number, tokenSymbol: string): string {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  const decimals = token?.decimals || 6;
  const formatted = amount.toFixed(Math.min(decimals, 6));
  return `${formatted} ${tokenSymbol}`;
}

/**
 * Get a TokenAmount with both raw and USDC equivalent.
 */
export function getTokenAmount(
  amount: number,
  tokenSymbol: string,
): TokenAmount {
  const usdcEquiv = convertToUsdc(amount, tokenSymbol);
  return {
    amount,
    token: tokenSymbol,
    usdcEquivalent: usdcEquiv,
    formatted: formatTokenAmount(amount, tokenSymbol),
  };
}

/**
 * Get all supported token symbols.
 */
export function getSupportedTokenSymbols(): string[] {
  return Object.keys(SUPPORTED_TOKENS);
}

/**
 * Get the primary payment token (USDC).
 */
export function getPrimaryToken(): TokenInfo {
  return SUPPORTED_TOKENS.USDC;
}
