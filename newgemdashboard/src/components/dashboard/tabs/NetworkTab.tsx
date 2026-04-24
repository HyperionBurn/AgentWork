import React, { useState, useEffect } from 'react';
import { Layers, Zap, Hexagon, Fingerprint, Banknote, History, CheckCircle2, X } from 'lucide-react';
import { truncateAddress, cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// --- LivePaymentFeed & PaymentFlowAnimation ---
const agentspool = ['Research_Alpha', 'Code_Weaver', 'QA_Sentinel', 'Review_Prime', 'Data_Miner'];
const colorspool = ['#FF5300', '#00FF00', '#FF4444', '#00BBFF', '#FF00FF'];

function Network3DVisualization() {
  const [nodes, setNodes] = useState<{ id: string, x: number, y: number, color: string, name: string }[]>([]);
  const [particles, setParticles] = useState<{ id: string, fromId: string, toId: string, progress: number }[]>([]);
  
  useEffect(() => {
    // Generate static nodes representing agents
    const generatedNodes = agentspool.map((name, i) => {
      const angle = (i / agentspool.length) * Math.PI * 2;
      const radius = 90;
      return {
        id: `node-${i}`,
        name: name,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        color: colorspool[i]
      };
    });
    // Add central orchestrator
    generatedNodes.push({ id: 'hub', name: 'Orchestrator', x: 0, y: 0, color: document.body.classList.contains('light') ? '#1a1a1a' : '#FFFFFF' });
    setNodes(generatedNodes);

    const interval = setInterval(() => {
      // Create new particle flow from Hub to random agent
      const toNodeMatch = generatedNodes[Math.floor(Math.random() * (agentspool.length))];
      const newParticle = { id: Math.random().toString(), fromId: 'hub', toId: toNodeMatch.id, progress: 0 };
      
      setParticles(prev => {
        const next = [...prev, newParticle];
        return next.slice(-15); // Hard cap: keep only last 15 particles
      });
    }, 1200);

    let animationFrameId: number;
    const animateParticles = () => {
      setParticles(prev => prev.map(p => ({ ...p, progress: p.progress + 0.02 })).filter(p => p.progress < 1));
      animationFrameId = requestAnimationFrame(animateParticles);
    };
    animationFrameId = requestAnimationFrame(animateParticles);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-arc-surface border border-arc-border p-5 h-full relative overflow-hidden flex flex-col group"
      style={{ perspective: '1000px' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,83,0,0.05)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
        <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider flex items-center">
          <Layers className="w-4 h-4 mr-2 text-arc-orange" /> Real-time Settlement Network
        </h3>
        <span className="text-[10px] bg-arc-orange/10 text-arc-orange border border-arc-orange/30 px-2 py-0.5 font-mono">LIVE 3D</span>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center min-h-[300px]">
        <motion.div 
          className="relative w-64 h-64"
          animate={{ rotateX: [20, 25, 20], rotateY: [-10, 10, -10] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Edges from HUB to all agents */}
          <svg className="absolute inset-0 overflow-visible" style={{ transform: 'translateZ(-1px)' }}>
             {nodes.filter(n => n.id !== 'hub').map(node => (
               <line 
                 key={`edge-${node.id}`}
                 x1="128" y1="128"
                 x2={128 + node.x} y2={128 + node.y}
                 stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4"
               />
             ))}
          </svg>

          {/* Particles (Transactions) */}
          {particles.map(p => {
             const fromNode = nodes.find(n => n.id === p.fromId);
             const toNode = nodes.find(n => n.id === p.toId);
             if (!fromNode || !toNode) return null;
             
             const currentX = 128 + fromNode.x + (toNode.x - fromNode.x) * p.progress;
             const currentY = 128 + fromNode.y + (toNode.y - fromNode.y) * p.progress;

             return (
               <div 
                 key={p.id}
                 className="absolute w-2 h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                 style={{ 
                   left: currentX - 4, 
                   top: currentY - 4,
                   backgroundColor: toNode.color,
                   opacity: Math.sin(p.progress * Math.PI) // fade in and out curve
                 }}
               />
             );
          })}

          {/* Nodes */}
          {nodes.map(node => (
            <div 
              key={node.id}
              className="absolute group/node cursor-pointer"
              style={{ left: 128 + node.x, top: 128 + node.y, transform: `translate(-50%, -50%) translateZ(${node.id === 'hub' ? '20px' : '0px'})` }}
            >
              <div 
                className="w-4 h-4 rounded-full border-2 border-arc-surface shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform hover:scale-150 relative z-10"
                style={{ backgroundColor: node.color }}
              />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/node:opacity-100 transition-opacity bg-arc-surface border border-arc-border px-2 py-1 whitespace-nowrap text-[10px] font-mono z-20 pointer-events-none">
                <span style={{ color: node.color }}>{node.name}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

// --- GasDashboard ---
function GasDashboard() {
  const [l3Gas, setL3Gas] = useState("0.0001");
  const [arbGas, setArbGas] = useState("0.10");
  const [ethGas, setEthGas] = useState("15.4");

  useEffect(() => {
    const gasInterval = setInterval(() => {
      setL3Gas((0.0001 + (Math.random() * 0.00005)).toFixed(4));
      setArbGas((0.1 + (Math.random() * 0.05)).toFixed(2));
      setEthGas((15.4 + (Math.random() * 3 - 1.5)).toFixed(1));
    }, 5000);
    return () => clearInterval(gasInterval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-arc-surface border border-arc-border p-5 relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider flex items-center">
          <Zap className="w-4 h-4 mr-2 text-arc-orange" /> Real-time Gas Metrics
        </h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-2 relative z-10">
        <div className="p-4 border border-arc-orange/50 bg-arc-orange/5 text-center relative overflow-hidden group hover:bg-arc-orange/10 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-b from-arc-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] font-mono text-arc-orange mb-2 tracking-widest">ARC L3</p>
          <motion.p 
            key={l3Gas}
            initial={{ opacity: 0.5, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xl font-mono text-white font-bold"
          >
            {l3Gas}
          </motion.p>
          <p className="text-[9px] font-mono text-arc-muted mt-1 uppercase">Gwei</p>
        </div>
        <div className="p-4 border border-[#222] bg-[#0a0a0a] text-center opacity-70 hover:opacity-100 transition-colors">
          <p className="text-[10px] font-mono text-arc-muted mb-2 tracking-widest">ARBITRUM</p>
          <motion.p 
            key={arbGas}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-xl font-mono text-white"
          >
            {arbGas}
          </motion.p>
          <p className="text-[9px] font-mono text-arc-muted mt-1 uppercase">Gwei</p>
        </div>
        <div className="p-4 border border-[#222] bg-[#0a0a0a] text-center opacity-70 hover:opacity-100 transition-colors">
          <p className="text-[10px] font-mono text-arc-muted mb-2 tracking-widest">ETHEREUM</p>
          <motion.p 
            key={ethGas}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-xl font-mono text-white"
          >
            {ethGas}
          </motion.p>
          <p className="text-[9px] font-mono text-arc-muted mt-1 uppercase">Gwei</p>
        </div>
      </div>
    </motion.div>
  );
}

// --- GovernancePanel ---
function GovernancePanel() {
  const [voted, setVoted] = useState<'for' | 'against' | null>(null);
  const [votesFor, setVotesFor] = useState(85);
  
  const handleVote = (choice: 'for' | 'against') => {
    if (voted) return;
    setVoted(choice);
    if (choice === 'for') {
      setVotesFor(prev => Math.min(100, prev + 1));
    } else {
      setVotesFor(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-arc-surface border border-arc-border p-5 relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider flex items-center">
          <Hexagon className="w-4 h-4 mr-2" /> ARC DAO Proposals
        </h3>
        <span className="px-2 py-0.5 bg-arc-orange/10 text-arc-orange text-[10px] font-mono border border-arc-orange/30">
          1 ACTIVE
        </span>
      </div>
      
      <div className="p-5 bg-[#0a0a0a] border border-[#222] relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-mono text-arc-muted block mb-1">AIP-14</span>
            <h4 className="font-semibold text-sm text-white">Increase Default Agent Timeout</h4>
          </div>
          <span className="text-[10px] font-mono border border-arc-green text-arc-green px-2 py-1 shadow-[0_0_10px_rgba(0,255,0,0.1)]">VOTING</span>
        </div>
        
        <div className="font-mono text-xs text-arc-muted mb-5 border-l-2 border-[#333] pl-4 py-1 space-y-1">
          <div>param: <span className="text-white">default_timeout_ms</span></div>
          <div>current: <span className="text-arc-red line-through decoration-arc-red/50">30000</span></div>
          <div>proposed: <span className="text-arc-green font-bold">60000</span></div>
        </div>
        
        <div className="flex items-center space-x-1 flex-1 w-full h-2 bg-[#111] overflow-hidden mb-2">
          <motion.div 
            className="h-full bg-arc-green relative"
            animate={{ width: `${votesFor}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {voted === 'for' && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
          </motion.div>
          <motion.div 
            className="h-full bg-arc-red relative"
            animate={{ width: `${100 - votesFor}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {voted === 'against' && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
          </motion.div>
        </div>

        <div className="flex justify-between mb-5 text-[10px] font-mono font-semibold">
          <span className="text-arc-green">{votesFor}% FOR</span>
          <span className="text-arc-red">{100 - votesFor}% AGAINST</span>
        </div>

        <AnimatePresence mode="wait">
          {!voted ? (
            <motion.div 
              key="voting"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex space-x-2"
            >
              <button 
                onClick={() => handleVote('for')}
                className="flex-1 py-2 text-[10px] font-mono border border-arc-green/30 text-arc-green hover:bg-arc-green hover:text-[#000] transition-colors font-bold uppercase tracking-widest"
              >
                Vote For
              </button>
              <button 
                onClick={() => handleVote('against')}
                className="flex-1 py-2 text-[10px] font-mono border border-arc-red/30 text-arc-red hover:bg-arc-red hover:text-[#000] transition-colors font-bold uppercase tracking-widest"
              >
                Vote Against
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="voted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "w-full py-2 text-[10px] font-mono border text-center font-bold uppercase tracking-widest",
                voted === 'for' ? "border-arc-green text-arc-green bg-arc-green/5" : "border-arc-red text-arc-red bg-arc-red/5"
              )}
            >
              <div className="flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 mr-2" /> VOTE RECORDED
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// --- TxList ---
function TxList() {
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const txs = [
    { type: 'Escrow', hash: '0x992B...C21', time: '14s ago', value: '125.00', status: 'SETTLED', from: '0x123...abc', to: '0xdef...456' },
    { type: 'Settle', hash: '0x10A9...E45', time: '52s ago', value: '45.20', status: 'SETTLED', from: '0x789...ghi', to: '0xjkl...123' },
    { type: 'AgentReg', hash: '0x44F0...B89', time: '2m ago', value: '500.00', status: 'SETTLED', from: '0xmnp...qrs', to: 'AgentRegistry' },
    { type: 'Escrow', hash: '0x88D1...A11', time: '5m ago', value: '12.50', status: 'PENDING', from: '0xtuv...wxy', to: '0x123...abc' },
    { type: 'Settle', hash: '0x55E2...F90', time: '12m ago', value: '88.00', status: 'SETTLED', from: '0x987...zyx', to: '0xdef...456' },
  ];
  return (
    <div className="bg-arc-surface border border-arc-border p-5 h-full flex flex-col relative overflow-hidden group/tx">
      <div className="absolute top-0 right-0 w-32 h-32 bg-arc-orange opacity-[0.01] blur-3xl pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider flex items-center">
          <History className="w-4 h-4 mr-2" /> Recent Transactions
        </h3>
      </div>
      <div className="space-y-2 overflow-y-auto max-h-[300px] border border-arc-border bg-[#0a0a0a] flex-1">
        {txs.map((tx, i) => (
           <div 
            key={i} 
            onClick={() => setSelectedTx(tx)}
            className="flex justify-between p-3 border-b border-arc-border last:border-0 font-mono text-xs cursor-pointer hover:bg-arc-orange/5 transition-colors group"
           >
             <div className="flex space-x-3">
               <span className="text-arc-muted w-16 group-hover:text-arc-orange">{tx.type}</span>
               <span className="text-arc-orange hover:text-white transition-colors">{tx.hash}</span>
             </div>
             <span className="text-arc-muted">{tx.time}</span>
           </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedTx && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0a0a0a] border border-[#222] p-8 max-w-md w-full relative"
              onClick={e => e.stopPropagation()}
            >
               <div className="absolute top-0 right-0 p-4">
                 <X className="w-5 h-5 text-arc-muted cursor-pointer hover:text-white" onClick={() => setSelectedTx(null)} />
               </div>
               <div className="flex items-center space-x-3 mb-6">
                 <div className="w-10 h-10 rounded bg-[#111] border border-[#222] flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-arc-orange" />
                 </div>
                 <div>
                   <h3 className="text-white font-mono font-bold uppercase">Transaction Details</h3>
                   <p className="text-[10px] font-mono text-arc-muted uppercase">{selectedTx.hash}</p>
                 </div>
               </div>

               <div className="space-y-4 border-t border-[#222] pt-6 font-mono text-xs">
                  <div className="flex justify-between"><span className="text-arc-muted uppercase tracking-tighter">Amount</span><span className="text-arc-green text-lg font-bold">${selectedTx.value} USDC</span></div>
                  <div className="flex justify-between"><span className="text-arc-muted uppercase tracking-tighter">Status</span><span className="text-white">{selectedTx.status}</span></div>
                  <div className="flex justify-between"><span className="text-arc-muted uppercase tracking-tighter">From</span><span className="text-white">{selectedTx.from}</span></div>
                  <div className="flex justify-between"><span className="text-arc-muted uppercase tracking-tighter">To</span><span className="text-white">{selectedTx.to}</span></div>
               </div>

               <button onClick={() => setSelectedTx(null)} className="w-full mt-8 py-3 border border-arc-orange/50 text-arc-orange hover:bg-arc-orange hover:text-black transition-all font-mono uppercase text-[10px] tracking-widest font-bold">
                 CLOSE RECEIPT
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- TaskDAG ---
function TaskDAG() {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  
  const nodes = [
    { id: 'start', label: 'INPUT', x: 50, y: 150, type: 'trigger' },
    { id: 'research', label: 'RESEARCH', x: 200, y: 80, type: 'agent' },
    { id: 'codegen', label: 'CODE_GEN', x: 200, y: 220, type: 'agent' },
    { id: 'audit', label: 'AUDIT', x: 350, y: 150, type: 'agent' },
    { id: 'deploy', label: 'DEPLOY', x: 500, y: 150, type: 'action' },
  ];

  const edges = [
    { from: 'start', to: 'research' },
    { from: 'start', to: 'codegen' },
    { from: 'research', to: 'audit' },
    { from: 'codegen', to: 'audit' },
    { from: 'audit', to: 'deploy' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-arc-surface border border-arc-border p-5 relative overflow-hidden group/dag md:col-span-2"
    >
      <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
        <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider flex items-center">
          <Fingerprint className="w-4 h-4 mr-2 text-arc-orange" /> Active Task DAG (GC11)
        </h3>
        <div className="flex items-center space-x-2">
           <span className="text-[9px] font-mono text-arc-muted">AUTOCONFIGURATING...</span>
           <div className="w-2 h-2 rounded-full bg-arc-green animate-pulse" />
        </div>
      </div>

      <div className="relative w-full h-[300px] bg-arc-surface border border-arc-border overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(var(--bg-color)_1px,transparent_1px),linear-gradient(90deg,var(--bg-color)_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="var(--border)" />
            </marker>
          </defs>
          {edges.map((edge, i) => {
            const from = nodes.find(n => n.id === edge.from)!;
            const to = nodes.find(n => n.id === edge.to)!;
            const isActive = activeNode === edge.from || activeNode === edge.to;
            return (
              <line
                key={i}
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={isActive ? "#FF5300" : "var(--border)"}
                strokeWidth={isActive ? "2" : "1"}
                markerEnd="url(#arrowhead)"
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "absolute w-24 h-12 flex flex-col items-center justify-center p-2 border cursor-pointer transition-all duration-300",
              activeNode === node.id 
                ? "bg-arc-orange/20 border-arc-orange shadow-[0_0_20px_rgba(255,83,0,0.2)]" 
                : "bg-[#111] border-[#333] hover:border-arc-orange/50"
            )}
            style={{ left: node.x - 48, top: node.y - 24 }}
            onMouseEnter={() => setActiveNode(node.id)}
            onMouseLeave={() => setActiveNode(null)}
          >
            <span className={cn(
              "text-[9px] font-mono leading-none mb-1",
              node.type === 'trigger' ? "text-arc-green" : node.type === 'agent' ? "text-arc-orange" : "text-arc-blue"
            )}>{node.type.toUpperCase()}</span>
            <span className="text-[10px] font-mono text-white font-bold">{node.label}</span>
          </motion.div>
        ))}

        <AnimatePresence>
          {activeNode && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 bg-[#111]/90 backdrop-blur-md border border-arc-orange/30 p-3 w-48 shadow-xl pointer-events-none z-20"
            >
               <p className="text-[10px] font-mono text-arc-orange mb-1 font-bold">NODE DETAILS</p>
               <p className="text-[11px] font-mono text-white mb-2">ID: {activeNode.toUpperCase()}</p>
               <div className="space-y-1">
                 <div className="flex justify-between text-[9px] font-mono">
                   <span className="text-arc-muted uppercase tracking-tighter">Status</span>
                   <span className="text-arc-green">READY</span>
                 </div>
                 <div className="flex justify-between text-[9px] font-mono">
                   <span className="text-arc-muted uppercase tracking-tighter">Load</span>
                   <span className="text-white">12.4%</span>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function NetworkTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Network & Economy</h2>
          <p className="text-arc-muted text-sm mt-1">Real-time settlement, gas metrics, and governance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Network3DVisualization />
        <TaskDAG />
        <TxList />
        <div className="space-y-6 flex flex-col h-full">
          <GasDashboard />
          <div className="flex-1">
            <GovernancePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
