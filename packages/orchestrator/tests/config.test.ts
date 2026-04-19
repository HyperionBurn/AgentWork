import { describe, it, expect, vi } from "vitest";

// ============================================================
// Config Tests — Feature flags and constants (#8)
// ============================================================

vi.stubEnv("USE_PARALLEL", "true");
vi.stubEnv("USE_REAL_LLM", "false");
vi.stubEnv("USE_LLM_DECOMPOSER", "false");

const { ARC_CONFIG, AGENT_ENDPOINTS, FEATURES, CONTRACT_ADDRESSES } =
  await import("../src/config");

describe("config", () => {
  it("has correct Arc chain constants", () => {
    expect(ARC_CONFIG.chainId).toBe(5042002);
    expect(ARC_CONFIG.rpcUrl).toBe("https://rpc.testnet.arc.network");
    expect(ARC_CONFIG.usdc).toBe(
      "0x3600000000000000000000000000000000000000",
    );
    expect(ARC_CONFIG.gateway).toBe(
      "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
    );
  });

  it("has 4 agent endpoints", () => {
    expect(AGENT_ENDPOINTS).toHaveLength(4);
    const types = AGENT_ENDPOINTS.map((a) => a.type);
    expect(types).toContain("research");
    expect(types).toContain("code");
    expect(types).toContain("test");
    expect(types).toContain("review");
  });

  it("has feature flags with correct defaults", () => {
    expect(typeof FEATURES.useParallel).toBe("boolean");
    expect(typeof FEATURES.useRealLLM).toBe("boolean");
    expect(typeof FEATURES.useLLMDecomposer).toBe("boolean");
  });

  it("contract addresses default to empty strings", () => {
    expect(CONTRACT_ADDRESSES.agentEscrow).toBe("");
    expect(CONTRACT_ADDRESSES.identityRegistry).toBe("");
  });

  it("agents have correct ports", () => {
    const ports = AGENT_ENDPOINTS.map((a) => a.port);
    expect(ports).toContain(4021);
    expect(ports).toContain(4022);
    expect(ports).toContain(4023);
    expect(ports).toContain(4024);
  });
});
