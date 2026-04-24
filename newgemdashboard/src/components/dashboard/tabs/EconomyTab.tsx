import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, DollarSign, ArrowDownRight, ArrowUpRight, BarChart3, Globe, Zap, Layers, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Cell } from 'recharts';
import { apiFetch, cn, formatCurrency, formatNumber } from '../../../lib/utils';
import { adaptRevenueForEconomy } from '../../../lib/api-adapters';
import { useDashboardStore } from '../../../lib/store';
import { SkeletonCard, SkeletonChart } from '../Skeleton';

const CHAIN_COMPARISON = [
  { name: 'Ethereum', costPerTx: 14.50, finality: '12m', color: '#627EEA', logo: 'Ξ' },
  { name: 'Optimism', costPerTx: 0.12, finality: '2s', color: '#FF0420', logo: 'O' },
  { name: 'Arbitrum', costPerTx: 0.08, finality: '1s', color: '#28A0F0', logo: 'A' },
  { name: 'Base', costPerTx: 0.05, finality: '2s', color: '#0052FF', logo: 'B' },
  { name: 'Polygon', costPerTx: 0.02, finality: '2s', color: '#8247E5', logo: 'P' },
  { name: 'Solana', costPerTx: 0.00025, finality: '400ms', color: '#14F195', logo: 'S' },
  { name: 'ARC L3', costPerTx: 0.00001, finality: '12ms', color: '#FF5300', logo: 'A' },
];

interface RevenueResponse {
  totalRevenue: number;
  avgPerTask: number;
  topEarner: { agent: string; revenue: number };
}

import { MOCK_REVENUE } from '../../../lib/mock-data';

