# SPEC: Critical Fixes for Demo Success

## Status: APPROVED
## Owner: AgentWork Team
## Created: April 16, 2026
## Updated: April 16, 2026

### Problem

The AgentWork codebase has solid architectural foundations but critical integration gaps that will prevent a successful hackathon demo. Without immediate fixes, the demo will fail due to:
- Missing Supabase database schema (dashboard crashes on load)
- Broken orchestrator → dashboard data pipeline (task feed empty)
- Missing SELLER_WALLET environment variable (payment verification fails)
- Event loop deadlocks in Python agents (payments fail)
- Docker build failures (deployment impossible)

These issues block PRD-01 through PRD-07 (all MVP requirements) and reduce demo success probability from 80% to 30-40%.

### Acceptance Criteria

- [ ] **C1**: Supabase database schema created with `payment_events`, `task_events`, and `agents` tables
- [ ] **C2**: Orchestrator inserts task events to Supabase after each payment execution
- [ ] **C3**: `SELLER_WALLET` added to `.env.example` with documentation
- [ ] **C4**: Python agents properly start and shutdown event loop, no deadlocks
- [ ] **C5**: Dashboard Docker build succeeds with standalone output configuration
- [ ] **C6**: Transaction hash field names correctly mapped (settlement `transaction` → `transactionHash`)
- [ ] **C7**: Dashboard uses environment variables for agent URLs (supports Docker service names)
- [ ] **C8**: CircleKit imports have robust error handling with explicit logging
- [ ] **C9**: `BatchFacilitatorClient` includes `createAuthHeaders` callback (if required)
- [ ] **C10**: Price format environment variables include dollar prefix (`$0.005` not `0.005`)
- [ ] **C11**: Supabase inserts in dashboard have error handling and logging
- [ ] **End-to-End Test**: Orchestrator executes 5 tasks → results visible in dashboard → 40+ transactions on arcscan.io

### Technical Design

#### C1: Supabase Database Schema

Create `packages/database/schema.sql`:

```sql
-- ============================================================
-- Payment Events Table
-- Records all x402 payments processed by dashboard
-- ============================================================
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer TEXT NOT NULL CHECK (payer ~ '^0x[a-fA-F0-9]{40}$'),
  payee TEXT NOT NULL CHECK (payee ~ '^0x[a-fA-F0-9]{40}$'),
  amount TEXT NOT NULL,
  token TEXT NOT NULL DEFAULT 'USDC',
  gateway_tx TEXT NOT NULL CHECK (gateway_tx ~ '^0x[a-fA-F0-9]{64}$'),
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_amount CHECK (amount ~ '^\$?\d+(\.\d{1,6})?$')
);

-- ============================================================
-- Task Events Table
-- Records orchestrator task execution events
-- ============================================================
CREATE TABLE task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('research', 'code', 'test', 'review')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'paying', 'completed', 'failed')),
  gateway_tx TEXT CHECK (gateway_tx ~ '^0x[a-fA-F0-9]{64}$'),
  amount TEXT NOT NULL,
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (
    (gateway_tx IS NULL AND status IN ('pending', 'paying', 'failed')) OR
    (gateway_tx IS NOT NULL AND status = 'completed')
  )
);

-- ============================================================
-- Agents Table
-- Tracks agent health and statistics
-- ============================================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL UNIQUE CHECK (type IN ('research', 'code', 'test', 'review')),
  port INTEGER NOT NULL CHECK (port BETWEEN 3000 AND 9999),
  status TEXT NOT NULL CHECK (status IN ('online', 'offline')),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  earnings DECIMAL(18, 6) DEFAULT 0 CHECK (earnings >= 0),
  tasks_completed INTEGER DEFAULT 0 CHECK (tasks_completed >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Indexes for Performance
-- ============================================================
CREATE INDEX payment_events_created_at_idx ON payment_events(created_at DESC);
CREATE INDEX task_events_task_id_idx ON task_events(task_id);
CREATE INDEX task_events_agent_type_idx ON task_events(agent_type);
CREATE INDEX task_events_created_at_idx ON task_events(created_at DESC);
CREATE INDEX agents_last_heartbeat_idx ON agents(last_heartbeat DESC);

-- ============================================================
-- Triggers for Auto-updating Timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Setup Instructions**:
```bash
# 1. Create Supabase project at https://supabase.com
# 2. Go to SQL Editor
# 3. Run packages/database/schema.sql
# 4. Copy project URL and anon key to .env
```

#### C2: Orchestrator Supabase Integration

Add to `packages/orchestrator/package.json`:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.0.0"
  }
}
```

