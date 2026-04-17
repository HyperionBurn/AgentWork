# AgentWork — Vyper Smart Contracts

Contracts forked from verified sources:
- `vyperlang/vyper-agentic-payments` — AgentEscrow, PaymentSplitter, SpendingLimiter
- `vyperlang/erc-8004-vyper` — IdentityRegistry, ReputationRegistry

## Setup

Requires [Moccasin](https://github.com/Vyperlang/moccasin) (Vyper testing framework):

```bash
pip install moccasin snekmate vyper

# Configuration is in moccasin.toml (networks, dependencies, paths)
# See moccasin.toml for arc_testnet network settings

moccasin install  # Install dependencies from moccasin.toml
moccasin test     # Run all tests (uses titanoboa locally)
```

## Deploy

```bash
moccasin run script/deploy.py --network arc_testnet
```

## Contract Overview

| Contract | Purpose | Priority |
|----------|---------|----------|
| AgentEscrow.vy | On-chain task escrow (create → claim → complete → dispute) | P1 |
| PaymentSplitter.vy | Split payments across multiple recipients | P1 |
| SpendingLimiter.vy | Rate-limit agent spending per time window | P2 |
| IdentityRegistry.vy | ERC-721 agent identity NFTs with metadata | P2 |
| ReputationRegistry.vy | On-chain reputation scoring (giveFeedback/getSummary) | P2 |
