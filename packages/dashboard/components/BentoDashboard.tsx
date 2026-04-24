import React, { useMemo } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Zap, 
  TrendingUp, 
  Layers, 
  Network, 
  LineChart, 
  Activity,
  Award,
  ZapOff,
  Search,
  Code,
  TestTube,
  FileCheck
} from 'lucide-react';

interface AgentStats {
  type: string;
  status: 'online' | 'offline';
  avgScore: number;
  completedCount: number;
  earnings: string;
}

interface BentoDashboardProps {
  agents: AgentStats[];
  totalEarnings: string;
  totalTx: number;
  activeTask?: string;
  onRunDemo: (mode: 'mock' | 'real') => void;
  isLoading: boolean;
}

const AgentIcon = ({ type, size = 24 }: { type: string; size?: number }) => {
  switch (type.toLowerCase()) {
    case 'research': return <Search size={size} className="text-blue-400" />;
    case 'code': return <Code size={size} className="text-purple-400" />;
    case 'test': return <TestTube size={size} className="text-green-400" />;
    case 'review': return <FileCheck size={size} className="text-amber-400" />;
    default: return <Cpu size={size} className="text-slate-400" />;
  }
};

export const BentoDashboard: React.FC<BentoDashboardProps> = ({
  agents,
  totalEarnings,
  totalTx,
  activeTask,
  onRunDemo,
  isLoading
}) => {
  const topAgent = useMemo(() => [...agents].sort((a, b) => b.avgScore - a.avgScore)[0], [agents]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 grid-rows-auto gap-4 p-4 min-h-[800px] bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
      
      {/* 1. NEXUS CONTROL CENTER (Large 2x2) */}
      <div className="md:col-span-2 lg:col-span-3 row-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-700" />
        
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <Network className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Nexus Orchestrator
              </h2>
              <p className="text-slate-400 text-sm font-medium">Autonomous Agentic Procurement</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">Active Directives</span>
              <p className="text-slate-200 font-mono text-sm line-clamp-2 italic">
                {activeTask || "Waiting for directive input from command terminal..."}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <span className="text-[10px] uppercase text-slate-500 block mb-1">Stability</span>
                <span className="text-emerald-400 font-mono font-bold">99.98%</span>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <span className="text-[10px] uppercase text-slate-500 block mb-1">Latency</span>
                <span className="text-cyan-400 font-mono font-bold">142ms</span>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <span className="text-[10px] uppercase text-slate-500 block mb-1">Chain</span>
                <span className="text-slate-400 font-mono font-bold text-[10px]">Arc Testnet</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => onRunDemo('real')}
            disabled={isLoading}
            className="flex-1 px-6 py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] flex items-center justify-center gap-3 border border-cyan-400/30"
          >
            {isLoading ? <Activity className="animate-spin" /> : <Zap size={20} />}
            {isLoading ? "Executing Chaining..." : "Deploy Full Pipeline"}
          </button>
        </div>
      </div>

      {/* 2. ECONOMIC REVENUE (Horizontal 2x1) */}
      <div className="md:col-span-2 lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex items-center justify-between">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Economy Total Volume</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{totalEarnings}</span>
            <span className="text-emerald-400 font-mono text-sm font-bold">USDC</span>
          </div>
        </div>
        <div className="relative z-10 text-right">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl inline-block">
            <span className="block text-[10px] text-emerald-400 font-bold uppercase mb-1">On-Chain Txns</span>
            <span className="text-2xl font-mono font-black text-white">{totalTx}</span>
          </div>
        </div>
      </div>

      {/* 3. PERFORMANCE ORACLE (Vertical 1x2) */}
      <div className="md:col-span-1 lg:col-span-1 row-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div>
          <Award className="text-amber-400 mb-4 mx-auto" size={40} />
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Elite Performer</h3>
          {topAgent && (
            <>
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 mx-auto mb-4 shadow-xl">
                <AgentIcon type={topAgent.type} size={32} />
              </div>
              <p className="font-bold text-lg text-white mb-1">{topAgent.type.toUpperCase()}</p>
              <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full inline-block">
                <span className="text-amber-400 text-xs font-black">{topAgent.avgScore}% ACCURACY</span>
              </div>
            </>
          )}
        </div>
        <div className="w-full mt-4 pt-4 border-t border-slate-800">
           <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase">Reputation Depth</span>
           <span className="text-white font-mono text-sm">{topAgent?.completedCount || 0} Verify Logs</span>
        </div>
      </div>

      {/* 4. AGENT GRID (Dynamic Cards) */}
      <div className="md:col-span-3 lg:col-span-2 row-span-2 grid grid-cols-2 gap-4">
        {agents.map((agent) => (
          <div key={agent.type} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between hover:border-slate-600 transition-all hover:translate-y-[-2px] group">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-slate-800 rounded-xl group-hover:bg-slate-700 transition-colors">
                <AgentIcon type={agent.type} size={20} />
              </div>
              <div className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500'}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-tight">{agent.type}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-white">{String(agent.earnings).split(' ')[0]}</span>
                <span className="text-[10px] text-slate-500 font-mono">USDC</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full transition-all duration-1000" style={{ width: `${agent.avgScore}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. PIPELINE STATUS (Small cards) */}
      <div className="md:col-span-2 lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex items-center gap-6">
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
          <Layers className="text-purple-400" />
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">A2A Chaining Status</span>
          <span className="text-white font-bold flex items-center gap-2">
            Recursive: Enabled <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
          </span>
        </div>
      </div>

      <div className="md:col-span-2 lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex items-center gap-6">
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
          <ShieldCheck className="text-blue-400" />
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Circle x402 Security</span>
          <span className="text-white font-bold">Signed Auth: 100%</span>
        </div>
      </div>

    </div>
  );
};