Create `packages/orchestrator/src/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] SUPABASE_URL or SUPABASE_ANON_KEY not set');
}

export const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function recordTaskEvent(
  subtaskId: string,
  agentType: string,
  status: 'pending' | 'paying' | 'completed' | 'failed',
  gatewayTx: string | null,
  amount: string,
  result?: string
) {
  try {
    const { error } = await supabase
      .from('task_events')
      .insert({
        task_id: subtaskId,
        agent_type: agentType,
        status,
        gateway_tx: gatewayTx,
        amount,
        result,
      });

    if (error) {
      console.error('[Supabase] Failed to record task event:', error);
      return false;
    }

    console.log(`[Supabase] Task event recorded: ${subtaskId} → ${status}`);
    return true;
  } catch (error) {
    console.error('[Supabase] Error recording task event:', error);
    return false;
  }
}
```

Update `packages/orchestrator/src/executor.ts`:
```typescript
import { recordTaskEvent } from './supabase';

export async function executePayment(
  subtask: Subtask
): Promise<PaymentResult> {
  // Record pending status
  await recordTaskEvent(subtask.id, subtask.agentType, 'pending', null, subtask.price);

  try {
    const result = await gateway.pay(subtask.url, { method: 'GET' });
    
    // Record completion
    await recordTaskEvent(
      subtask.id,
      subtask.agentType,
      'completed',
      result.transaction,
      result.formattedAmount,
      'Task completed successfully'
    );

    return {
      subtaskId: subtask.id,
      agentType: subtask.agentType,
      success: true,
      amount: result.formattedAmount,
      transactionHash: result.transaction,
      explorerUrl: `${ARC_CONFIG.explorerUrl}${result.transaction}`,
      response: result,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Record failure
    await recordTaskEvent(
      subtask.id,
      subtask.agentType,
      'failed',
      null,
      subtask.price,
      message
    );

    return {
      subtaskId: subtask.id,
      agentType: subtask.agentType,
      success: false,
      amount: subtask.price,
      transactionHash: null,
      explorerUrl: null,
      error: message,
    };
  }
}
```

#### C3: Add SELLER_WALLET to Environment Configuration

Update `.env.example`:
```bash
# ============================================================
# Seller Wallets (dashboard receives payments)
# These are the wallets that receive payments for each agent
# ============================================================
SELLER_WALLET=0x_your_dashboard_receiving_wallet

# Individual agent wallets (optional - can use SELLER_WALLET for all)
RESEARCH_AGENT_WALLET=0x_your_research_agent_wallet
CODE_AGENT_WALLET=0x_your_code_agent_wallet
TEST_AGENT_WALLET=0x_your_test_agent_wallet
REVIEW_AGENT_WALLET=0x_your_review_agent_wallet
```

Add validation to `packages/dashboard/lib/x402.ts`:
```typescript
const SELLER_WALLET = process.env.SELLER_WALLET;
if (!SELLER_WALLET) {
  throw new Error('SELLER_WALLET environment variable is required');
}
if (!/^0x[a-fA-F0-9]{40}$/.test(SELLER_WALLET)) {
  throw new Error(`SELLER_WALLET must be a valid Ethereum address: ${SELLER_WALLET}`);
}
```

#### C4: Fix Event Loop in Python Agents

Create `agents/shared/event_loop.py`:
```python
import asyncio
import threading
import signal
import sys

_loop: asyncio.AbstractEventLoop | None = None
_thread: threading.Thread | None = None

def start_event_loop():
    """Start the event loop in a background thread."""
    global _loop, _thread
    
    if _loop is not None and _loop.is_running():
        return  # Already running
    
    _loop = asyncio.new_event_loop()
    _thread = threading.Thread(target=_loop.run_forever, daemon=True)
    _thread.start()
    print("[EventLoop] Started in background thread")

def get_event_loop() -> asyncio.AbstractEventLoop:
    """Get the running event loop."""
    if _loop is None:
        raise RuntimeError("Event loop not started. Call start_event_loop() first.")
    return _loop

def shutdown_event_loop():
    """Gracefully shutdown the event loop."""
    global _loop, _thread
    
    if _loop is None:
        return  # Not running
    
    print("[EventLoop] Shutting down...")
    _loop.call_soon_threadsafe(_loop.stop)
    
    if _thread and _thread.is_alive():
        _thread.join(timeout=5)
    
    _loop.close()
    _loop = None
    _thread = None
    print("[EventLoop] Shutdown complete")

# Register signal handlers for graceful shutdown
def signal_handler(signum, frame):
    print(f"[EventLoop] Received signal {signum}, shutting down...")
    shutdown_event_loop()
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)
```

