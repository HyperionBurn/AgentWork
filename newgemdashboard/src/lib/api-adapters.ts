export interface GeminiAgent {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'busy';
  capabilities: string[];
  performance: number;
  tasksCompleted: number;
  uptime: string;
}

export function adaptAgentsForRegistry(backendAgents: any[]): GeminiAgent[] {
  if (!Array.isArray(backendAgents)) return [];
  return backendAgents.map((agent: any) => ({
    id: agent.id || agent.type || Math.random().toString(),
    name: agent.name || `${agent.type} agent`,
    type: agent.type || 'unknown',
    status: agent.status || 'offline',
    capabilities: agent.capabilities || [],
    performance: agent.performance !== undefined ? agent.performance : 95,
    tasksCompleted: agent.tasksCompleted || 0,
    uptime: agent.uptime || '12h 0m'
  }));
}

export interface GeminiRevenue {
  totalRevenue: number;
  avgPerTask: number;
  topEarner: {
    agent: string;
    revenue: number;
  };
}

export function adaptRevenueForEconomy(backendRevenue: any): GeminiRevenue {
  if (!backendRevenue || !backendRevenue.totals) {
    return {
      totalRevenue: 0,
      avgPerTask: 0,
      topEarner: { agent: '-', revenue: 0 }
    };
  }
  const totals = backendRevenue.totals;
  const agents = backendRevenue.agents || [];
  
  let topAgent = '-';
  let topRev = 0;
  
  for (const a of agents) {
    if (a.earned > topRev) {
      topRev = a.earned;
      topAgent = a.agentId || a.agentType || a.agent;
    }
  }

  return {
    totalRevenue: parseFloat(totals.totalEarned || "0"),
    avgPerTask: totals.totalTasks > 0 ? parseFloat(totals.totalEarned || "0") / totals.totalTasks : 0,
    topEarner: {
      agent: topAgent,
      revenue: parseFloat(String(topRev) || "0")
    }
  };
}

export interface GeminiReceipt {
  id: string;
  txHash: string;
  explorerUrl?: string;
  agent: string;
  task: string;
  amount: number;
  status: 'passed' | 'failed' | 'pending';
  timestamp: string;
  metadata: {
    logic_hash: string;
    computation_units: number;
    gas_saved_usd: number;
    provider: string;
  };
}

const ARC_EXPLORER_BASE = import.meta.env.VITE_ARC_EXPLORER || 'https://testnet.arcscan.app/tx/';

function isExplorerReference(value?: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(mock_|pending|\[pending|\[settling|undefined|null)$/i.test(trimmed)) return false;
  return true;
}

function buildExplorerUrl(value?: string): string | undefined {
  return isExplorerReference(value) ? `${ARC_EXPLORER_BASE}${value}` : undefined;
}

export function adaptReceiptsForHistory(backendReceipts: any[]): GeminiReceipt[] {
  if (!Array.isArray(backendReceipts)) return [];
  
  return backendReceipts.map((r: any) => {
    const firstPayment = r.payments && r.payments.length > 0 ? r.payments[0] : null;
    const txHash = firstPayment?.gatewayTx;
    return {
      id: r.receiptId || r.id,
      txHash: isExplorerReference(txHash) ? txHash : '',
      explorerUrl: firstPayment?.explorerUrl || buildExplorerUrl(txHash),
      agent: firstPayment?.agentType || 'unknown',
      task: r.taskId || 'unknown',
      amount: parseFloat(r.totalAmount || r.amount || "0"),
      status: (r.successfulPayments || 0) > 0 || r.status === 'completed' ? 'passed' : 'failed',
      timestamp: r.createdAt || r.timestamp || new Date().toISOString(),
      metadata: {
        logic_hash: "0xcc2a...88b1",
        computation_units: 450000,
        gas_saved_usd: 12.40,
        provider: "Arc RPC"
      }
    };
  });
}

export interface GeminiNodeEvidence {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'degraded' | 'offline';
  health: number;
  uptime: string;
  load: string;
  capabilities: string[];
}

export function adaptAgentsForEvidence(backendAgents: any[]): GeminiNodeEvidence[] {
  if (!Array.isArray(backendAgents)) return [];
  
  return backendAgents.map((a: any) => {
    let status: 'active' | 'degraded' | 'offline' = 'offline';
    if (a.status === 'online') status = 'active';
    else if (a.status === 'busy') status = 'degraded';

    return {
      id: a.id || a.type || Math.random().toString(),
      name: a.name || `${a.type} agent`,
      type: a.type || 'unknown',
      status,
      health: a.performance !== undefined ? a.performance : 98,
      uptime: a.uptime || '24h',
      load: '45%',
      capabilities: a.capabilities || []
    };
  });
}

export function adaptGatewayBalance(backend: any): {balance: number, deposited: number, spent: number} {
  if (!backend) return { balance: 0, deposited: 0, spent: 0 };
  return {
    balance: parseFloat(backend.balance || "0"),
    deposited: parseFloat(backend.deposited || "0"),
    spent: parseFloat(backend.spent || "0")
  };
}

export function adaptTaskStatus(backend: any): any {
  if (!backend) return { tasks: [], stats: { totalTasks: 0, completed: 0, failed: 0, totalSpent: 0, totalOnChainTransactions: 0 } };
  // Handle both nested { stats: {...} } and flat { totalTasks, completed, ... } formats
  const rawStats = backend.stats || backend;
  return {
    tasks: Array.isArray(backend.tasks) ? backend.tasks : [],
    stats: {
      totalTasks: rawStats.totalTasks || rawStats.total || 0,
      completed: rawStats.completed || 0,
      failed: rawStats.failed || 0,
      totalSpent: parseFloat(rawStats.totalSpent || "0"),
      totalOnChainTransactions: rawStats.totalOnChainTransactions || 0,
    }
  };
}

export function adaptPlaygroundEvents(backend: any[]): any[] {
  if (!Array.isArray(backend)) return [];
  return backend.map(ev => ({
    ...ev,
    timestamp: ev.createdAt || ev.timestamp,
    agent: ev.agentType || ev.agent,
    explorerUrl: ev.explorerUrl || buildExplorerUrl(ev.gatewayTx || ev.gateway_tx)
  }));
}
