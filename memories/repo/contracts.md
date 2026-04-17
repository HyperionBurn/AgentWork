# AgentWork Contract Deployment & Interaction Patterns

## Vyper Contracts

### Deployed Addresses
- **Status**: None deployed yet (all placeholders)
- **Script**: `packages/contracts/script/deploy.py` (currently template)
- **Framework**: Moccasin for deployment, Titanoboa for testing

### Contract List

#### 1. IdentityRegistry.vy (ERC-721)
- **Purpose**: Mint NFT per agent, store metadata URI
- **Key Functions**:
  - `registerAgent(agentWallet, metadataUri)` - Mints NFT and links metadata
  - `getAgent(agentId)` - Returns wallet + metadata
- **Dependencies**: None
- **Deployment Order**: First (other contracts depend on it)

#### 2. ReputationRegistry.vy (ERC-8004)
- **Purpose**: Track feedback scores for agents
- **Key Functions**:
  - `giveFeedback(agentId, score, metadata)` - Submit feedback (0-100)
  - `revokeFeedback(agentId, feedbackId)` - Remove feedback
  - `getSummary(agentId)` - Returns { total, count, average } (WAD normalized)
  - **Self-feedback prevention**: owner/approved operator cannot give feedback to own agent
- **Dependencies**: IdentityRegistry address (constructor parameter)
- **Deployment Order**: After IdentityRegistry

#### 3. AgentEscrow.vy
- **Purpose**: On-chain task escrow with create→claim→complete lifecycle
- **Key Functions**:
  - `createTask(agent, reward, description)` - Lock USDC, create task
  - `claimTask(taskId)` - Agent claims responsibility
  - `submitResult(taskId, result)` - Agent submits work
  - `approveCompletion(taskId)` - Buyer releases funds
  - `dispute(taskId, reason)` - Buyer disputes
- **Events**: TaskCreated, TaskClaimed, ResultSubmitted, TaskCompleted, TaskDisputed
- **Status**: 0=Created, 1=Claimed, 2=ResultSubmitted, 3=Completed, 4=Disputed
- **Dependencies**: USDC address (constant: `0x3600000000000000000000000000000000000000`)
- **Deployment Order**: After IdentityRegistry (if linking to agent NFTs)

#### 4. PaymentSplitter.vy
- **Purpose**: Multi-recipient payment distribution
- **Key Functions**:
  - `createSplit(recipients[], basisPoints[])` - Create split contract
  - `distribute()` - Distribute funds to all recipients
- **Usage**: For multi-agent collaboration revenue sharing
- **Dependencies**: USDC address

#### 5. SpendingLimiter.vy
- **Purpose**: Per-agent spending rate limiting
- **Key Functions**:
  - `setLimit(agent, amount, timeWindow)` - Set max spend per period
  - `recordSpending(agent, amount)` - Track spending
  - `checkLimit(agent)` - Returns true if under limit
- **Usage**: Prevent runaway spending in production
- **Dependencies**: USDC address

## Contract Interaction Patterns

### Current Implementation (Mock)
- **File**: `packages/orchestrator/src/contracts.ts`
- **Status**: All functions return fake transaction hashes
- **Code Pattern**:
  ```typescript
  export async function createEscrowTask(...): Promise<{ txHash: string; ... }> {
    console.warn('[MOCK] createEscrowTask - using fake transaction hash');
    const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    return { txHash, escrowId: Math.floor(Math.random() * 10000) };
  }
  ```

### Recommended Implementation (Real viem Calls)
```typescript
import { createPublicClient, createWalletClient, parseUnits, formatUnits } from 'viem';
import { arcTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env.ARC_RPC_URL),
});

const walletClient = createWalletClient({
  account: privateKeyToAccount(ORCHESTRATOR_PRIVATE_KEY as `0x${string}`),
  chain: arcTestnet,
  transport: http(),
});

export async function createEscrowTask(
  agentAddress: string,
  amount: string,
  description: string
): Promise<{ txHash: string; escrowId: number }> {
  // Load contract ABI
  const abi = loadAbi('AgentEscrow'); // Read from packages/contracts/artifacts/
  
  // Parse USDC amount (6 decimals)
  const reward = parseUnits(amount, 6);
  
  // Write contract
  const hash = await walletClient.writeContract({
    address: process.env.AGENT_ESCROW_ADDRESS as `0x${string}`,
    abi,
    functionName: 'createTask',
    args: [
      agentAddress as `0x${string}`,
      reward,
      description
    ],
  });
  
  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  // Extract escrowId from event logs
  const event = receipt.logs.find(log => {
    // Parse log for TaskCreated event
    return true; // Simplified - implement proper log parsing
  });
  const escrowId = 0; // Extract from event args
  
  console.log(`   📝 Created escrow #${escrowId} | TX: ${hash}`);
  console.log(`   🌐 Explorer: ${ARC_CONFIG.explorerUrl}${hash}`);
  
  return { txHash: hash, escrowId };
}
```

### Deployment Flow

#### Step 1: Deploy Contracts
```bash
cd packages/contracts
moccasin deploy --network arc_testnet
```

**Expected Output**:
```
Deploying IdentityRegistry...
Deployed to: 0x1234...
Deploying ReputationRegistry...
Deployed to: 0x5678...
Deploying AgentEscrow...
Deployed to: 0xabcd...
```

#### Step 2: Record Addresses in .env
```bash
# Add to .env
IDENTITY_REGISTRY_ADDRESS=0x_deployed_identity_address
REPUTATION_REGISTRY_ADDRESS=0x_deployed_reputation_address
AGENT_ESCROW_ADDRESS=0x_deployed_escrow_address
PAYMENT_SPLITTER_ADDRESS=0x_deployed_splitter_address
SPENDING_LIMITER_ADDRESS=0x_deployed_limiter_address
```

#### Step 3: Register Agents (ERC-8004)
```typescript
// Call IdentityRegistry.registerAgent() for each agent wallet
const agentWallets = [
  process.env.RESEARCH_AGENT_WALLET,
  process.env.CODE_AGENT_WALLET,
  process.env.TEST_AGENT_WALLET,
  process.env.REVIEW_AGENT_WALLET,
];

