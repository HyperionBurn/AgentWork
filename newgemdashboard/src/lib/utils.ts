import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatCurrency(num: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Mock data fallbacks for when API is unavailable (e.g. Vercel deployment)
const MOCK_TX = () => '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const MOCK_API_RESPONSES: Record<string, any> = {
  // ── Dashboard Home ──
  '/api/agent-health': { agents: [
    { id: 'research-01', name: 'DeepResearch v3', type: 'research', status: 'online', capabilities: ['web_search', 'synthesis', 'citation'], performance: 98, tasksCompleted: 124, uptime: '45h 12m' },
    { id: 'code-01', name: 'CodeForge Alpha', type: 'code', status: 'online', capabilities: ['typescript', 'vyper', 'optimization'], performance: 95, tasksCompleted: 89, uptime: '12h 04m' },
    { id: 'test-01', name: 'SentinelQA', type: 'test', status: 'busy', capabilities: ['unit_testing', 'security_audit', 'fuzzing'], performance: 99, tasksCompleted: 215, uptime: '156h 40m' },
    { id: 'review-01', name: 'LogicReviewer', type: 'review', status: 'online', capabilities: ['code_review', 'compliance', 'sla_check'], performance: 92, tasksCompleted: 45, uptime: '8h 30m' },
  ]},
  '/api/gateway-balance': { balance: '154.20', deposited: '200.00', spent: '45.80' },
  '/api/task-status': { stats: { totalTasks: 1284, completed: 1242, totalSpent: '45.62', totalOnChainTransactions: 3412 } },
  '/api/stats-timeseries': { timeseries: Array.from({ length: 48 }, (_, i) => ({
    timestamp: new Date(Date.now() - (47 - i) * 1800000).toISOString(),
    count: Math.floor(Math.random() * 30) + 5,
    totalAmount: +(Math.random() * 0.15 + 0.02).toFixed(4),
  })) },
  '/api/reasoning': { events: [
    { agent: 'orchestrator', message: 'Strategic Routing Decision: delegating to Research → Code → Test → Review chain', timestamp: new Date(Date.now() - 60000).toISOString() },
    { agent: 'orchestrator', message: 'Budget allocation: $0.020 across 4 agents ($0.005/agent)', timestamp: new Date(Date.now() - 45000).toISOString() },
    { agent: 'orchestrator', message: 'Gateway balance: $154.20 available. Spending limit: 15% utilized.', timestamp: new Date(Date.now() - 30000).toISOString() },
    { agent: 'orchestrator', message: 'ARC L1 Finality: 12ms average settlement. 3,412 on-chain receipts generated.', timestamp: new Date(Date.now() - 15000).toISOString() },
  ]},

  // ── Agents Tab ──
  '/api/agents': [
    { id: 'research-01', name: 'DeepResearch v3', type: 'research', status: 'online', capabilities: ['web_search', 'synthesis', 'citation', 'deep_analysis'], performance: 98, tasksCompleted: 124, uptime: '45h 12m' },
    { id: 'code-01', name: 'CodeForge Alpha', type: 'code', status: 'online', capabilities: ['typescript', 'vyper', 'solidity', 'optimization'], performance: 95, tasksCompleted: 89, uptime: '12h 04m' },
    { id: 'test-01', name: 'SentinelQA', type: 'test', status: 'busy', capabilities: ['unit_testing', 'security_audit', 'fuzzing', 'gas_optimization'], performance: 99, tasksCompleted: 215, uptime: '156h 40m' },
    { id: 'review-01', name: 'LogicReviewer', type: 'review', status: 'online', capabilities: ['code_review', 'compliance', 'sla_check', 'best_practices'], performance: 92, tasksCompleted: 45, uptime: '8h 30m' },
  ],

  // ── Economy Tab ──
  '/api/revenue': {
    totalRevenue: 12450.80,
    avgPerTask: 0.15,
    topEarner: { agent: 'SentinelQA', revenue: 4520.25 },
    byAgent: { research: 3120.00, code: 2890.50, test: 4520.25, review: 1920.05 },
    byDay: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
      amount: +(Math.random() * 200 + 400).toFixed(2),
    })),
  },

  // ── Spending Tab ──
  '/api/spending-dashboard': {
    totalSpent: 4520.50,
    remainingBudget: 5479.50,
    budgetUtilization: 45,
    totalCalls: 4190,
    warnings: ['CodeForge Alpha reached 90% of allocated micro-budget', 'Overall budget utilization at 45% — consider rebalancing'],
    policy: { maxPerCall: 0.50, dailyLimit: 100.00, autoPauseThreshold: 85 },
    agents: [
      { agentType: 'research', totalCalls: 1240, successfulCalls: 1235, totalSpent: 124.00, avgCostPerCall: 0.10, lastUsed: new Date(Date.now() - 60000).toISOString() },
      { agentType: 'code', totalCalls: 850, successfulCalls: 840, totalSpent: 425.00, avgCostPerCall: 0.50, lastUsed: new Date(Date.now() - 300000).toISOString() },
      { agentType: 'test', totalCalls: 2100, successfulCalls: 2100, totalSpent: 105.00, avgCostPerCall: 0.05, lastUsed: new Date(Date.now() - 120000).toISOString() },
    ],
  },

  // ── Receipts Tab ──
  '/api/receipts': { receipts: [
    { id: 'rcpt-3001', txHash: MOCK_TX(), agent: 'DeepResearch v3', task: 'Market Sentiment Analysis: Arc Network', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 60000).toISOString(), metadata: { logic_hash: 'sha256:8f2a...11c2', computation_units: 450, gas_saved_usd: 12.40, provider: 'Arc L1 Settlement' } },
    { id: 'rcpt-3002', txHash: MOCK_TX(), agent: 'CodeForge Alpha', task: 'Generate x402 Payment Middleware', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 180000).toISOString(), metadata: { logic_hash: 'sha256:a1b2...c3d4', computation_units: 820, gas_saved_usd: 18.70, provider: 'Arc L1 Settlement' } },
    { id: 'rcpt-3003', txHash: MOCK_TX(), agent: 'SentinelQA', task: 'Security Audit: AgentEscrow.vy', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 600000).toISOString(), metadata: { logic_hash: 'sha256:e5f6...7890', computation_units: 1200, gas_saved_usd: 32.10, provider: 'Arc L1 Settlement' } },
    { id: 'rcpt-3004', txHash: MOCK_TX(), agent: 'LogicReviewer', task: 'Code Review: PaymentSplitter', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 900000).toISOString(), metadata: { logic_hash: 'sha256:1a2b...3c4d', computation_units: 320, gas_saved_usd: 8.90, provider: 'Arc L1 Settlement' } },
    { id: 'rcpt-3005', txHash: MOCK_TX(), agent: 'DeepResearch v3', task: 'L2 Scaling Solutions Report', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 1200000).toISOString(), metadata: { logic_hash: 'sha256:5e6f...7g8h', computation_units: 280, gas_saved_usd: 6.50, provider: 'Arc L1 Settlement' } },
    { id: 'rcpt-3006', txHash: MOCK_TX(), agent: 'SentinelQA', task: 'Fuzz Test: IdentityRegistry.vy', amount: 0.005, status: 'failed', timestamp: new Date(Date.now() - 1500000).toISOString(), metadata: { logic_hash: 'sha256:9i0j...1k2l', computation_units: 950, gas_saved_usd: 22.30, provider: 'Arc L1 Settlement' } },
  ]},

  // ── Evidence Tab ──
  '/api/all-agents': { agents: [
    { id: 'research-01', name: 'DeepResearch v3', type: 'research', status: 'active', health: 99, uptime: '99.98%', load: 34, capabilities: ['web_search', 'synthesis', 'citation'] },
    { id: 'code-01', name: 'CodeForge Alpha', type: 'code', status: 'active', health: 97, uptime: '99.92%', load: 67, capabilities: ['typescript', 'vyper', 'optimization'] },
    { id: 'test-01', name: 'SentinelQA', type: 'test', status: 'active', health: 100, uptime: '100.00%', load: 82, capabilities: ['unit_testing', 'security_audit', 'fuzzing'] },
    { id: 'review-01', name: 'LogicReviewer', type: 'review', status: 'active', health: 95, uptime: '99.85%', load: 21, capabilities: ['code_review', 'compliance', 'sla_check'] },
  ]},

  // ── Playground Demo Launch ──
  '/api/demo-launch': { status: 'launched', message: 'Demo run initiated', pid: Math.floor(Math.random() * 9000 + 1000) },
};