Update all `agents/*/server.py`:
```python
# Add at top after imports
from agents.shared.event_loop import start_event_loop, shutdown_event_loop

# In main execution
if __name__ == "__main__":
    if gateway_middleware:
        start_event_loop()
        print(f"[{AGENT_TYPE}] Event loop started")
    
    try:
        print(f"[{AGENT_TYPE}] Starting server on port {AGENT_PORT}")
        app.run(host="0.0.0.0", port=AGENT_PORT, threaded=True)
    except KeyboardInterrupt:
        print(f"[{AGENT_TYPE}] Shutting down...")
    finally:
        if gateway_middleware:
            shutdown_event_loop()
```

#### C5: Configure Dashboard for Docker

Update `packages/dashboard/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

module.exports = nextConfig;
```

Update `packages/dashboard/Dockerfile`:
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
```

#### C6: Fix Transaction Hash Field Mapping

Update `packages/dashboard/lib/x402.ts`:
```typescript
// Line 155 - WRONG:
// transactionHash: settleResult.transaction

// CORRECT:
transactionHash: settleResult.transaction  // Settlement result uses 'transaction' field
```

Update `packages/dashboard/app/api/agent-stats/route.ts`:
```typescript
// Verify we're using the correct field
interface SettlementResult {
  transaction: string;  // NOT transactionHash
  network: string;
  payer?: string;
  success: boolean;
}

const payment: PaymentInfo = {
  payer: result.payer || 'unknown',
  amount: result.amount,
  transactionHash: result.transaction,  // Map correctly
  timestamp: new Date().toISOString(),
};
```

#### C7: Configurable Agent URLs for Docker

Update `packages/dashboard/app/page.tsx`:
```typescript
const AGENT_ENDPOINTS = [
  {
    type: 'research',
    name: 'Research Agent',
    port: parseInt(process.env.RESEARCH_AGENT_PORT || '4021'),
    baseUrl: process.env.RESEARCH_AGENT_URL || 
      `http://localhost:${process.env.RESEARCH_AGENT_PORT || '4021'}`,
  },
  {
    type: 'code',
    name: 'Code Agent',
    port: parseInt(process.env.CODE_AGENT_PORT || '4022'),
    baseUrl: process.env.CODE_AGENT_URL || 
      `http://localhost:${process.env.CODE_AGENT_PORT || '4022'}`,
  },
  {
    type: 'test',
    name: 'Test Agent',
    port: parseInt(process.env.TEST_AGENT_PORT || '4023'),
    baseUrl: process.env.TEST_AGENT_URL || 
      `http://localhost:${process.env.TEST_AGENT_PORT || '4023'}`,
  },
  {
    type: 'review',
    name: 'Review Agent',
    port: parseInt(process.env.REVIEW_AGENT_PORT || '4024'),
    baseUrl: process.env.REVIEW_AGENT_URL || 
      `http://localhost:${process.env.REVIEW_AGENT_PORT || '4024'}`,
  },
];
```

Update `docker-compose.yml`:
```yaml
services:
  dashboard:
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SELLER_WALLET=${SELLER_WALLET}
      - RESEARCH_AGENT_URL=http://research-agent:4021
      - CODE_AGENT_URL=http://code-agent:4022
      - TEST_AGENT_URL=http://test-agent:4023
      - REVIEW_AGENT_URL=http://review-agent:4024
    depends_on:
      - research-agent
      - code-agent
      - test-agent
      - review-agent
