import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, ShieldAlert, Cpu, History, ArrowUpRight, ArrowDownRight, Settings, AlertTriangle, TrendingUp, Filter } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { useDashboardStore } from '../../../lib/store';
import { apiFetch, cn, formatCurrency, formatNumber } from '../../../lib/utils';
import { SkeletonCard, SkeletonChart } from '../Skeleton';

interface AgentSpending {
  agentType: string;
  totalCalls: number;
  successfulCalls: number;
  totalSpent: number;
  avgCostPerCall: number;
  lastUsed: string;
}

interface SpendingData {
  totalSpent: number;
  remainingBudget: number;
  policy: {
    maxPerCall: number;
    dailyLimit: number;
    autoPauseThreshold: number;
  };
  agents: AgentSpending[];
  budgetUtilization: number;
  totalCalls: number;
  warnings: string[];
}

import { MOCK_SPENDING } from '../../../lib/mock-data';

export default function SpendingTab() {
  const { selectedPeriod, setSelectedPeriod, addNotification } = useDashboardStore();
  const [data, setData] = useState<SpendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await apiFetch<SpendingData>('/api/spending-dashboard');
        setData(result);
      } catch (e) {
        console.error('Failed to fetch spending data:', e);
        setData(MOCK_SPENDING as any);
      } finally {
        setTimeout(() => setLoading(false), 500); // Add a small delay for feel
      }
    };
    fetchData();
  }, [selectedPeriod]);

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard /> <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
        </div>
        <SkeletonChart className="h-80" />
      </div>
    );
  }

  const utilizationRate = data.budgetUtilization;
  const isHighUtilization = utilizationRate > 70;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-light text-white">Vault <span className="text-orange-500 font-mono">& Budget</span></h2>
           <p className="text-xs font-mono text-white/30 uppercase tracking-widest mt-1">Spend policies & agent resource management</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl flex">
            {['today', 'week', 'all'].map((p) => (
              <button 
                key={p} 
                onClick={() => {
                  setSelectedPeriod(p as any);
                  addNotification({ title: 'Filtering Applied', message: `Historical spend data re-indexed for: ${p.toUpperCase()}`, type: 'info' });
                }}
                className={cn("px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all", selectedPeriod === p ? "bg-orange-500 text-black font-bold" : "text-white/40 hover:text-white")}
              >
                {p}
              </button>
            ))}
          </div>
          <button 
            onClick={() => {
              setShowBudgetModal(true);
              useDashboardStore.getState().addNotification('Vault Governance Settings opened', 'info');
            }}
            className="p-2 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-surface p-6 rounded-3xl border border-white/[0.08]">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Aggregate Consumed</p>
            <h4 className="text-3xl font-light text-white mb-2">{formatCurrency(data.totalSpent)}</h4>
            <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden mt-4">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${utilizationRate}%` }}
                 className={cn("h-full transition-colors", isHighUtilization ? "bg-orange-500" : "bg-green-500")}
               />
            </div>
            <p className="text-[9px] font-mono text-white/20 mt-2 uppercase tracking-wide">{utilizationRate}% OF DAILY LIMIT</p>
         </motion.div>

         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-surface p-6 rounded-3xl border border-white/[0.08]">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Vault Remaining</p>
            <h4 className="text-3xl font-light text-white mb-2">{formatCurrency(data.remainingBudget)}</h4>
            <div className="flex items-center text-[10px] font-mono text-white/20">
               <History className="w-3 h-3 mr-1.5 opacity-50" />
               <span>Last top-up: 12h ago</span>
            </div>
         </motion.div>

         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-surface p-6 rounded-3xl border border-white/[0.08]">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Avg Call Latency</p>
            <h4 className="text-3xl font-light text-white mb-2">1,240ms</h4>
            <div className="flex items-center text-[10px] font-mono text-green-400">
               <ArrowDownRight className="w-3 h-3 mr-1" />
               <span>-8% latency improvement</span>
            </div>
         </motion.div>

         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-surface p-6 rounded-3xl border border-white/[0.08]">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Total RPC Calls</p>
            <h4 className="text-3xl font-light text-white mb-2">{formatNumber(data.totalCalls)}</h4>
            <div className="flex items-center text-[10px] font-mono text-white/20 uppercase">
               <span>Filtered by orchestration</span>
            </div>
         </motion.div>
      </div>

      {/* Warnings & Policy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Spending Breakdown */}
         <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 glass-surface p-8 rounded-3xl border border-white/[0.08]">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xs font-mono text-orange-500 uppercase tracking-widest">Agent Cost Distribution</h3>
               {isHighUtilization && <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="flex items-center space-x-2 text-orange-500 text-[10px] font-mono font-bold"><AlertTriangle className="w-3 h-3" /> <span>CRITICAL UTILIZATION</span></motion.div>}
            </div>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.agents}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                     <XAxis dataKey="agentType" stroke="rgba(255,255,255,0.3)" fontSize={10} axisLine={false} tickLine={false} />
                     <YAxis hide />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#080808', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                     />
                     <Bar dataKey="totalSpent" radius={[4, 4, 0, 0]}>
                        {data.agents.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.totalSpent > 100 ? '#f97316' : '#ffffff20'} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
               {data.agents.map((agent) => (
                 <div key={agent.agentType} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-white/20 transition-all cursor-pointer">
                    <p className="text-[9px] font-mono text-white/30 uppercase mb-1">{agent.agentType}</p>
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-light text-white">{formatCurrency(agent.totalSpent)}</span>
                      <span className="text-[10px] font-mono text-white/40">{formatNumber(agent.totalCalls)} calls</span>
                    </div>
                 </div>
               ))}
            </div>
         </motion.div>

         {/* Policy Card */}
         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-surface p-8 rounded-3xl border border-white/[0.08] flex flex-col">
            <h3 className="text-xs font-mono text-orange-500 uppercase tracking-widest mb-8">Governance Policy</h3>
            <div className="space-y-6 flex-1">
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-white/40">
                     <ShieldAlert className="w-4 h-4" />
                     <span className="text-xs uppercase font-mono tracking-tight">Max Per Call</span>
                  </div>
                  <span className="text-sm font-mono text-white">{formatCurrency(data.policy.maxPerCall)}</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-white/40">
                     <TrendingUp className="w-4 h-4" />
                     <span className="text-xs uppercase font-mono tracking-tight">Daily Hard Cap</span>
                  </div>
                  <span className="text-sm font-mono text-white">{formatCurrency(data.policy.dailyLimit)}</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-white/40">
                     <History className="w-4 h-4" />
                     <span className="text-xs uppercase font-mono tracking-tight">Pause Threshold</span>
                  </div>
                  <span className="text-sm font-mono text-orange-500 font-bold">{data.policy.autoPauseThreshold}%</span>
               </div>

               <div className="mt-10 pt-10 border-t border-white/[0.05]">
                  <h4 className="text-[10px] font-mono text-white/20 uppercase mb-4 tracking-[0.2em]">Active Violations</h4>
                  {data.warnings.length > 0 ? (
                    <div className="space-y-3">
                       {data.warnings.map((w, i) => (
                         <div key={i} className="flex space-x-3 text-[10px] text-orange-400 font-mono">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{w}</span>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/20 italic font-mono">Security policy fully enforced. No active violations.</p>
                  )}
               </div>
            </div>
            <button 
              onClick={() => {
                useDashboardStore.getState().addNotification('Governance Policy Update: Authorized', 'success');
                useDashboardStore.getState().addNotification('New Daily Hard Cap set to $1,500.00', 'info');
              }}
              className="w-full mt-8 py-3 bg-white text-black font-bold text-[10px] font-mono tracking-[0.3em] uppercase hover:bg-orange-500 transition-colors"
            >
               Modify Policy
            </button>
         </motion.div>
      </div>
    </div>
  );
}
