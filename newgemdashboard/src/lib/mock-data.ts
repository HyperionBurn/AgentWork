import { Task, AgentInfo, DashboardStats, GatewayBalance, TimeseriesData, AgentBreakdownData } from './store';

export const MOCK_AGENTS: AgentInfo[] = [
  { id: 'research-01', name: 'DeepResearch v3', type: 'research', status: 'online', performance: 98, tasksCompleted: 124, uptime: '45h 12m', capabilities: ['web_search', 'synthesis', 'citation'] },
  { id: 'code-01', name: 'CodeForge Alpha', type: 'code', status: 'online', performance: 95, tasksCompleted: 89, uptime: '12h 04m', capabilities: ['typescript', 'vyper', 'optimization'] },
  { id: 'test-01', name: 'SentinelQA', type: 'test', status: 'busy', performance: 99, tasksCompleted: 215, uptime: '156h 40m', capabilities: ['unit_testing', 'security_audit', 'fuzzing'] },
  { id: 'review-01', name: 'LogicReviewer', type: 'review', status: 'offline', performance: 92, tasksCompleted: 45, uptime: '0h 0m', capabilities: ['code_review', 'compliance', 'sla_check'] },
];

export const MOCK_TASKS: Task[] = [
  { id: 'task-883', type: 'a2a_research_code', status: 'pending_settlement', message: 'A2A: Research → Code Chaining', amount: 0.010, timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(), agent: 'research-01', txHash: '0xabc...def1' },
  { id: 'task-882', type: 'orchestration', status: 'completed', message: 'Build REST API with Auth', amount: 0.025, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), agent: 'orchestrator', txHash: '0x74a...f821' },
  { id: 'task-881', type: 'research', status: 'completed', message: 'Analyze Arc L1 Economics', amount: 0.005, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), agent: 'research-01', txHash: '0x33b...e122' },
  { id: 'task-880', type: 'code', status: 'completed', message: 'Implement x402 Middleware', amount: 0.005, timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), agent: 'code-01', txHash: '0x99a...c443' },
  { id: 'task-879', type: 'test', status: 'in_progress', message: 'Security Audit: Escrow.vy', amount: 0.005, timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), agent: 'test-01' },
];

export const MOCK_STATS: DashboardStats = {
  totalTasks: 1284,
  completed: 1242,
  totalSpent: 45.62,
  totalOnChainTransactions: 3412,
};

export const MOCK_GATEWAY_BALANCE: GatewayBalance = {
  balance: 154.20,
  deposited: 200.00,
  spent: 45.80,
};

export const MOCK_TIMESERIES: TimeseriesData[] = Array.from({ length: 24 }, (_, i) => ({
  timestamp: new Date(Date.now() - (24 - i) * 3600000).toISOString(),
  count: Math.floor(Math.random() * 50) + 10,
  totalAmount: Math.random() * 0.5,
}));

export const MOCK_AGENT_BREAKDOWN: AgentBreakdownData[] = [
  { agentType: 'research', count: 450, totalAmount: 2.25 },
  { agentType: 'code', count: 320, totalAmount: 1.60 },
  { agentType: 'test', count: 514, totalAmount: 2.57 },
];

export const MOCK_REVENUE = {
  totals: { totalEarned: '45.620', totalTasks: 473, totalRuns: 3 },
  agents: [
    { agentId: 'research-01', agentType: 'research', earned: 12.40, tasks: 124 },
    { agentId: 'code-01', agentType: 'code', earned: 14.25, tasks: 89 },
    { agentId: 'test-01', agentType: 'test', earned: 10.50, tasks: 215 },
    { agentId: 'review-01', agentType: 'review', earned: 8.47, tasks: 45 },
  ],
  topEarner: { agent: 'CodeForge Alpha', revenue: 14.25 },
};

