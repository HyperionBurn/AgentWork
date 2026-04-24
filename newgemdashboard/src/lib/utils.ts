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
const MOCK_API_RESPONSES: Record<string, any> = {
  '/api/agent-health': { agents: [
    { id: 'research-1', name: 'Research Agent', type: 'research', status: 'online', capabilities: ['research', 'analysis'], performance: 95, tasksCompleted: 15, uptime: '99.9%' },
    { id: 'code-1', name: 'Code Agent', type: 'code', status: 'online', capabilities: ['code', 'generation'], performance: 93, tasksCompleted: 14, uptime: '99.7%' },
    { id: 'test-1', name: 'Test Agent', type: 'test', status: 'online', capabilities: ['testing', 'qa'], performance: 97, tasksCompleted: 15, uptime: '99.8%' },
    { id: 'review-1', name: 'Review Agent', type: 'review', status: 'online', capabilities: ['review', 'audit'], performance: 96, tasksCompleted: 14, uptime: '99.9%' },
  ]},
  '/api/agents': [
    { id: 'research-1', name: 'Research Agent', type: 'research', status: 'online', capabilities: ['research', 'analysis'], performance: 95, tasksCompleted: 15, uptime: '99.9%' },
    { id: 'code-1', name: 'Code Agent', type: 'code', status: 'online', capabilities: ['code', 'generation'], performance: 93, tasksCompleted: 14, uptime: '99.7%' },
    { id: 'test-1', name: 'Test Agent', type: 'test', status: 'online', capabilities: ['testing', 'qa'], performance: 97, tasksCompleted: 15, uptime: '99.8%' },
    { id: 'review-1', name: 'Review Agent', type: 'review', status: 'online', capabilities: ['review', 'audit'], performance: 96, tasksCompleted: 14, uptime: '99.9%' },
  ],
  '/api/gateway-balance': { balance: '4.251', deposited: '5.000', spent: '0.749' },
  '/api/task-status': { stats: { totalTasks: 100, completed: 59, totalSpent: '0.749', totalOnChainTransactions: 59 } },
  '/api/stats-timeseries': { timeseries: Array.from({ length: 24 }, (_, i) => ({ timestamp: new Date(Date.now() - (23 - i) * 600000).toISOString(), count: Math.floor(Math.random() * 5) + 1, totalAmount: (Math.random() * 0.025 + 0.005).toFixed(3) })) },
  '/api/reasoning': { events: [] },
  '/api/all-agents': { agents: [] },
  '/api/receipts': [],
  '/api/spending-dashboard': {
    totalSpent: 0.749,
    remainingBudget: 4.251,
    budgetUtilization: 15,
    totalCalls: 59,
    warnings: [],
    policy: {
      maxPerCall: 0.005,
      dailyLimit: 10.00,
      autoPauseThreshold: 85,
    },
    agents: [
      { agentType: 'research', totalCalls: 15, successfulCalls: 15, totalSpent: 0.075, avgCostPerCall: 0.005, lastUsed: new Date().toISOString() },
      { agentType: 'code', totalCalls: 15, successfulCalls: 14, totalSpent: 0.075, avgCostPerCall: 0.005, lastUsed: new Date().toISOString() },
      { agentType: 'test', totalCalls: 15, successfulCalls: 15, totalSpent: 0.075, avgCostPerCall: 0.005, lastUsed: new Date().toISOString() },
      { agentType: 'review', totalCalls: 14, successfulCalls: 14, totalSpent: 0.070, avgCostPerCall: 0.005, lastUsed: new Date().toISOString() },
    ],
  },
  '/api/revenue': { totalRevenue: 0.749, byAgent: { research: 0.075, code: 0.075, test: 0.075, review: 0.070 }, byDay: Array.from({ length: 7 }, (_, i) => ({ date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0], amount: (Math.random() * 0.1 + 0.05).toFixed(3) })) },
  '/api/demo-launch': { status: 'launched', message: 'Demo run initiated' },
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