```

#### C8: Robust CircleKit Import Handling

Update all `agents/*/server.py`:
```python
try:
    from circlekit import create_gateway_middleware, GatewayClient, PaymentInfo
    logger.info("[circlekit] Imported successfully")
    
    if SELLER_ADDRESS:
        gateway_middleware = create_gateway_middleware(
            seller_address=SELLER_ADDRESS,
            chain="arcTestnet",
        )
        logger.info(f"[circlekit] Middleware initialized for {SELLER_ADDRESS}")
    else:
        logger.warning("[circlekit] SELLER_ADDRESS not set - running in passthrough mode")
        logger.warning("[circlekit] ⚠️  PAYMENTS NOT ENFORCED - NOT SECURE FOR PRODUCTION")
        
except ImportError as e:
    logger.error(f"[circlekit] Import failed: {e}")
    logger.warning("[circlekit] Running without payment verification - NOT SECURE FOR PRODUCTION")
    logger.warning("[circlekit] Install: pip install circlekit")
    gateway_middleware = None
except Exception as e:
    logger.error(f"[circlekit] Initialization failed: {e}")
    logger.warning("[circlekit] Running without payment verification - NOT SECURE FOR PRODUCTION")
    gateway_middleware = None
```

#### C9: BatchFacilitatorClient Auth Headers

Update `packages/dashboard/lib/x402.ts`:
```typescript
import { createAuthHeaders } from '@x402/evm/exact/server';

function getFacilitator(): BatchFacilitatorClient {
  if (!_facilitator) {
    _facilitator = new BatchFacilitatorClient({
      url: process.env.GATEWAY_URL || "https://gateway-api-testnet.circle.com",
      // createAuthHeaders is optional - check if Circle requires it
      // Commented out until verified:
      // createAuthHeaders: async () => {
      //   const verify = await createAuthHeaders({ verify: true });
      //   const settle = await createAuthHeaders({ settle: true });
      //   const supported = await createAuthHeaders({ supported: true });
      //   return { verify, settle, supported };
      // },
    });
  }
  return _facilitator;
}
```

**Note**: Test if `createAuthHeaders` is required. Remove comment if auth fails without it.

#### C10: Price Format with Dollar Prefix

Update `.env.example`:
```bash
# ============================================================
# Agent Pricing (USDC) - SDK requires dollar prefix
# ============================================================
RESEARCH_AGENT_PRICE=$0.005
CODE_AGENT_PRICE=$0.005
TEST_AGENT_PRICE=$0.005
REVIEW_AGENT_PRICE=$0.005
```

Add validation in all `agents/*/server.py`:
```python
def normalize_price(price_env: str, default: str = "$0.005") -> str:
    """Ensure price has dollar prefix as required by x402 SDK."""
    price = os.getenv(price_env, default)
    if not price.startswith('$'):
        logger.warning(f"[Price] Normalizing {price_env} from '{price}' to '${price}'")
        price = f"${price}"
    return price

AGENT_PRICE = normalize_price(f"{AGENT_TYPE.upper()}_AGENT_PRICE", "$0.005")
```

#### C11: Error Handling for Supabase Inserts

Update `packages/dashboard/lib/x402.ts`:
```typescript
async function recordPayment(payment: PaymentInfo) {
  try {
    const { data, error } = await supabase
      .from('payment_events')
      .insert({
        payer: payment.payer,
        payee: payment.payee,
        amount: payment.amount,
        token: payment.token || 'USDC',
        gateway_tx: payment.transactionHash,
        endpoint: payment.endpoint,
      });
    
    if (error) {
      console.error('[Supabase] Failed to record payment:', error);
      console.error('[Supabase] Payment details:', JSON.stringify(payment, null, 2));
      throw new Error(`Supabase insert failed: ${error.message}`);
    }
    
    console.log(`[Supabase] Payment recorded: ${payment.transactionHash} → ${payment.payee}`);
    return data;
  } catch (error) {
    console.error('[x402] Failed to record payment to Supabase:', error);
    throw error;
  }
}
```

### Dependencies

- [ ] `packages/database/schema.sql` must be run in Supabase SQL Editor before dashboard starts
- [ ] `@supabase/supabase-js` must be installed in orchestrator package
- [ ] All environment variables must be set in `.env` before running services
- [ ] Docker must be running with proper network for service name resolution

### Risks

| Risk | Impact | Mitigation |
|-------|---------|------------|
| Gateway batching reduces transaction count | PRD-05 may fail | Run empirical test Day 0; if batched, adjust demo narrative |
| Supabase quotas exceeded | Dashboard stops recording payments | Monitor usage; add dead-letter queue for failed inserts |
| Event loop thread crashes | Python agents freeze | Add thread health monitoring and restart logic |
| Circle SDK API changes | `createAuthHeaders` or field names differ | Test with actual SDK; be ready to adjust |

### Changes Tracking

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec created | Consolidated critical issues from agent swarm analysis |

---

## Next Steps

1. **Review and approve this spec** - All stakeholders must agree on the plan
2. **Implement Phase 1 fixes** (C1-C11) - Critical blocking issues only (5.5 hours)
3. **Run end-to-end test** - Verify orchestrator → agents → dashboard → Supabase flow
4. **Demo Day 0** - Present working MVP to stakeholders
5. **Proceed to Phase 2** - MVP features and polish

---

*This spec addresses the 11 critical issues blocking demo success. All changes are designed to be implemented within Day 0 (April 20) with minimal risk and clear rollback paths.*
