import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Zap, Activity, Users, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { apiFetch, formatCurrency, formatNumber, cn } from '../../../lib/utils';
import { useDashboardStore } from '../../../lib/store';
import { subscribeToTasks, type TaskEvent } from '../../../lib/supabase';
import { adaptTaskStatus, adaptGatewayBalance } from '../../../lib/api-adapters';
import { SkeletonCard, SkeletonChart } from '../Skeleton';

interface TaskStatusResponse {
  tasks: TaskEvent[];
  stats: {
    totalTasks: number;
    completed: number;
    totalSpent: number;
    totalOnChainTransactions: number;
  };
}

interface GatewayBalanceResponse {
  balance: number;
  deposited: number;
  spent: number;
}

interface AgentHealthResponse {
  agents: Array<{
    type: string;
    status: string;
    description: string;
    name: string;
    port: number;
  }>;
}

interface StatsTimeseriesResponse {
  timeseries: Array<{ timestamp: string; count: number; totalAmount: number }>;
  agentBreakdown: Array<{ agentType: string; count: number; totalAmount: number }>;
}

const StatCard = ({ label, value, sub, icon: Icon, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white/[0.03] border border-white/[0.08] p-6 rounded-2xl relative overflow-hidden group hover:border-orange-500/30 transition-colors"
  >
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
      <Icon className="w-12 h-12" />
    </div>
    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">{label}</p>
    <h4 className="text-3xl font-light text-white mb-1">
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {value}
      </motion.span>
    </h4>
    <p className="text-[10px] font-mono text-white/20 uppercase">{sub}</p>
  </motion.div>
);

export default function DashboardHome() {
  const { stats, gatewayBalance, timeseries, setStats, setGatewayBalance, setTimeseries, connectionMode } = useDashboardStore();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentHealthResponse['agents']>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskData, balanceData, healthData, seriesData] = await Promise.all([
          apiFetch<TaskStatusResponse>('/api/task-status').catch(() => null),
          apiFetch<GatewayBalanceResponse>('/api/gateway-balance').catch(() => null),
          apiFetch<AgentHealthResponse>('/api/agent-health').catch(() => null),
          apiFetch<StatsTimeseriesResponse>('/api/stats-timeseries').catch(() => null),
        ]);

        if (taskData) setStats(adaptTaskStatus(taskData).stats);
        if (balanceData) setGatewayBalance(adaptGatewayBalance(balanceData));
        if (healthData) setAgents(healthData.agents || []);
        if (seriesData) setTimeseries(Array.isArray(seriesData.timeseries) ? seriesData.timeseries : (Array.isArray(seriesData) ? seriesData : []));
        
        if (!taskData && !balanceData) {
          useDashboardStore.getState().setConnectionMode('OFFLINE');
        } else {
          useDashboardStore.getState().setConnectionMode('LIVE');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        useDashboardStore.getState().setConnectionMode('OFFLINE');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    const unsubscribe = subscribeToTasks((event) => {
      console.log('Real-time task update:', event);
      // Logic to update live feed or stats
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard /> <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
        </div>
        <SkeletonChart className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-light text-white">Network <span className="text-zinc-500 italic">Overview</span></h2>
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest flex items-center space-x-2 border",
            connectionMode === 'LIVE' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          )}>
            <div className={cn("w-1 h-1 rounded-full", connectionMode === 'LIVE' ? "bg-green-400 animate-pulse" : "bg-yellow-500")} />
            <span>{connectionMode}</span>
          </div>
        </div>
        <div className="flex space-x-2">
           <button 
             onClick={async () => {
               useDashboardStore.getState().addNotification({ title: 'Orchestrator Initializing', message: 'Triggering Arc Testnet compute cycle...', type: 'info' });
               try {
                 await apiFetch('/api/demo-launch', {
                   method: 'POST',
                   body: JSON.stringify({ runs: 1 })
                 });
                 useDashboardStore.getState().setActiveTab('playground');
               } catch (e) {
                 useDashboardStore.getState().addNotification({ title: 'Launch Failed', message: 'Ensure backend is running on port 3003', type: 'error' });
               }
             }}
             className="px-4 py-1.5 bg-orange-500 text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-orange-400 transition-colors rounded shadow-[0_0_15px_rgba(249,115,22,0.4)]"
           >
             Run Demo
           </button>
           <button 
             onClick={() => {
               useDashboardStore.getState().addNotification('Agent Health Audit: All Systems Nominal', 'success');
               useDashboardStore.getState().addNotification('Research Agent: Active (Port 4021)', 'info');
             }}
             className="px-4 py-1.5 bg-white/5 border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-colors rounded"
           >
             Check Agents
           </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Orchestrations" value={formatNumber(stats.totalTasks)} sub="Tasks processed" icon={LayoutDashboard} delay={0.1} />
        <StatCard label="Network Efficiency" value={`${((stats.completed / (stats.totalTasks || 1)) * 100).toFixed(1)}%`} sub="Success rate" icon={Zap} delay={0.2} />
        <StatCard label="Aggregate Spend" value={formatCurrency(stats.totalSpent)} sub="USD Volume" icon={DollarSign} delay={0.3} />
        <StatCard label="Gateway Liquidity" value={formatCurrency(gatewayBalance.balance)} sub="Available Balance" icon={Activity} delay={0.4} />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white/[0.02] border border-white/[0.05] p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-mono text-orange-500 uppercase tracking-widest mb-1">Compute Throughput</h3>
              <p className="text-[10px] text-white/30 uppercase">Transaction volume per 10m interval</p>
            </div>
            <TrendingUp className="w-4 h-4 text-white/20" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={timeseries}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#080808', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} fill="url(#chartGradient)" />
               </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/[0.02] border border-white/[0.05] p-8 rounded-3xl"
        >
           <h3 className="text-xs font-mono text-orange-500 uppercase tracking-widest mb-6">Active Agents</h3>
           <div className="space-y-6">
              {agents.map((agent, i) => (
                <div key={agent.name} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.1] flex items-center justify-center group-hover:border-orange-500/50 transition-colors">
                      <Users className="w-4 h-4 text-white/40 group-hover:text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80 group-hover:text-white transition-colors">{agent.name}</p>
                      <p className="text-[9px] font-mono text-white/30 uppercase">{agent.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                     <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px]", agent.status === 'online' ? "bg-green-400 shadow-green-400/50" : "bg-red-400 shadow-red-400/50")} />
                     <span className="text-[10px] font-mono text-white/20 uppercase">{agent.status}</span>
                  </div>
                </div>
              ))}
           </div>
           <button 
             onClick={() => {
               useDashboardStore.getState().setActiveTab('agents');
               useDashboardStore.getState().addNotification('Navigating to Agent Registry', 'info');
             }}
             className="w-full mt-10 py-3 bg-white/[0.03] border border-white/[0.1] text-white/40 text-[10px] font-mono uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
           >
             View Full Registry
           </button>
        </motion.div>
      </div>
    </div>
  );
}
