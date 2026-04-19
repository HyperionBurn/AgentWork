"""
AgentWork - Deploy Script Implementation
Uses titanoboa to deploy Vyper contracts to Arc testnet.

Deploy order:
  1. IdentityRegistry  - no constructor args
  2. ReputationRegistry - depends on IdentityRegistry address
  3. AgentEscrow       - no constructor args
  4. PaymentSplitter   - no constructor args
  5. SpendingLimiter   - no constructor args

Usage:
    python script/deploy_contracts.py
"""

import os
import sys
from pathlib import Path

# Ensure project root is cwd so relative paths resolve
os.chdir(Path(__file__).resolve().parent.parent)

# Load .env manually (don't depend on moccasin for this)
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

import boa


def deploy_all() -> dict:
    """
    Deploy all AgentWork contracts and return their addresses.
    """
    print("\n  Deploying IdentityRegistry ...")
    identity = boa.load("src/IdentityRegistry.vy")
    print(f"     IdentityRegistry  -> {identity.address}")

    print("  Deploying ReputationRegistry (needs IdentityRegistry) ...")
    reputation = boa.load("src/ReputationRegistry.vy", identity.address)
    print(f"     ReputationRegistry -> {reputation.address}")

    print("  Deploying AgentEscrow ...")
    escrow = boa.load("src/AgentEscrow.vy")
    print(f"     AgentEscrow       -> {escrow.address}")

    print("  Deploying PaymentSplitter ...")
    splitter = boa.load("src/PaymentSplitter.vy")
    print(f"     PaymentSplitter   -> {splitter.address}")

    print("  Deploying SpendingLimiter ...")
    limiter = boa.load("src/SpendingLimiter.vy")
    print(f"     SpendingLimiter   -> {limiter.address}")

    return {
        "identity": identity.address,
        "reputation": reputation.address,
        "escrow": escrow.address,
        "splitter": splitter.address,
        "limiter": limiter.address,
    }


def moccasin_main() -> dict:
    """Entry point for mox run."""
    return _run_deploy()


def _run_deploy() -> dict:
    print("=" * 60)
    print("  AgentWork - Contract Deployment")
    print("  Chain: Arc Testnet (Chain ID: 5042002)")
    print("=" * 60)

    results = deploy_all()

    print("\n" + "=" * 60)
    print("  Deployment Complete!")
    print("=" * 60)
    print(f"\n  IdentityRegistry:   {results['identity']}")
    print(f"  ReputationRegistry: {results['reputation']}")
    print(f"  AgentEscrow:        {results['escrow']}")
    print(f"  PaymentSplitter:    {results['splitter']}")
    print(f"  SpendingLimiter:    {results['limiter']}")

    print(f"\n  Add these to your .env file:")
    env_vars = {
        "IDENTITY_REGISTRY_ADDRESS": results["identity"],
        "REPUTATION_REGISTRY_ADDRESS": results["reputation"],
        "AGENT_ESCROW_ADDRESS": results["escrow"],
        "PAYMENT_SPLITTER_ADDRESS": results["splitter"],
        "SPENDING_LIMITER_ADDRESS": results["limiter"],
    }
    for key, value in env_vars.items():
        print(f"     {key}={value}")

    print(f"\n  Explorer: https://testnet.arcscan.io")
    print("=" * 60)

    return results


if __name__ == "__main__":
    # Standalone mode: set up Arc testnet connection directly via boa
    from eth_account import Account as EthAccount

    rpc_url = os.environ.get("ARC_RPC_URL", "https://rpc.testnet.arc.network")
    private_key = os.environ.get("ORCHESTRATOR_PRIVATE_KEY", "")

    if not private_key:
        print("ERROR: ORCHESTRATOR_PRIVATE_KEY not set in .env")
        sys.exit(1)

    print(f"  RPC: {rpc_url}")
    boa.set_network_env(rpc_url)
    account = EthAccount.from_key(private_key)
    boa.env.add_account(account, force_eoa=True)
    print(f"  Deployer: {boa.env.eoa}")

    _run_deploy()
