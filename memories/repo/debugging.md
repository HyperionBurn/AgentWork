# AgentWork Common Debugging Issues

## Issue: Orchestrator Results Not Visible in Dashboard

### Symptoms
- Dashboard shows empty task feed after orchestrator runs
- `/api/task-status` returns empty array
- Console logs show payments succeeded but no data in UI

### Root Cause
Orchestrator never writes to Supabase `task_events` table. Dashboard polls table but it's empty.

### Investigation Steps
1. Check Supabase task_events table: `SELECT * FROM task_events LIMIT 10;`
2. Check orchestrator code for Supabase calls: `grep -r "task_events" packages/orchestrator/`
3. Check dashboard API route: `SELECT * FROM task_events ORDER BY created_at DESC LIMIT 100;`

### Fix
Add Supabase client to orchestrator:
```typescript
// packages/orchestrator/package.json
"dependencies": {
  "@supabase/supabase-js": "^2.0.0"
}

// packages/orchestrator/src/supabase.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// packages/orchestrator/src/executor.ts
import { supabase } from './supabase';

await supabase.from('task_events').insert({
  task_id: subtaskId,
  agent_type: agentType,
  status: 'completed',
  gateway_tx: txHash,
  amount: amount,
});
```

### Verification
```bash
# Run orchestrator
cd packages/orchestrator && npm start

# Check Supabase
# Go to Supabase Dashboard → Table Editor → task_events

# Refresh dashboard
# Should show task events now
```

---

## Issue: Python Agents Hang on Payment Requests

### Symptoms
- `/api/research` (or other endpoints) hangs indefinitely
- No response to curl requests
- Agent logs show no errors

### Root Cause
Event loop created but never started. `asyncio.run_coroutine_threadsafe()` requires actively running loop.

### Investigation Steps
```python
# Add debug logging to agents/research-agent/server.py
print(f"Event loop: {_loop}")
print(f"Loop running: {_loop and _loop.is_running()}")

# Call payment endpoint
curl http://localhost:4021/api/research?topic=test

# Check if thread started
# Should see "Event loop started" in logs
```

### Fix
Implement proper event loop lifecycle:
```python
# agents/shared/event_loop.py
import asyncio
import threading

_loop = asyncio.new_event_loop()
_thread = threading.Thread(target=_loop.run_forever, daemon=True)
_thread.start()
print("[EventLoop] Started in background thread")

# Shutdown handler
def shutdown():
    _loop.call_soon_threadsafe(_loop.stop)
    _thread.join(timeout=5)
    _loop.close()
```

### Verification
```bash
# Start agent with logging
cd agents/research-agent
python server.py

# Call endpoint
curl http://localhost:4021/api/research?topic=test

# Should return 402 or success response (not hang)
```

---

## Issue: Dashboard Transaction Hash Shows as Undefined

### Symptoms
- Transaction list shows `undefined` or empty string for hashes
- Explorer links broken (href to `/tx/undefined`)

### Root Cause
Field name mismatch between `settleResult` and `PaymentInfo` type.
- Settlement result uses: `transaction` field
- Type exports as: `transactionHash` field
- Code tries to access: `result.transactionHash` (undefined)

### Investigation Steps
```typescript
// Log the actual settlement result
console.log('Settlement result:', JSON.stringify(settleResult, null, 2));
// Check if field is 'transaction' or 'transactionHash'
```

### Fix
Correct field mapping in `packages/dashboard/lib/x402.ts`:
```typescript
// WRONG:
transactionHash: settleResult.transactionHash

// CORRECT:
transactionHash: settleResult.transaction
```

### Verification
```bash
# Make payment via orchestrator
curl http://localhost:4030/api/start

# Check dashboard transaction list
# Should show valid 0x... hash, not "undefined"
```

---

## Issue: Docker Compose Services Can't Reach Each Other

### Symptoms
- Dashboard shows all agents as "offline"
- Orchestrator fails with "ECONNREFUSED"
- Curl to agent endpoints works from host but fails from containers

### Root Cause
Using `localhost` instead of Docker service names. Containers can't reach `localhost:4021` because that's the host's address, not the agent container's address.

### Investigation Steps
```bash
# Test from host
curl http://localhost:4021/health  # ✅ Works

# Test from dashboard container
docker exec agentwork-dashboard-1 curl http://localhost:4021/health  # ❌ Fails
docker exec agentwork-dashboard-1 curl http://research-agent:4021/health  # ✅ Works
```

### Fix
Use service names in docker-compose.yml:
```yaml
services:
  dashboard:
    environment:
      - RESEARCH_AGENT_URL=http://research-agent:4021
      - CODE_AGENT_URL=http://code-agent:4022
      # ... etc
```

Update code to use env vars:
```typescript
// packages/dashboard/app/page.tsx
const researchAgentUrl = process.env.RESEARCH_AGENT_URL || 
  `http://localhost:${process.env.RESEARCH_AGENT_PORT}`;
```

### Verification
```bash
docker-compose up

# Check dashboard logs
docker logs agentwork-dashboard-1
# Should show "Research Agent: :4021 (online)"

# Test from dashboard container
docker exec agentwork-dashboard-1 curl http://research-agent:4021/health
# Should return JSON response
```

---

## Issue: Supabase Table Not Found Error

### Symptoms
- Dashboard API routes return 500 error
- Logs show: `relation "payment_events" does not exist`
- Similar error for `task_events` or `agents`

### Root Cause
Supabase tables never created. Code assumes tables exist but no migration runs.

### Investigation Steps
```bash
# Check Supabase Dashboard
# Go to SQL Editor
# Run: SELECT * FROM payment_events LIMIT 1;
# Should get error: "relation does not exist"