export function getMockResponse<T>(path: string): T | null {
  // Exact match first
  if (MOCK_API_RESPONSES[path] !== undefined) return MOCK_API_RESPONSES[path] as T;
  // Prefix match for query strings (e.g. /api/revenue?action=summary → /api/revenue)
  const base = path.split('?')[0];
  if (MOCK_API_RESPONSES[base] !== undefined) return MOCK_API_RESPONSES[base] as T;
  return null;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';

  // On deployed environments, skip localhost fetches and return mock data
  const isDeployed = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  if (isDeployed && baseUrl.includes('localhost')) {
    const mock = getMockResponse<T>(path);
    if (mock !== null) return mock;
    throw new Error(`API unavailable: ${path}`);
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // Fallback to mock data when API is unreachable
    const mock = getMockResponse<T>(path);
    if (mock !== null) return mock;
    throw error;
  }
}

// ── Mock Demo Simulation (Playground on Vercel) ──

export interface DemoEvent {
  type: 'status' | 'payment' | 'agent_result' | 'complete' | 'error';
  agent?: string;
  agentType?: 'research' | 'code' | 'test' | 'review';
  message: string;
  txHash?: string;
  data?: any;
  timestamp: string;
}

function genTxHash() {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

const AGENT_OUTPUTS: Record<string, any> = {
  research: {
    findings: [
      'Arc Network (Chain ID 5042002) is an EVM-compatible L1 with native USDC gas token',
      'Average transaction finality: 12ms — 10,000x faster than Ethereum L1',
      'x402 protocol enables HTTP 402 payment-required pattern for AI agent micropayments',
      'Circle Gateway API supports EIP-3009 gasless transfers with batched settlements',
      'Current testnet supports 50+ TPS with sub-cent transaction costs ($0.001/tx)',
    ],
    sources: [
      { title: 'Arc Network Technical Overview', url: 'https://docs.arc.network', confidence: 0.96 },
      { title: 'x402 Protocol Specification', url: 'https://x402.org/spec', confidence: 0.94 },
      { title: 'Circle Developer Documentation', url: 'https://developers.circle.com', confidence: 0.98 },
    ],
    summary: 'Comprehensive analysis confirms Arc L1 provides optimal infrastructure for AI agent nanopayments with 12ms finality, native USDC, and sub-cent fees.',
    confidence: 0.95,
  },
  code: {
    language: 'typescript',
    files: [
      {
        name: 'payment-middleware.ts',
        content: `import { GatewayClient } from "@circle-fin/x402-batching/client";\n\nconst client = new GatewayClient({\n  chain: "arcTestnet",\n  privateKey: process.env.PRIVATE_KEY as Hex,\n});\n\nexport async function payAgent(url: string): Promise<PayResult> {\n  const result = await client.pay(url);\n  console.log(\`🔗 Explorer: https://testnet.arcscan.io/tx/\${result.transaction}\`);\n  return result;\n}`,
        lines: 12,
      },
    ],
    summary: 'Generated x402 payment middleware with GatewayClient integration, Arc L1 settlement, and explorer verification.',
    tokensUsed: 2840,
  },
  test: {
    totalTests: 24,
    passed: 23,
    failed: 1,
    skipped: 0,
    coverage: 96.2,
    results: [
      { name: 'payment flow: deposit → pay → verify', status: 'PASS', duration: '142ms' },
      { name: 'gateway balance check after payment', status: 'PASS', duration: '38ms' },
      { name: 'batch settlement finality <100ms', status: 'PASS', duration: '12ms' },
      { name: 'concurrent agent payments (4x)', status: 'PASS', duration: '890ms' },
      { name: 'escrow lifecycle: create→claim→submit→approve', status: 'PASS', duration: '2.1s' },
      { name: 'identity registry NFT minting', status: 'FAIL', duration: '1.2s', error: 'Gas estimation failed: insufficient balance for gas * price + value' },
    ],
    summary: '23/24 tests passing. One gas estimation failure in identity minting — non-critical, related to test wallet funding.',
    securityAudit: 'No critical vulnerabilities detected. All reentrancy guards in place.',
  },
  review: {
    overallScore: 94,
    categories: {
      correctness: 96,
      security: 92,
      performance: 95,
      maintainability: 93,
    },
    issues: [
      { severity: 'info', message: 'Consider adding retry logic for transient gateway timeouts' },
      { severity: 'info', message: 'PaymentSplitter distribution could benefit from event emission for indexing' },
    ],
    approved: true,
    summary: 'Excellent implementation. All critical paths verified. Minor improvements suggested for production hardening.',
  },
};

export function createMockDemoSimulation(
  onEvent: (event: DemoEvent) => void,
): { cancel: () => void } {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;

  const schedule = (delay: number, fn: () => void) => {
    if (cancelled) return;
    timers.push(setTimeout(() => { if (!cancelled) fn(); }, delay));
  };

  const fire = (event: Omit<DemoEvent, 'timestamp'>) => {
    if (!cancelled) onEvent({ ...event, timestamp: new Date().toISOString() });
  };

  // Phase 1: Boot & Decompose (0-2s)
  schedule(200, () => fire({ type: 'status', message: '🔌 Connecting to Arc Gateway...' }));
  schedule(800, () => fire({ type: 'status', message: '💰 Depositing USDC into Gateway wallet...' }));
  schedule(1500, () => fire({ type: 'payment', agent: 'Gateway', agentType: undefined, message: 'Deposit confirmed: 5.000 USDC', txHash: genTxHash(), data: { amount: '5.000' } }));
  schedule(2200, () => fire({ type: 'status', message: '🧠 Decomposing task into 4 agent subtasks...' }));

  // Phase 2: Research Agent (3-5s)
  schedule(3200, () => fire({ type: 'payment', agent: 'DeepResearch v3', agentType: 'research', message: 'Paying DeepResearch v3 ($0.005)', txHash: genTxHash(), data: { amount: '$0.005' } }));
  schedule(3800, () => fire({ type: 'status', message: '🔍 DeepResearch v3 is analyzing...' }));
  schedule(5200, () => fire({ type: 'agent_result', agent: 'DeepResearch v3', agentType: 'research', message: 'Research complete — 5 findings, 3 sources', data: AGENT_OUTPUTS.research }));

  // Phase 3: Code Agent (5.5-7.5s)
  schedule(5800, () => fire({ type: 'payment', agent: 'CodeForge Alpha', agentType: 'code', message: 'Paying CodeForge Alpha ($0.005)', txHash: genTxHash(), data: { amount: '$0.005' } }));
  schedule(6400, () => fire({ type: 'status', message: '⚡ CodeForge Alpha is generating code...' }));
  schedule(7600, () => fire({ type: 'agent_result', agent: 'CodeForge Alpha', agentType: 'code', message: 'Code generation complete — 1 file, 2,840 tokens', data: AGENT_OUTPUTS.code }));

  // Phase 4: Test Agent (8-10s)
  schedule(8200, () => fire({ type: 'payment', agent: 'SentinelQA', agentType: 'test', message: 'Paying SentinelQA ($0.005)', txHash: genTxHash(), data: { amount: '$0.005' } }));
  schedule(8800, () => fire({ type: 'status', message: '🛡️ SentinelQA is running test suite...' }));
  schedule(10200, () => fire({ type: 'agent_result', agent: 'SentinelQA', agentType: 'test', message: 'Testing complete — 23/24 passed, 96.2% coverage', data: AGENT_OUTPUTS.test }));

  // Phase 5: Review Agent (10.5-12s)
  schedule(10800, () => fire({ type: 'payment', agent: 'LogicReviewer', agentType: 'review', message: 'Paying LogicReviewer ($0.005)', txHash: genTxHash(), data: { amount: '$0.005' } }));
  schedule(11400, () => fire({ type: 'status', message: '📝 LogicReviewer is auditing...' }));
  schedule(12600, () => fire({ type: 'agent_result', agent: 'LogicReviewer', agentType: 'review', message: 'Review complete — Score: 94/100 ✅ Approved', data: AGENT_OUTPUTS.review }));

  // Phase 6: Completion (13s)
  schedule(13200, () => fire({ type: 'status', message: '📊 Aggregating results from all agents...' }));
  schedule(13800, () => fire({
    type: 'complete',
    message: '✅ Pipeline complete! 4 agents paid, 4 on-chain txs, $0.020 total cost',
    txHash: genTxHash(),
    data: {
      totalCost: '$0.020',
      agentsUsed: 4,
      onChainTransactions: 4,
      avgFinality: '12ms',
      gasSaved: '$48.00 vs Ethereum L1',
      settlementNetwork: 'Arc L1 (5042002)',
    },
  }));

  return {
    cancel: () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    },
  };
}
