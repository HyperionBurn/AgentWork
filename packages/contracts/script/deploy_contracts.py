"""
AgentWork — Deploy Script Implementation
Uses moccasin framework to deploy contracts to Arc testnet.

Deploy order (per AGENTS.md §10.6):
  1. IdentityRegistry  — ERC-721 agent identity, no constructor args
  2. ReputationRegistry — depends on IdentityRegistry address
  3. AgentEscrow       — task escrow, no constructor args
  4. PaymentSplitter   — revenue splits, no constructor args
  5. SpendingLimiter   — per-agent rate limits, no constructor args

Usage:
    moccasin run script/deploy.py --network arc_testnet
    moccasin run script/deploy.py --network local        # titanoboa fork
"""

from moccasin.boa_tools import AnvilAbiFork


def deploy_all() -> dict:
    """
    Deploy all AgentWork contracts and return their addresses.
    Each deployment logs the tx hash so we can verify on arcscan.
    """
    print("\n  📦 Deploying IdentityRegistry …")
    identity = AnvilAbiFork("src/IdentityRegistry.vy").deploy()
    print(f"     ✅ IdentityRegistry  → {identity.address}")

    print("  📦 Deploying ReputationRegistry (needs IdentityRegistry) …")
    reputation = AnvilAbiFork("src/ReputationRegistry.vy").deploy(
        identity.address,
    )
    print(f"     ✅ ReputationRegistry → {reputation.address}")

    print("  📦 Deploying AgentEscrow …")
    escrow = AnvilAbiFork("src/AgentEscrow.vy").deploy()
    print(f"     ✅ AgentEscrow       → {escrow.address}")

    print("  📦 Deploying PaymentSplitter …")
    splitter = AnvilAbiFork("src/PaymentSplitter.vy").deploy()
    print(f"     ✅ PaymentSplitter   → {splitter.address}")

    print("  📦 Deploying SpendingLimiter …")
    limiter = AnvilAbiFork("src/SpendingLimiter.vy").deploy()
    print(f"     ✅ SpendingLimiter   → {limiter.address}")

    return {
        "identity": identity.address,
        "reputation": reputation.address,
        "escrow": escrow.address,
        "splitter": splitter.address,
        "limiter": limiter.address,
    }
