"""
AgentWork — Contract Deployment Script
Deploys all Vyper contracts to Arc testnet.

Usage:
    moccasin run script/deploy.py --network arc_testnet
    # or for local testing:
    moccasin run script/deploy.py --network local
"""

import os
from scripts.deploy_contracts import deploy_all


def main():
    print("=" * 60)
    print("  AgentWork — Contract Deployment")
    print("  Chain: Arc Testnet (Chain ID: 5042002)")
    print("=" * 60)

    results = deploy_all()

    print("\n" + "=" * 60)
    print("  Deployment Complete!")
    print("=" * 60)
    print(f"\n  IdentityRegistry:  {results['identity']}")
    print(f"  ReputationRegistry: {results['reputation']}")
    print(f"  AgentEscrow:        {results['escrow']}")
    print(f"  PaymentSplitter:    {results['splitter']}")
    print(f"  SpendingLimiter:    {results['limiter']}")

    # Update .env with deployed addresses
    env_updates = {
        "IDENTITY_REGISTRY_ADDRESS": results["identity"],
        "REPUTATION_REGISTRY_ADDRESS": results["reputation"],
        "AGENT_ESCROW_ADDRESS": results["escrow"],
        "PAYMENT_SPLITTER_ADDRESS": results["splitter"],
        "SPENDING_LIMITER_ADDRESS": results["limiter"],
    }

    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    if os.path.exists(env_path):
        print(f"\n  ✅ Add these to your .env file:")
        for key, value in env_updates.items():
            print(f"     {key}={value}")
    else:
        print(f"\n  ✅ Create .env from .env.example and add:")
        for key, value in env_updates.items():
            print(f"     {key}={value}")

    print(f"\n  Explorer: https://testnet.arcscan.io")
    print("=" * 60)
