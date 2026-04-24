import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Vote, FileText, Users, Clock, ArrowRight, ShieldCheck, AlertTriangle, TrendingUp, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDashboardStore } from '../../../lib/store';
import { apiFetch, cn } from '../../../lib/utils';
import { SkeletonCard } from '../Skeleton';

const PROPOSALS = [
  { id: 'AIP-14', title: 'Increase Agent Timeout for Deep Search', stat: '92% FOR', status: 'Voting', voters: 124, end: '2d 4h' },
  { id: 'AIP-15', title: 'Add Claude 3.5 Sonnet to Code Registry', stat: '98% FOR', status: 'Active', voters: 312, end: '5h 12m' },
  { id: 'AIP-12', title: 'Gateway Liquidity Rebalancing (Epoch 8)', stat: 'PASSED', status: 'Passed', voters: 89, end: 'Concluded' },
  { id: 'AIP-11', title: 'New "Orchestrator" Role Privileges', stat: 'FAILED', status: 'Failed', voters: 201, end: 'Concluded' },
];

export default function GovernanceTab() {
  const [activeTab, setActiveTab] = useState<'active' | 'passed' | 'all'>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredProposals = PROPOSALS.filter(p => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return p.status === 'Voting' || p.status === 'Active';
    if (activeTab === 'passed') return p.status === 'Passed';
    return true;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SkeletonCard className="lg:col-span-2 h-96" />
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-light text-white">Protocol <span className="text-orange-500 font-mono">Governance</span></h2>
           <p className="text-xs font-mono text-white/30 uppercase tracking-widest mt-1">Decentralized control of ARC VM parameters</p>
        </div>
        <button 
          onClick={() => {
            useDashboardStore.getState().addNotification({ title: 'Governance', message: 'Broadcasting protocol proposal to node cluster...', type: 'info' });
            setTimeout(() => {
              useDashboardStore.getState().addNotification({ title: 'Proposal', message: 'Proposal #4292 registered on-chain for voting.', type: 'success' });
            }, 2000);
          }}
          className="px-6 py-2 bg-orange-500 text-black font-bold text-[10px] uppercase font-mono tracking-[0.2em] rounded-xl hover:bg-orange-400 transition-colors"
        >
           Submit Proposal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main List */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex space-x-1 bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl w-fit">
               {['active', 'passed', 'all'].map((t) => (
                  <button 
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={cn("px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all", activeTab === t ? "bg-white/10 text-white font-bold" : "text-white/30 hover:text-white")}
                  >
                    {t}
                  </button>
               ))}
            </div>

            <div className="space-y-4">
               {filteredProposals.map((p, i) => (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.05 }}
                   key={p.id}
                   className="glass-surface p-6 rounded-3xl border border-white/[0.08] group hover:border-orange-500/30 transition-all cursor-pointer relative overflow-hidden"
                 >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                       <div className="flex items-center space-x-3">
                          <span className="text-[10px] font-mono text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">{p.id}</span>
                          <h3 className="text-base font-medium text-white/90 group-hover:text-white">{p.title}</h3>
                       </div>
                       <div className={cn(
                         "px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest",
                         p.status === 'Passed' ? "bg-green-500/10 text-green-400" :
                         p.status === 'Failed' ? "bg-red-500/10 text-red-500" :
                         "bg-orange-500/10 text-orange-500"
                       )}>
                          {p.status}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                       <div>
                          <p className="text-[9px] font-mono text-white/20 uppercase mb-1">Sentiment</p>
                          <p className="text-sm font-mono text-white font-bold">{p.stat}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-mono text-white/20 uppercase mb-1">Unique Voters</p>
                          <p className="text-sm font-mono text-white">{p.voters}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-mono text-white/20 uppercase mb-1">Time Left</p>
                          <p className="text-sm font-mono text-white/60">{p.end}</p>
                       </div>
                       <div className="flex justify-end items-end">
                          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-orange-500/50 group-hover:bg-orange-500/10 transition-all">
                             <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-orange-500" />
                          </div>
                       </div>
                    </div>

                    {/* Progress Bar for Voting */}
                    {p.status === 'Voting' && (
                       <div className="h-1 w-full bg-white/[0.03] absolute bottom-0 left-0">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: p.stat }}
                            className="h-full bg-orange-500 shadow-[0_0_8px_orange]"
                          />
                       </div>
                    )}
                 </motion.div>
               ))}
            </div>
         </div>

         {/* Stats Sidebar */}
         <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-surface p-8 rounded-3xl border border-white/[0.08]"
            >
               <h3 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-8">Node Consensus Rep</h3>
               <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                          data={[
                            { name: 'For', value: 75, color: '#f97316' },
                            { name: 'Against', value: 20, color: '#444' },
                            { name: 'Abstain', value: 5, color: '#222' }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                           <Cell fill="#f97316" />
                           <Cell fill="#444" />
                           <Cell fill="#222" />
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="flex justify-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 rounded bg-orange-500" />
                     <span className="text-[10px] font-mono text-white/40 uppercase">Optimistic</span>
                  </div>
                  <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 rounded bg-zinc-700" />
                     <span className="text-[10px] font-mono text-white/40 uppercase">Critical</span>
                  </div>
               </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-surface p-8 rounded-3xl border border-white/[0.08] relative overflow-hidden"
            >
               <h4 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-6">Orchestrator News</h4>
               <div className="space-y-4">
                  <div className="flex space-x-4">
                     <div className="w-1 h-1 rounded-full bg-orange-500 mt-2 shrink-0" />
                     <p className="text-[11px] font-mono text-white/60 leading-relaxed uppercase">AIP-15 is trending towards quorum. 1,402 new delegates joined execution path.</p>
                  </div>
                  <div className="flex space-x-4">
                     <div className="w-1 h-1 rounded-full bg-white/20 mt-2 shrink-0" />
                     <p className="text-[11px] font-mono text-white/40 leading-relaxed uppercase">Emergency parameter hot-fix deployed to ARC-SYD cluster.</p>
                  </div>
               </div>
               <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-orange-500/5 blur-3xl" />
            </motion.div>
         </div>
      </div>
    </div>
  );
}