export default function EconomyTab() {
  const { timeseries, stats } = useDashboardStore();
  const [revenue, setRevenue] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'batch'>('batch'); // single tx vs 60 txs

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiFetch<any>('/api/revenue?action=summary');
        setRevenue(adaptRevenueForEconomy(data));
      } catch (e) {
        console.error('Failed to fetch revenue:', e);
        setRevenue(MOCK_REVENUE as any);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleWithdraw = async (chainId: number, amount: number) => {
    setWithdrawing(true);
    useDashboardStore.getState().addNotification(`Initiating cross-chain withdrawal of ${formatCurrency(amount)}...`, 'info');
    try {
      // Demo delay
      await new Promise(r => setTimeout(r, 2000));
      useDashboardStore.getState().addNotification('Withdrawal settled on destination chain!', 'success');
    } catch (e) {
      useDashboardStore.getState().addNotification('Withdrawal failed: Network congestion', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleSetViewMode = (mode: 'single' | 'batch') => {
    setViewMode(mode);
    useDashboardStore.getState().addNotification(`Projection updated: ${mode === 'batch' ? '60 Task Batch' : 'Single Transaction'} mode`, 'info');
  };

  if (loading) {
     return (
       <div className="space-y-8">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
         </div>
         <SkeletonChart className="h-96" />
       </div>
     );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header with quick stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-light text-white">Network <span className="text-orange-500 font-mono">Economy</span></h2>
           <p className="text-xs font-mono text-white/30 uppercase tracking-widest mt-1">Real-time settlement & revenue tracking</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
             {['Today', 'Week', 'All'].map((t) => (
               <button 
                 key={t}
                 onClick={() => useDashboardStore.getState().addNotification(`Filtering data: ${t}`, 'info')}
                 className="px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white transition-all"
               >
                 {t}
               </button>
             ))}
          </div>
          <div className="flex items-center space-x-2 bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
             <button 
               onClick={() => handleSetViewMode('single')}
               className={cn("px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all", viewMode === 'single' ? "bg-orange-500 text-black font-bold" : "text-white/40 hover:text-white")}
             >
               Single Tx
             </button>
             <button 
               onClick={() => handleSetViewMode('batch')}
               className={cn("px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all", viewMode === 'batch' ? "bg-orange-500 text-black font-bold" : "text-white/40 hover:text-white")}
             >
               60 Task Batch
             </button>
          </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass-surface p-6 rounded-3xl border border-white/[0.08] relative overflow-hidden"
         >
            <div className="absolute top-0 right-0 p-4 bg-green-500/10 rounded-bl-3xl">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Total Revenue</p>
            <h4 className="text-3xl font-light text-white mb-2">{formatCurrency(revenue?.totalRevenue || 0)}</h4>
            <div className="flex items-center text-[10px] font-mono text-green-400">
               <ArrowUpRight className="w-3 h-3 mr-1" />
               <span>+12.4% vs last epoch</span>
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="glass-surface p-6 rounded-3xl border border-white/[0.08] relative overflow-hidden"
         >
            <div className="absolute top-0 right-0 p-4 bg-orange-500/10 rounded-bl-3xl">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Avg Revenue / Task</p>
            <h4 className="text-3xl font-light text-white mb-2">{formatCurrency(revenue?.avgPerTask || 0)}</h4>
            <div className="flex items-center text-[10px] font-mono text-white/20">
               <span>Optimized for low-gas settlement</span>
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="glass-surface p-6 rounded-3xl border border-white/[0.08] relative overflow-hidden"
         >
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Top Protocol Agent</p>
            <h4 className="text-3xl font-light text-white mb-2">{revenue?.topEarner.agent}</h4>
            <div className="flex items-center text-[10px] font-mono text-orange-400 font-bold uppercase tracking-widest">
               <span>{formatCurrency(revenue?.topEarner.revenue || 0)} All Time</span>
            </div>
         </motion.div>
      </div>

      {/* Chain Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.3 }}
           className="glass-surface p-8 rounded-3xl border border-white/[0.08]"
         >
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xs font-mono text-orange-500 uppercase tracking-widest">Settlement Efficiency</h3>
               <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">99.9% cost reduction via ARC L3</span>
               </div>
            </div>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={CHAIN_COMPARISON.map(c => ({ 
                      ...c, 
                      displayValue: viewMode === 'batch' ? c.costPerTx * 60 : c.costPerTx 
                    }))} 
                    layout="vertical"
                    margin={{ left: 20, right: 40 }}
                  >
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" fontSize={10} fontStyle="mono" tickLine={false} axisLine={false} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#080808', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        formatter={(val: number) => [formatCurrency(val), 'Estimated Gas']}
                     />
                     <Bar dataKey="displayValue" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={1500}>
                        {CHAIN_COMPARISON.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={index === 6 ? 1 : 0.4} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4 }}
           className="glass-surface p-8 rounded-3xl border border-white/[0.08]"
         >
            <h3 className="text-xs font-mono text-orange-500 uppercase tracking-widest mb-8">Chain Performance Metrics</h3>
            <div className="space-y-4">
               {CHAIN_COMPARISON.map((chain, i) => (
                 <div key={chain.name} className="group relative">
                   <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl group-hover:bg-white/[0.04] transition-all group-hover:border-white/[0.1]">
                     <div className="flex items-center space-x-4">
                       <div 
                         className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                         style={{ backgroundColor: chain.color + '20', color: chain.color }}
                       >
                         {chain.logo}
                       </div>
                       <div>
                         <p className="text-sm font-medium text-white/90">{chain.name}</p>
                         <p className="text-[10px] font-mono text-white/30 uppercase">{chain.finality} Finality</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="flex items-center space-x-2">
                          {chain.name === 'ARC L3' ? (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[9px] font-mono rounded-full border border-green-500/20">NATIVE</span>
                          ) : (
                            <span className="text-[10px] font-mono text-white/20 uppercase">{(chain.costPerTx / 14.50 * 100).toFixed(4)}% vs ETH</span>
                          )}
                          <span className="text-sm font-mono text-white">{formatCurrency(chain.costPerTx)}</span>
                       </div>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="text-[9px] font-mono text-orange-500 uppercase font-bold tracking-tighter">
                            CROSS-CHAIN READY
                          </div>
                          <button 
                            disabled={withdrawing}
                            onClick={() => handleWithdraw(1, 100)}
                            className="px-3 py-1 bg-white/5 border border-white/10 hover:bg-orange-500 hover:text-black hover:border-orange-500 transition-all rounded text-[8px] font-bold uppercase tracking-widest"
                          >
                            {withdrawing ? 'Processing...' : 'Withdraw'}
                          </button>
                        </div>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
         </motion.div>
      </div>

      {/* Revenue Trend Area Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-surface p-8 rounded-3xl border border-white/[0.08]"
      >
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-mono text-orange-500 uppercase tracking-widest">Revenue Velocity</h3>
            <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-orange-500/40" />
                  <span className="text-[10px] font-mono text-white/30 uppercase">Gross Volume</span>
               </div>
               <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-green-500/40" />
                  <span className="text-[10px] font-mono text-white/30 uppercase">Net Margin</span>
               </div>
            </div>
         </div>
         <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={timeseries}>
                  <defs>
                     <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#080808', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Area type="monotone" dataKey="totalAmount" stroke="#f97316" strokeWidth={3} fill="url(#volGradient)" />
                  <Area type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} fill="url(#marginGradient)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </motion.div>
    </div>
  );
}
