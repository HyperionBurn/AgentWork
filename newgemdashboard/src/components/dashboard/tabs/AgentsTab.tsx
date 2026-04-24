import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Cpu, ShieldCheck, ExternalLink, History, CheckCircle2, Info, Database } from 'lucide-react';
import { useDashboardStore } from '../../../lib/store';
import { apiFetch, cn, formatNumber } from '../../../lib/utils';
import { SkeletonCard } from '../Skeleton';
import { MOCK_AGENTS } from '../../../lib/mock-data';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'busy' | 'Online' | 'Offline' | 'Syncing';
  capabilities: string[];
  performance: number;
  tasksCompleted: number;
  uptime: string;
}

export default function AgentsTab() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await apiFetch<Agent[]>('/api/agents');
        setAgents(data);
      } catch (e) {
        console.error('Failed to fetch agents:', e);
        // Fallback to mock data for demo
        setAgents(MOCK_AGENTS as any);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleInitialize = (agentName: string) => {
    useDashboardStore.getState().addNotification({
      title: 'Instance Wakeup',
      message: `Initializing node clusters for ${agentName}...`,
      type: 'info'
    });
    setTimeout(() => {
      useDashboardStore.getState().addNotification({
        title: 'Ready',
        message: `${agentName} is now active and polling the mempool.`,
        type: 'success'
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-light text-white uppercase tracking-tighter">Node <span className="text-orange-500 italic">Registry</span></h2>
           <p className="text-xs font-mono text-white/30 uppercase tracking-widest mt-1">Cross-chain agent identity verification</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Filter nodes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] px-10 py-2 rounded-xl text-sm font-mono text-white outline-none focus:border-orange-500/30 transition-all placeholder:text-white/10 w-48 lg:w-64"
            />
          </div>
          <button 
            onClick={() => useDashboardStore.getState().setActiveTab('submit')}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-black rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-400 transition-colors"
          >
             <Plus className="w-4 h-4" />
             <span>DEPLOY NEW</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "glass-surface border rounded-[2rem] p-6 group transition-all relative overflow-hidden",
              expandedId === agent.id ? "border-orange-500/40 bg-orange-500/[0.02]" : "border-white/[0.08] hover:border-white/20"
            )}
          >
            <div className="flex justify-between items-start mb-6 border-b border-white/[0.05] pb-6">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                  expandedId === agent.id ? "bg-orange-500 text-black" : "bg-white/5 text-white/40 group-hover:text-white"
                )}>
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-md font-medium text-white">{agent.name}</h3>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{agent.type}</p>
                </div>
              </div>
              <div className={cn(
                "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                (agent.status?.toLowerCase() === 'online') ? "bg-green-500/10 text-green-400 border-green-500/20" : 
                (agent.status?.toLowerCase() === 'busy') ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                "bg-red-500/10 text-red-500 border-red-500/20"
              )}>
                {agent.status}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-center">
                  <p className="text-[8px] font-mono text-white/20 uppercase mb-1">Efficiency</p>
                  <p className="text-xs font-mono text-white">{agent.performance || 98}%</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-center">
                  <p className="text-[8px] font-mono text-white/20 uppercase mb-1">Uptime</p>
                  <p className="text-xs font-mono text-white">{agent.uptime || '12d 4h'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="w-3 h-3 text-white/20" />
                  <span className="text-[9px] font-mono text-white/40 uppercase">{formatNumber(agent.tasksCompleted || 1240)} Tasks</span>
                </div>
                <button 
                  onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/20 hover:text-white"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence>
                {expandedId === agent.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-4"
                  >
                     <p className="text-[9px] font-mono text-white/30 leading-relaxed uppercase bg-white/[0.03] p-4 border border-white/[0.05] rounded-xl">
                        Specialized in {agent.type} orchestration with optimized L3 settlement pathways and zero-knowledge evidence generation.
                     </p>
                     
                     <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => {
                            useDashboardStore.getState().addNotification({ title: 'Policy Update', message: `Modifying security guardrails for ${agent.name}...`, type: 'info' });
                            setTimeout(() => useDashboardStore.getState().addNotification(`Policy updated successfully.`, 'success'), 2000);
                          }}
                          className="flex items-center justify-center space-x-2 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-mono uppercase text-white/40 hover:bg-white/10 transition-all hover:text-white"
                        >
                           <ShieldCheck className="w-3 h-3 text-orange-500" />
                           <span>Policy</span>
                        </button>
                        <button 
                          onClick={() => {
                            useDashboardStore.getState().addNotification({ title: 'Identity Export', message: `Downloading cryptographic certificate...`, type: 'info' });
                            setTimeout(() => useDashboardStore.getState().addNotification(`Certificate saved to local keychain.`, 'success'), 2000);
                          }}
                          className="flex items-center justify-center space-x-2 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-mono uppercase text-white/40 hover:bg-white/10 transition-all hover:text-white"
                        >
                           <Database className="w-3 h-3 text-blue-500" />
                           <span>Certificate</span>
                        </button>
                     </div>

                     <button 
                       onClick={() => handleInitialize(agent.name)}
                       className="w-full py-3 bg-orange-500 text-black rounded-xl font-bold uppercase font-mono text-[10px] tracking-[0.2em] shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
                     >
                       Initialize Instance
                     </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
