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
    { id: 'research-1', name: 'Research Agent', type: 'research', status: 'online', url: 'http://localhost:4021/health' },
    { id: 'code-1', name: 'Code Agent', type: 'code', status: 'online', url: 'http://localhost:4022/health' },
    { id: 'test-1', name: 'Test Agent', type: 'test', status: 'online', url: 'http://localhost:4023/health' },
    { id: 'review-1', name: 'Review Agent', type: 'review', status: 'online', url: 'http://localhost:4024/health' },
  ]},
  '/api/gateway-balance': { balance: '4.251', deposited: '5.000', spent: '0.749' },
  '/api/task-status': { totalTasks: 100, completed: 59, totalSpent: '0.749', totalOnChainTransactions: 59 },
  '/api/stats-timeseries': { timeseries: Array.from({ length: 24 }, (_, i) => ({ timestamp: new Date(Date.now() - (23 - i) * 600000).toISOString(), count: Math.floor(Math.random() * 5) + 1, totalAmount: (Math.random() * 0.025 + 0.005).toFixed(3) })) },
  '/api/reasoning': { events: [] },
  '/api/all-agents': { agents: [] },
  '/api/receipts': [],
  '/api/spending-dashboard': { totalSpent: 0.749, remainingBudget: 4.251, agents: [
    { agentType: 'research', totalCalls: 15, successfulCalls: 15, totalSpent: 0.075, avgCostPerCall: 0.005, lastUsed: new Date().toISOString() },
    { agentType: 'code', totalCalls: 15, successfulCalls: 14, totalSpent: 0.075, avgCostPerCall: 0.005, lastUsed: new Date().toISOString() },
    { agentType: 'test', totalCalls: 15, successfulCalls: 15, totalSpent: 0.075, avgCostPerCall: 0.005, lastUsed: new Date().toISOString() },
    { agentType: 'review', totalCalls: 14, successfulCalls: 14, totalSpent: 0.070, avgCostPerCall: 0.005, lastUsed: new Date().toISOString() },
  ]},
  '/api/demo-launch': { status: 'launched', message: 'Demo run initiated' },
};

export function getMockResponse<T>(path: string): T | null {
  return (MOCK_API_RESPONSES[path] ?? null) as T;
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
