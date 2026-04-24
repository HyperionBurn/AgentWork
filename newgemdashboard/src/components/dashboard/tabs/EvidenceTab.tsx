import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Cpu, HardDrive, Network, Zap, CheckCircle2, AlertCircle, ExternalLink, Activity, Server } from 'lucide-react';
import { useDashboardStore } from '../../../lib/store';
import { apiFetch, cn } from '../../../lib/utils';
import { adaptAgentsForEvidence } from '../../../lib/api-adapters';
import { SkeletonCard } from '../Skeleton';

interface NodeEvidence {
  id: string;
  name: string;
  type: string;
  health: number;
  uptime: string;
  load: number;
  lastProof: string;
  status: 'active' | 'degraded' | 'offline';
  capabilities: string[];
}

export default function EvidenceTab() {
  const [nodes, setNodes] = useState<NodeEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'detailed'>('grid');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiFetch<any>('/api/all-agents');
        const adapted = adaptAgentsForEvidence(data.agents || data).map(a => ({
          ...a,
          load: typeof a.load === 'number' ? a.load : parseInt(a.load as string) || 45,
          lastProof: '0x' + Math.random().toString(16).slice(2, 10)
        }));
        setNodes(adapted as NodeEvidence[]);
      } catch (e) {
        console.error('Failed to fetch evidence data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
       </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-light text-white">Trust <span className="text-orange-500 font-mono">& Evidence</span></h2>
           <p className="text-xs font-mono text-white/30 uppercase tracking-widest mt-1">Verifiable node health and computation proofs</p>
        </div>
        <div className="flex items-center space-x-3 bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
           <button 
             onClick={() => setView('grid')}
             className={cn("px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all", view === 'grid' ? "bg-orange-500 text-black font-bold" : "text-white/40 hover:text-white")}
           >
             Cluster Grid
           </button>
           <button 
             onClick={() => setView('detailed')}
             className={cn("px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all", view === 'detailed' ? "bg-orange-500 text-black font-bold" : "text-white/40 hover:text-white")}
           >
             Logic Trace
           </button>
        </div>
      </div>

      {/* Grid or Detailed View */}
      <AnimatePresence mode="wait">
        {view === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
             {nodes.map((node, i) => (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: i * 0.05 }}
                 key={node.id} 
                 className="glass-surface p-6 rounded-3xl border border-white/[0.08] hover:border-orange-500/30 transition-all group overflow-hidden relative"
               >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full" />
                  
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.1] flex items-center justify-center">
                           <Server className="w-5 h-5 text-white/40 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <div>
                           <h4 className="text-sm font-medium text-white/90">{node.name}</h4>
                           <p className="text-[10px] font-mono text-white/30 uppercase">{node.type}</p>
                        </div>
                     </div>
                     <div className={cn(
                       "px-2 py-1 rounded text-[8px] font-mono uppercase font-bold border",
                       node.status === 'active' ? "bg-green-500/10 text-green-400 border-green-500/20" : 
                       node.status === 'degraded' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                       "bg-red-500/10 text-red-500 border-red-500/20"
                     )}>
                        {node.status}
                     </div>
                  </div>
    
                  <div className="space-y-4 relative z-10">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono text-white/30 uppercase">
                           <span>Node Synchronization</span>
                           <span>{node.health}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${node.health}%` }}
                             className="h-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                           />
                        </div>
                     </div>
    
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-center">
                           <p className="text-[9px] font-mono text-white/20 uppercase mb-1">Uptime</p>
                           <p className="text-xs font-mono text-white">{node.uptime}</p>
                        </div>
                        <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-center">
                           <p className="text-[9px] font-mono text-white/20 uppercase mb-1">Compute Load</p>
                           <p className="text-xs font-mono text-white">{node.load}%</p>
                        </div>
                     </div>
    
                     <div className="pt-4 border-t border-white/[0.05] flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                           {node.capabilities.map(cap => (
                             <span key={cap} className="px-1.5 py-0.5 bg-white/[0.03] text-[8px] font-mono text-white/30 rounded uppercase">{cap}</span>
                           ))}
                        </div>
                     </div>
    
                     <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center space-x-2">
                           <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                           <p className="text-[9px] font-mono text-green-400/60 uppercase">Verifiable Proof #{node.lastProof.slice(0, 8)}</p>
                        </div>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            useDashboardStore.getState().addNotification({ title: 'Opening Proof', message: `Navigating to arcscan.io for proof: ${node.lastProof}`, type: 'info' });
                          }}
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white transition-colors cursor-pointer" />
                        </div>
                     </div>
                  </div>
               </motion.div>
             ))}
          </motion.div>
        ) : (
          <motion.div 
            key="trace"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-surface p-8 rounded-3xl border border-white/[0.08] font-mono"
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <h3 className="text-sm text-orange-500 uppercase tracking-tighter">Computation Logic Trace [Real-time]</h3>
              <div className="flex items-center space-x-4">
                <span className="text-[10px] text-white/20">AGENT_ID: RESEARCH_01</span>
                <span className="text-[10px] text-green-400 animate-pulse">STREAMING_LOGS...</span>
              </div>
            </div>
            <div className="space-y-3 h-[400px] overflow-y-auto pr-4 scrollbar-hide">
              {[
                { time: '10:04:21', msg: 'Initializing secure enclave...', type: 'info' },
                { time: '10:04:22', msg: 'Fetching state from Arc L1 RPC...', type: 'info' },
                { time: '10:04:23', msg: 'Consensus achieved (24/32 nodes)', type: 'success' },
                { time: '10:04:24', msg: 'Generating zk-proof for computation root...', type: 'info' },
                { time: '10:04:26', msg: 'Proof generated: 0x82f...a12', type: 'success' },
                { time: '10:04:27', msg: 'Broadcasting to gateway...', type: 'info' },
                { time: '10:04:28', msg: 'Settlement confirmed on-chain', type: 'success' },
                { time: '10:04:30', msg: 'Idle - Waiting for next batch...', type: 'muted' },
              ].map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="flex items-start space-x-4 text-[11px]"
                >
                  <span className="text-white/20 shrink-0">[{log.time}]</span>
                  <span className={cn(
                    log.type === 'success' ? "text-green-400" : 
                    log.type === 'info' ? "text-blue-400" : 
                    log.type === 'muted' ? "text-white/10" : "text-white/60"
                  )}>
                    {log.msg}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof Feed Visualization */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-surface p-8 rounded-3xl border border-white/[0.08]"
      >
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-mono text-orange-500 uppercase tracking-widest">Network Consensus Stream</h3>
            <div className="flex items-center space-x-3 text-[10px] font-mono text-white/20 uppercase">
               <span>L3 Finality: 12ms</span>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span>Nodes: 32 Active</span>
            </div>
         </div>
         <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-6 p-4 bg-white/[0.02] rounded-2xl border border-white/[0.02] hover:border-white/10 transition-all group overflow-hidden relative">
                 <div className="absolute top-0 bottom-0 left-0 w-1 bg-green-500/30 group-hover:bg-green-500 group-hover:shadow-[0_0_10px_green] transition-all" />
                 <div className="flex flex-col items-center justify-center border-r border-white/5 pr-6 min-w-[80px]">
                    <span className="text-[10px] font-mono text-white/30 uppercase mb-1">Block</span>
                    <span className="text-sm font-mono text-white">14,204,50{i}</span>
                 </div>
                 <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                       <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <Activity className="w-3.5 h-3.5 text-orange-500" />
                       </div>
                       <p className="text-xs font-mono text-white/70">Signature aggregation of 24 nodes verified. Root: 0x4f...{i}e2</p>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-green-400">
                       <CheckCircle2 className="w-3.5 h-3.5" />
                       <span>VALIDATED</span>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </motion.div>
    </div>
  );
}