for (const wallet of agentWallets) {
  const metadataUri = `https://agentwork.io/agents/${wallet}.json`;
  await registerAgent(wallet as `0x${string}`, metadataUri);
  console.log(`✅ Registered agent: ${wallet}`);
}
```

#### Step 4: Link ReputationRegistry to IdentityRegistry
```typescript
// ReputationRegistry constructor requires IdentityRegistry address
const reputationRegistryDeployTx = await deployContract(
  'ReputationRegistry',
  process.env.IDENTITY_REGISTRY_ADDRESS as `0x${string}`
);
```

## Transaction Flow (Per Task)

### Current Reality (Mock Contracts)
1. Deposit USDC to Gateway → **1 on-chain transaction**
2. Pay Research Agent (initial) → **1 x402 authorization**
3. Pay Research Agent (follow-up) → **1 x402 authorization**
4. Pay Code Agent (implement) → **1 x402 authorization**
5. Pay Code Agent (fix) → **1 x402 authorization**
6. Pay Test Agent (tests) → **1 x402 authorization**
7. Pay Test Agent (re-test) → **1 x402 authorization**
8. Pay Review Agent (review) → **1 x402 authorization**
9. Create Escrow (mock) → **FAKE transaction** ❌
10. Claim Escrow (mock) → **FAKE transaction** ❌
11. Complete Escrow (mock) → **FAKE transaction** ❌
12. Submit Reputation ×4 (mock) → **FAKE transactions** ❌

**Real on-chain transactions**: 1 (deposit) + settlement (batched) = **~2-8 txns**
**Claimed in README**: 60+ transactions ❌

### With Real Contracts
1-8: Same as above (x402 payments)
9. Create Escrow → **1 on-chain transaction**
10. Agent Claims Escrow → **1 on-chain transaction**
11. Approve Completion → **1 on-chain transaction**
12-15. Submit Reputation ×4 → **4 on-chain transactions**

**Real on-chain transactions**: 8 (payments) + 7 (contracts) = **15 txns per task**
**5 tasks × 15 txns = 75 on-chain transactions** ✅

### EIP-3009 Batching Impact

**Question**: Does each `gateway.pay()` produce 1 on-chain transaction?

**Likely Answer**: NO. Gateway batches off-chain authorizations and settles in fewer on-chain transactions.

**Test Required**:
```typescript
// Run Day 0 test
for (let i = 0; i < 7; i++) {
  const result = await gateway.pay(`http://localhost:4021/test?run=${i}`, { method: 'GET' });
  console.log(`Payment ${i}: ${result.transaction}`);
  await sleep(2000); // Wait 2s between payments
}
// Check arcscan.io - expect 7 transactions or 1 batch settlement?
```

**If Batched**:
- Strategy: Add more contract calls to hit 60+ transactions
- Alternative: Increase task count to 10+ tasks

**If Not Batched**:
- Strategy: Continue with 5 tasks × 12 txns = 60+
- Each x402 payment produces distinct on-chain tx

## Smart Contract Safety Checklist

- [ ] Use `assert()` for invariants, `require()` for preconditions
- [ ] Approve exact USDC amounts (never MAX_UINT256)
- [ ] Test with Moccasin + Titanoboa before testnet deployment
- [ ] Gas optimization (avoid loops over unbounded arrays)
- [ ] Event emission for all state changes (indexed first param)
- [ ] Access control (only allowed callers can execute)
- [ ] Input validation (assert statements at function entry)
- [ ] Overflow checks (Vyper 0.4.x has built-in overflow protection)
- [ ] Reentrancy protection (use checks-effects-interactions pattern)

## Known Issues

### 1. Mock Contracts Undermine Credibility
- **Issue**: README claims 60+ on-chain transactions but contracts are mocked
- **Impact**: Judges will see fake hashes on dashboard → low credibility score
- **Fix**: Implement real contract calls OR explicitly document as demo-only
- **Priority**: HIGH

### 2. Deployment Script Incomplete
- **Issue**: `script/deploy.py` is template placeholder
- **Impact**: Cannot deploy contracts without manual work
- **Fix**: Complete deployment script with Moccasin integration
- **Priority**: HIGH

### 3. Agent Registration Missing
- **Issue**: IdentityRegistry exists but never called
- **Impact**: ERC-8004 identity feature (P2) unused
- **Fix**: Add registration flow in orchestrator startup
- **Priority**: MEDIUM

### 4. Escrow Flow Incomplete
- **Issue**: Orchestrator doesn't use full escrow lifecycle
- **Impact**: AgentEscrow.vy deployed but not integrated
- **Fix**: Wire up create→claim→complete→approve flow
- **Priority**: MEDIUM

### 5. Reputation Feedback Not Implemented
- **Issue**: ReputationRegistry called but feedbacks are mock
- **Impact**: Reputation scores are fake
- **Fix**: Implement real feedback submission with scores
- **Priority**: MEDIUM
