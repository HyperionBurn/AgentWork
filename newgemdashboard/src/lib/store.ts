import { create } from 'zustand';

export interface Task {
  id: string;
  type?: string;
  status: string;
  message?: string;
  amount?: number;
  timestamp: string;
  agent?: string;
  txHash?: string;
  [key: string]: any;
}

export interface AgentInfo {
  id?: string;
  name?: string;
  type: string;
  status: string;
  [key: string]: any;
}

export interface DashboardStats {
  totalTasks: number;
  completed: number;
  totalSpent: number;
  totalOnChainTransactions: number;
}

export interface GatewayBalance {
  balance: number;
  deposited: number;
  spent: number;
}

export interface TimeseriesData {
  timestamp: string;
  count: number;
  totalAmount: number;
}

export interface AgentBreakdownData {
  agentType: string;
  count: number;
  totalAmount: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export interface DashboardState {
  agents: AgentInfo[];
  connected: boolean;
  connectionMode: 'LIVE' | 'POLLING' | 'OFFLINE';
  tasks: Task[];
  stats: DashboardStats;
  gatewayBalance: GatewayBalance;
  timeseries: TimeseriesData[];
  agentBreakdown: AgentBreakdownData[];
  activeTab: string;
  notifications: Notification[];
  selectedPeriod: 'today' | 'week' | 'all';
  
  setAgents: (agents: AgentInfo[]) => void;
  setConnected: (connected: boolean) => void;
  setConnectionMode: (mode: 'LIVE' | 'POLLING' | 'OFFLINE') => void;
  setTasks: (tasks: Task[]) => void;
  setStats: (stats: any) => void;
  setGatewayBalance: (balance: any) => void;
  setTimeseries: (timeseries: TimeseriesData[]) => void;
  setAgentBreakdown: (breakdown: AgentBreakdownData[]) => void;
  setActiveTab: (tab: string) => void;
  setSelectedPeriod: (period: 'today' | 'week' | 'all') => void;
  addNotification: (titleOrObj: string | any, message?: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeNotification: (id: string) => void;
}

import { MOCK_AGENTS, MOCK_TASKS, MOCK_STATS, MOCK_GATEWAY_BALANCE, MOCK_TIMESERIES, MOCK_AGENT_BREAKDOWN } from './mock-data';

export const useDashboardStore = create<DashboardState>((set) => ({
  agents: MOCK_AGENTS,
  connected: true,
  connectionMode: 'LIVE',
  tasks: MOCK_TASKS,
  stats: MOCK_STATS,
  gatewayBalance: MOCK_GATEWAY_BALANCE,
  timeseries: MOCK_TIMESERIES,
  agentBreakdown: MOCK_AGENT_BREAKDOWN,
  activeTab: 'home',

  setAgents: (agents) => set({ agents }),
  setConnected: (connected) => set({ connected }),
  setConnectionMode: (connectionMode) => set({ connectionMode }),
  setTasks: (tasks) => set({ tasks }),
  setStats: (stats) => set({
    stats: {
      ...stats,
      totalSpent: typeof stats.totalSpent === 'string' ? parseFloat(stats.totalSpent.replace(/[^0-9.-]+/g,"")) : (stats.totalSpent || 0)
    }
  }),
  setGatewayBalance: (balance) => set({
    gatewayBalance: {
      balance: typeof balance.balance === 'string' ? parseFloat(balance.balance.replace(/[^0-9.-]+/g,"")) : (balance.balance || 0),
      deposited: typeof balance.deposited === 'string' ? parseFloat(balance.deposited.replace(/[^0-9.-]+/g,"")) : (balance.deposited || 0),
      spent: typeof balance.spent === 'string' ? parseFloat(balance.spent.replace(/[^0-9.-]+/g,"")) : (balance.spent || 0),
    }
  }),
  setTimeseries: (timeseries) => set({ timeseries }),
  setAgentBreakdown: (agentBreakdown) => set({ agentBreakdown }),
  setActiveTab: (activeTab) => set({ activeTab }),
  selectedPeriod: 'week',
  setSelectedPeriod: (selectedPeriod) => set({ selectedPeriod }),
  notifications: [],
  addNotification: (payload: any, typeOrMessage?: string, type?: string) => {
    const id = Math.random().toString(36).substring(7);
    let notification: any;

    if (typeof payload === 'object' && payload.title) {
      notification = { ...payload, id };
    } else {
      // Handle positional arguments: (title, type) or (title, message, type)
      if (type) {
        notification = { title: payload, message: typeOrMessage, type, id };
      } else {
        notification = { 
          title: payload, 
          message: typeOrMessage === 'success' || typeOrMessage === 'info' || typeOrMessage === 'warning' || typeOrMessage === 'error' ? '' : typeOrMessage, 
          type: typeOrMessage === 'success' || typeOrMessage === 'info' || typeOrMessage === 'warning' || typeOrMessage === 'error' ? typeOrMessage : 'info', 
          id 
        };
      }
    }

    set((state) => ({
      notifications: [...state.notifications, notification]
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      }));
    }, 5000);
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
}));

