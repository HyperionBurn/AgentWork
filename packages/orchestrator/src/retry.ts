// ============================================================
// Smart Retry & Fallback — Circuit breaker for agent calls
// ============================================================
// Tracks failures per agent type, opens circuits after repeated
// failures, and routes to fallback agents when primary is down.
// ============================================================

import { AGENT_ENDPOINTS } from "./config";

// ── Types ────────────────────────────────────────────────────

export interface CircuitState {
  agentType: string;
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime: number;
  nextRetryTime: number;
}

// ── Configuration ────────────────────────────────────────────

const FAILURE_THRESHOLD = 3;       // Failures before opening circuit
const RESET_WINDOW_MS = 60_000;    // 60 seconds to auto-close circuit
const HALF_OPEN_MAX = 1;           // Allow 1 probe request in half-open

// ── State ────────────────────────────────────────────────────

const circuits = new Map<string, CircuitState>();

// Fallback chain: research↔review, code↔research, test↔code, review↔test
const FALLBACK_CHAIN: Record<string, string> = {
  research: "review",
  code: "research",
  test: "code",
  review: "test",
};

// ── Circuit Breaker Logic ────────────────────────────────────

/**
 * Get or create circuit state for an agent type.
 */
export function getCircuitState(agentType: string): CircuitState {
  let circuit = circuits.get(agentType);
  if (!circuit) {
    circuit = {
      agentType,
      state: "closed",
      failureCount: 0,
      lastFailureTime: 0,
      nextRetryTime: 0,
    };
    circuits.set(agentType, circuit);
  }
  return circuit;
}

/**
 * Record a successful call — reset circuit to closed.
 */
export function recordSuccess(agentType: string): void {
  const circuit = getCircuitState(agentType);
  circuit.failureCount = 0;
  circuit.state = "closed";
  circuit.lastFailureTime = 0;
  circuit.nextRetryTime = 0;
}

/**
 * Record a failed call — increment failure count, open circuit if threshold met.
 */
export function recordFailure(agentType: string): void {
  const circuit = getCircuitState(agentType);
  circuit.failureCount++;
  circuit.lastFailureTime = Date.now();

  if (circuit.failureCount >= FAILURE_THRESHOLD) {
    circuit.state = "open";
    circuit.nextRetryTime = Date.now() + RESET_WINDOW_MS;
  } else if (circuit.state === "half-open") {
    circuit.state = "open";
    circuit.nextRetryTime = Date.now() + RESET_WINDOW_MS;
  }
}

/**
 * Check if an agent type is available (circuit is not open).
 * Transitions to half-open if reset window has elapsed.
 */
export function isAvailable(agentType: string): boolean {
  const circuit = getCircuitState(agentType);

  if (circuit.state === "closed") return true;

  if (circuit.state === "open") {
    // Check if reset window has elapsed
    if (Date.now() >= circuit.nextRetryTime) {
      circuit.state = "half-open";
      return true; // Allow one probe request
    }
    return false;
  }

  // half-open: allow limited requests
  return true;
}

/**
 * Get the fallback agent type for a primary agent.
 * Returns null if no fallback available.
 */
export function getFallbackAgent(primaryType: string): string | null {
  // First try the defined fallback chain
  const fallback = FALLBACK_CHAIN[primaryType];
  if (fallback && isAvailable(fallback)) {
    return fallback;
  }

  // Then try any available agent
  for (const endpoint of AGENT_ENDPOINTS) {
    if (endpoint.type !== primaryType && isAvailable(endpoint.type)) {
      return endpoint.type;
    }
  }

  return null;
}

/**
 * Get the URL for a fallback agent type.
 */
export function getFallbackUrl(agentType: string): string | null {
  const endpoint = AGENT_ENDPOINTS.find((e) => e.type === agentType);
  if (!endpoint) return null;
  return `${endpoint.baseUrl}${endpoint.apiPath}`;
}

/**
 * Execute a function with automatic retry and fallback.
 * Retries up to maxRetries times, then falls back to next agent.
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  agentType: string,
  maxRetries: number = 2,
): Promise<{ result: T; usedAgent: string; retries: number; fallbackUsed: boolean }> {
  // Check circuit breaker
  if (!isAvailable(agentType)) {
    const fallback = getFallbackAgent(agentType);
    if (fallback) {
      console.log(`   🔄 Circuit open for ${agentType}, falling back to ${fallback}`);
      const result = await fn();
      return { result, usedAgent: fallback, retries: 0, fallbackUsed: true };
    }
    // No fallback available — try anyway (last resort)
    console.log(`   ⚠️  No fallback available for ${agentType}, attempting anyway`);
  }

  let lastError: Error | null = null;
  let retries = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      recordSuccess(agentType);
      return { result, usedAgent: agentType, retries, fallbackUsed: false };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;
      recordFailure(agentType);

      if (attempt < maxRetries) {
        const backoff = 1000 * Math.pow(2, attempt);
        console.log(`   ⏳ Retry ${attempt + 1}/${maxRetries} for ${agentType} in ${backoff}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  // All retries exhausted — try fallback
  const fallback = getFallbackAgent(agentType);
  if (fallback && fallback !== agentType) {
    console.log(`   🔄 All retries exhausted for ${agentType}, falling back to ${fallback}`);
    try {
      const result = await fn();
      recordSuccess(fallback);
      return { result, usedAgent: fallback, retries, fallbackUsed: true };
    } catch (fallbackError) {
      recordFailure(fallback);
      throw fallbackError;
    }
  }

  throw lastError || new Error(`All retries and fallbacks exhausted for ${agentType}`);
}

/**
 * Get the current state of all circuit breakers.
 */
export function getCircuitBreakerStates(): CircuitState[] {
  return AGENT_ENDPOINTS.map((e) => getCircuitState(e.type));
}