export const MOCK_SPENDING = {
  totalSpent: 4520.50,
  remainingBudget: 5479.50,
  policy: {
    maxPerCall: 0.50,
    dailyLimit: 100.00,
    autoPauseThreshold: 85,
  },
  agents: [
    { agentType: 'research', totalCalls: 1240, successfulCalls: 1235, totalSpent: 124.00, avgCostPerCall: 0.10, lastUsed: new Date().toISOString() },
    { agentType: 'code', totalCalls: 850, successfulCalls: 840, totalSpent: 425.00, avgCostPerCall: 0.50, lastUsed: new Date().toISOString() },
    { agentType: 'test', totalCalls: 2100, successfulCalls: 2100, totalSpent: 105.00, avgCostPerCall: 0.05, lastUsed: new Date().toISOString() },
    { agentType: 'review', totalCalls: 45, successfulCalls: 44, totalSpent: 22.00, avgCostPerCall: 0.50, lastUsed: new Date().toISOString() },
  ],
  budgetUtilization: 45,
  totalCalls: 4190,
  warnings: ['CodeForge Alpha reached 90% of allocated micro-budget'],
};

export const MOCK_RECEIPTS = [
  { id: 'rcpt-3001', txHash: '0x74af...f821', agent: 'DeepResearch v3', task: 'Market Sentiment Analysis: Arc Network', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 60000).toISOString(), metadata: { logic_hash: 'sha256:8f2a...11c2', computation_units: 450, gas_saved_usd: 12.40, provider: 'Arc L1 Settlement' } },
  { id: 'rcpt-3002', txHash: '0x33be...e122', agent: 'CodeForge Alpha', task: 'Generate x402 Payment Middleware', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 180000).toISOString(), metadata: { logic_hash: 'sha256:a1b2...c3d4', computation_units: 820, gas_saved_usd: 18.70, provider: 'Arc L1 Settlement' } },
  { id: 'rcpt-3003', txHash: '0x99ac...c443', agent: 'SentinelQA', task: 'Security Audit: AgentEscrow.vy', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 300000).toISOString(), metadata: { logic_hash: 'sha256:e5f6...7890', computation_units: 1200, gas_saved_usd: 32.10, provider: 'Arc L1 Settlement' } },
  { id: 'rcpt-3004', txHash: '0x55bd...d554', agent: 'LogicReviewer', task: 'Code Review: PaymentSplitter', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 480000).toISOString(), metadata: { logic_hash: 'sha256:1a2b...3c4d', computation_units: 320, gas_saved_usd: 8.90, provider: 'Arc L1 Settlement' } },
  { id: 'rcpt-3005', txHash: '0x11ce...e665', agent: 'DeepResearch v3', task: 'L2 Scaling Solutions Report', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 600000).toISOString(), metadata: { logic_hash: 'sha256:5e6f...7g8h', computation_units: 280, gas_saved_usd: 6.50, provider: 'Arc L1 Settlement' } },
  { id: 'rcpt-3006', txHash: '0x77df...f776', agent: 'SentinelQA', task: 'Fuzz Test: IdentityRegistry.vy', amount: 0.005, status: 'failed', timestamp: new Date(Date.now() - 900000).toISOString(), metadata: { logic_hash: 'sha256:9i0j...1k2l', computation_units: 950, gas_saved_usd: 22.30, provider: 'Arc L1 Settlement' } },
  { id: 'rcpt-3007', txHash: '0x22ea...a887', agent: 'CodeForge Alpha', task: 'Implement Gasless Transfer Hook', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 1200000).toISOString(), metadata: { logic_hash: 'sha256:b3c4...d5e6', computation_units: 680, gas_saved_usd: 15.20, provider: 'Arc L1 Settlement' } },
  { id: 'rcpt-3008', txHash: '0x44fb...b998', agent: 'LogicReviewer', task: 'Compliance Check: SpendingLimiter', amount: 0.005, status: 'passed', timestamp: new Date(Date.now() - 1500000).toISOString(), metadata: { logic_hash: 'sha256:f7g8...h9i0', computation_units: 210, gas_saved_usd: 5.80, provider: 'Arc L1 Settlement' } },
];