# Check files
ls packages/database/  # No schema.sql found
```

### Fix
Create schema and run in Supabase:
```sql
-- packages/database/schema.sql
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer TEXT NOT NULL,
  payee TEXT NOT NULL,
  amount TEXT NOT NULL,
  token TEXT NOT NULL DEFAULT 'USDC',
  gateway_tx TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
-- ... (task_events, agents tables too)
```

```bash
# Run in Supabase Dashboard
# SQL Editor → Paste schema.sql → Run
```

### Verification
```bash
# Query from psql or Supabase Dashboard
SELECT COUNT(*) FROM payment_events;  # Should work now

# Restart dashboard
# No more 500 errors
```

---

## Issue: CircleKit Import Failure Not Logged

### Symptoms
- Agents accept requests without payment verification (free access)
- No error or warning in logs
- CircleKit silently disabled

### Root Cause
Import error caught but only logs warning. `gateway_middleware = None` set without explicit notification.

### Investigation Steps
```python
# Check agents/research-agent/server.py logs
# Should see "circlekit import failed" if error occurs

# Test import
python -c "from circlekit import create_gateway_middleware"
# If ImportError, check installation
```

### Fix
Add explicit error handling with user-visible message:
```python
try:
    from circlekit import create_gateway_middleware
    logger.info("[circlekit] Imported successfully")
    gateway_middleware = create_gateway_middleware(...)
except ImportError as e:
    logger.error(f"[circlekit] Import failed: {e}")
    logger.warning("[circlekit] Running WITHOUT payment verification")
    logger.warning("[circlekit] This is NOT SECURE for production")
    gateway_middleware = None
```

### Verification
```bash
# Start agent without circlekit installed
python server.py

# Check logs - should see clear warnings
# Make test request - should get response but log warning
```

---

## Issue: Gateway Batching Reduces Transaction Count

### Symptoms
- Orchestrator logs 7 payment transactions
- Arcscan.io shows only 1-2 transactions
- Dashboard transaction count doesn't match console logs

### Root Cause
Circle Gateway batches EIP-3009 authorizations off-chain and settles in fewer on-chain transactions.

### Investigation Steps
```typescript
// Run test script
cd packages/orchestrator
node scripts/test-batching.ts

// Check arcscan.io
// Count actual transactions vs expected
```

### Mitigation (If Batched)
Option 1: Add more contract calls
- Implement real AgentEscrow interactions (create, claim, approve)
- Implement real ReputationRegistry feedback calls (4 per task)
- Target: 5 tasks × (7 payments + 8 contract calls) = 75 txns

Option 2: Increase task count
- Run 10 tasks instead of 5
- Each task = ~15 txns (if not batched) or ~3 txns (if batched)
- 10 tasks × 3 txns = 30 txns (still low)

Option 3: Document reality
- If batched, adjust demo narrative: "x402 off-chain batching enables sub-cent payments"
- Emphasize: 7 off-chain authorizations → 1 on-chain settlement
- Still demonstrate: Nanopayment economics, just fewer on-chain txns

### Verification
```bash
# Run test
node scripts/test-batching.ts

# Check explorer
# Count: Is it 7 or 1-2?
```

---

## Issue: Docker Build Fails with Missing package-lock.json

### Symptoms
- `docker-compose build` fails with "package-lock.json not found"
- `npm ci` command fails

### Root Cause
Workspace packages missing lockfiles. `npm ci` requires deterministic dependency resolution.

### Investigation Steps
```bash
# Check for lockfiles
find . -name "package-lock.json"  # Returns nothing

# Try npm install
npm install --legacy-peer-deps
# Should generate lockfiles
```

### Fix
Generate lockfiles or use `npm install` instead:
```dockerfile
# Change in all Dockerfiles
RUN npm ci  # ❌ Requires lockfile

RUN npm install --legacy-peer-deps  # ✅ Works without lockfile
```

Or generate lockfiles first:
```bash
npm install --legacy-peer-deps
docker-compose build
```

### Verification
```bash
# Build should succeed
docker-compose build

# Check for lockfiles
find . -name "package-lock.json"  # Should find them now
```

---

## Common Patterns for Debugging

### Pattern 1: Add Debug Logging
```typescript
console.log('[DEBUG] Variable:', variable);
console.log('[DEBUG] Result:', JSON.stringify(result, null, 2));
```

### Pattern 2: Test Isolated Components
```bash
# Test orchestrator without agents
cd packages/orchestrator && npm start

# Test agents without orchestrator
curl http://localhost:4021/health

# Test dashboard without data
cd packages/dashboard && npm dev
# Check if UI loads (no data expected)
```

### Pattern 3: Check Network Connectivity
```bash
# From host
curl http://localhost:4021/health

# From dashboard container
docker exec agentwork-dashboard-1 curl http://research-agent:4021/health

# From orchestrator container
docker exec agentwork-orchestrator-1 curl http://research-agent:4021/health
```

### Pattern 4: Verify Database State
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM payment_events;
SELECT COUNT(*) FROM task_events;
SELECT * FROM task_events ORDER BY created_at DESC LIMIT 10;
```

### Pattern 5: Check Environment Variables
```bash
# In container
docker exec agentwork-dashboard-1 env | grep SUPABASE

# In application code
console.log('[ENV] SUPABASE_URL:', process.env.SUPABASE_URL);
```
