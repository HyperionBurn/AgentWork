import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, TerminalSquare, ArrowRight, GitCommit, Search, CheckCircle2, Clock, CheckCircle, Activity, ShieldCheck, Microscope, X } from 'lucide-react';
import { cn, truncateAddress } from '../../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { audioEngine } from '../../../lib/audio';

// --- TraceabilityModal ---
function TraceabilityModal({ message, onClose }: { message: any, onClose: () => void }) {
  const traceSteps = [
    { label: "Token Retrieval", status: "ok", log: "Retrieved metadata for 42 assets from Polygon RPC." },
    { label: "Model Selection", status: "ok", log: "Routing to Gemini-1.5-Pro for complex reasoning (Context: 128k)." },
    { label: "Safety Guardrails", status: "ok", log: "Content filtered for sensitive financial exposure. Pass." },
    { label: "Synthesis", status: "ok", log: "Consolidating sparse data into comprehensive JSON payload." },
    { label: "Consensus Check", status: "warn", log: "Node latency above 50ms detected. Retrying sibling nodes." },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 font-mono"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-2xl w-full bg-[#050505] border border-arc-orange/30 p-8 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-6">
          <X className="w-5 h-5 text-arc-muted cursor-pointer hover:text-white" onClick={onClose} />
        </div>
        
        <div className="flex items-center space-x-3 mb-8 border-b border-[#222] pb-6">
           <div className="w-12 h-12 rounded bg-arc-orange/10 border border-arc-orange/30 flex items-center justify-center">
             <ShieldCheck className="w-6 h-6 text-arc-orange" />
           </div>
           <div>
             <h3 className="text-white font-bold text-lg uppercase tracking-tight">Logical Trace Inspection</h3>
             <p className="text-[10px] text-arc-muted uppercase tracking-widest">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
           </div>
        </div>

        <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
           {traceSteps.map((step, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="flex space-x-4 border-l border-[#222] pl-6 relative"
             >
               <div className={cn("absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#050505]", step.status === 'ok' ? 'bg-arc-green' : 'bg-arc-orange animate-pulse')} />
               <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{step.label}</span>
                    <span className={cn("text-[8px] px-1 uppercase", step.status === 'ok' ? 'text-arc-green' : 'text-arc-orange')}>{step.status}</span>
                  </div>
                  <p className="text-[11px] text-arc-muted leading-relaxed opacity-80">{step.log}</p>
               </div>
             </motion.div>
           ))}
        </div>

        <div className="bg-[#0a0a0a] border border-[#222] p-4 mb-8">
           <p className="text-[9px] text-arc-muted uppercase mb-2 tracking-widest">Original Output Source</p>
           <p className="text-xs text-white bg-[#050505] p-3 border border-[#1a1a1a]">{message.text}</p>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-arc-orange text-black font-bold uppercase text-[10px] tracking-[0.4em] hover:bg-white transition-colors"
        >
          Close Investigation
        </button>
      </motion.div>
    </motion.div>
  );
}

// --- DemoLauncher ---
function DemoLauncher({ 
  running, 
  setRunning, 
  onTemplateSelect 
}: { 
  running: boolean, 
  setRunning: (v: boolean) => void, 
  onTemplateSelect: (id: string) => void 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-arc-surface border border-arc-border p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-arc-orange/30 to-transparent" />

      <h3 className="font-mono text-xl mb-2 text-white relative z-10">ORCHESTRATOR DEMO</h3>
      <p className="text-sm text-arc-muted mb-6 max-w-sm relative z-10">Launch a simulated multi-agent pipeline generating cross-domain research.</p>
      
      <div className="flex flex-col space-y-4 w-full max-w-xs relative z-10">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setRunning(!running)}
          className={cn(
            "w-full h-14 flex items-center justify-center space-x-3 text-sm font-mono border-2 transition-all",
            running 
              ? "border-arc-red text-arc-red hover:bg-arc-red/10 shadow-[0_0_20px_rgba(255,68,68,0.2)]" 
              : "border-arc-orange text-arc-orange hover:bg-arc-orange/10 shadow-[0_0_15px_rgba(255,83,0,0.3)] hover:shadow-[0_0_30px_rgba(255,83,0,0.5)]"
          )}
        >
          {running ? <Pause className="fill-current w-4 h-4" /> : <Play className="fill-current w-4 h-4" />}
          <span>{running ? 'ABORT EXECUTION' : 'LAUNCH PIPELINE'}</span>
        </motion.button>
        
        {!running && (
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <button 
              onClick={() => onTemplateSelect('arbitrage')}
              className="p-2 border border-[#222] bg-[#0a0a0a] text-arc-muted hover:border-arc-orange/50 hover:text-white transition-all uppercase tracking-widest"
            >
              Arb-Bot
            </button>
            <button 
              onClick={() => onTemplateSelect('audit')}
              className="p-2 border border-[#222] bg-[#0a0a0a] text-arc-muted hover:border-arc-orange/50 hover:text-white transition-all uppercase tracking-widest"
            >
              Auditor
            </button>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {running && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-6 w-full text-left relative z-10 border-t border-[#222] pt-4"
          >
            <div className="flex justify-between text-[10px] font-mono text-arc-muted mb-2 uppercase tracking-wide">
              <span className="flex items-center"><Activity className="w-3 h-3 mr-1.5 text-arc-green" /> Running Sequence</span>
              <span className="text-arc-green animate-pulse">TX_SYNC_OK</span>
            </div>
            <div className="h-1 w-full bg-[#111] overflow-hidden rounded-full">
              <motion.div 
                className="h-full bg-arc-orange w-1/4 shadow-[0_0_10px_rgba(255,83,0,0.8)]"
                animate={{ x: ['-100%', '400%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="text-[9px] font-mono text-arc-muted mt-2 text-center">Consensus nodes participating: <span className="text-white">1,402</span></p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- TaskDAGVisualization ---
function TaskDAGVisualization({ running }: { running: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#050505] border border-[#222] p-5 relative overflow-hidden hidden md:block glow-border"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-arc-orange opacity-[0.02] blur-3xl pointer-events-none"></div>
      <div className="flex justify-between items-center mb-10 relative z-10">
        <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider">DAG Orchestration Graph</h3>
        <span className="text-xs font-mono border border-arc-border px-2 py-1 text-arc-orange bg-[#111]">{running ? 'TASK_ID: 9812A' : 'AWAITING DISPATCH'}</span>
      </div>
      
      <div className="h-48 relative flex items-center justify-center">
        {/* Animated DAG Path */}
        <div className="flex items-center space-x-16 relative z-10 w-full px-8 text-xs font-mono justify-center">
          
          <div className="flex flex-col items-center">
             <motion.div 
               whileHover={{ scale: 1.1 }}
               className={cn("w-14 h-14 rounded-full border-2 bg-[#0a0a0a] flex items-center justify-center z-10 transition-all", running ? "border-arc-green shadow-[0_0_15px_rgba(0,255,0,0.2)]" : "border-[#444]")}
             >
               <CheckCircle2 className={cn("w-6 h-6", running ? "text-arc-green" : "text-[#444]")} />
             </motion.div>
             <span className="mt-3 text-arc-muted tracking-wider">RSRCH</span>
          </div>

          {/* Connectors with flowing particles */}
          <div className="h-0.5 flex-1 relative flex items-center justify-center overflow-hidden">
             <div className="absolute w-full h-[1px] bg-gradient-to-r from-[#333] to-[#333] transition-colors" style={running ? { background: 'linear-gradient(to right, #00FF00, #FF5300)', opacity: 0.4 } : {}}></div>
             {running && (
               <motion.div 
                 className="h-[2px] bg-arc-orange shadow-[0_0_10px_rgba(255,83,0,1)] w-8 absolute rounded-full"
                 animate={{ left: ['-10%', '110%'] }}
                 transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
               />
             )}
          </div>

          <div className="flex flex-col items-center relative">
             <motion.div 
               whileHover={{ scale: 1.1 }}
               className={cn("w-16 h-16 rounded-full border-2 bg-[#0a0a0a] flex items-center justify-center z-10 relative transition-all", running ? "border-arc-orange shadow-[0_0_20px_rgba(255,83,0,0.4)]" : "border-[#444]")}
             >
               {running && <div className="absolute inset-0 rounded-full border-[1.5px] border-arc-orange animate-ping opacity-20"></div>}
               <GitCommit className={cn("w-8 h-8", running ? "text-arc-orange" : "text-[#444]")} />
             </motion.div>
             <span className={cn("mt-3 tracking-wider font-bold transition-colors", running ? "text-white" : "text-[#444]")}>CODE</span>
          </div>

          <div className="h-0.5 flex-1 relative flex items-center justify-center overflow-hidden">
             <div className="absolute w-full h-[1px] bg-[#333]"></div>
          </div>

          <div className="flex flex-col items-center opacity-50">
             <div className="w-14 h-14 rounded-full border-2 border-[#444] bg-[#0a0a0a] flex items-center justify-center z-10">
               <Clock className="w-6 h-6 text-arc-muted" />
             </div>
             <span className="mt-3 text-arc-muted tracking-wider">TEST</span>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

// --- AgentChat ---
const initialMessages = [
  { text: "Execute deep analysis on tokenomics of L3 chains.", type: "user", sender: "USER (0x7a...e21)" },
  { text: "Acknowledged. Commencing data aggregation across multiple L2/L3 architectures. Expected compute time: 1.2s.", type: "agent", sender: "Research_Alpha" }
];
const streamMessages = [
  { text: "> SYSTEM: Data retrieved successfully. Payload passed to Code_Weaver via RPC.", type: "system", sender: "SYSTEM" },
  { text: "Generating simulation models...", type: "agent-active", sender: "Code_Weaver" },
  { text: "Simulation complete. L3 rollups demonstrate 15% efficiency gain over baseline.", type: "agent", sender: "Code_Weaver" },
  { text: "> SYSTEM: Validation checks initiated by QA_Sentinel...", type: "system", sender: "SYSTEM" },
  { text: "Tests passed. 0 regressions found.", type: "agent", sender: "QA_Sentinel" },
  { text: "> SYSTEM: Pipeline executing payout phase.", type: "system", sender: "SYSTEM" }
];

function AgentChat({ running }: { running: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedTrace, setSelectedTrace] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) {
      setMessages([]);
      return;
    }
    setMessages(initialMessages);
    const interval = setInterval(() => {
      setMessages(prev => {
        // Only automatically stream if we haven't added custom messages
        // or just base it on original pipeline length
        const baseIndex = prev.filter(m => m.sender !== 'USER (Custom)').length - initialMessages.length;
        if (baseIndex >= 0 && baseIndex < streamMessages.length) {
          return [...prev, streamMessages[baseIndex]];
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    const newMessage = {
      text: inputValue,
      type: 'user',
      sender: 'USER (Custom)'
    };
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-arc-surface border border-arc-border flex flex-col h-[400px] overflow-hidden"
    >
      <div className="p-4 border-b border-arc-border bg-[#0a0a0a] flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <TerminalSquare className={cn("w-5 h-5", running ? "text-arc-orange" : "text-[#444]")} />
          <h3 className="text-sm font-mono text-white tracking-wider">Agent Pipeline Chat</h3>
        </div>
        {running && <span className="w-2 h-2 bg-arc-green rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.6)]" />}
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 font-mono text-sm max-h-full custom-scrollbar relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-transparent h-4 pointer-events-none sticky top-0" />
        
        {!running && (
           <div className="h-full flex items-center justify-center opacity-30 text-arc-muted font-mono text-xs">
              WAITING FOR PIPELINE EXECUTION
           </div>
        )}

        <AnimatePresence>
          {messages.map((m, i) => {
            if (!m) return null;
            if (m.type === 'user') {
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col max-w-[85%] border border-[#222] p-4 bg-[#050505]">
                  <div className="text-[10px] text-arc-orange mb-2 flex items-center"><span className="w-1.5 h-1.5 bg-arc-orange rounded-full mr-2 opacity-50"></span>{m.sender}</div>
                  <p className="text-white text-xs leading-relaxed">{m.text}</p>
                </motion.div>
              );
            }
            if (m.type === 'system') {
              return (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col ml-auto w-full border-l-2 border-[#444] pl-4 py-2 mt-2">
                  <p className="text-[#888] text-[10px] break-all tracking-wide">{m.text}</p>
                </motion.div>
              );
            }
            if (m.type === 'agent') {
               return (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col max-w-[85%] ml-auto border border-arc-orange/20 p-4 bg-arc-orange/[0.03]">
                    <div className="text-[10px] text-arc-orange mb-2 text-right flex justify-end items-center">
                      <button 
                        onClick={() => {
                          audioEngine.play('click');
                          setSelectedTrace(m);
                        }}
                        className="mr-3 opacity-0 group-hover:opacity-100 hover:text-white transition-all flex items-center uppercase tracking-tighter"
                      >
                        <Microscope className="w-3 h-3 mr-1" /> Inspect Trace
                      </button>
                      {m.sender}<span className="w-1.5 h-1.5 bg-arc-orange rounded-full ml-2 opacity-50"></span>
                    </div>
                    <p className="text-white text-xs leading-relaxed text-right">{m.text}</p>
                  </motion.div>
               );
            }
            if (m.type === 'agent-active') {
               return (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col max-w-[85%] ml-auto border border-arc-orange/20 p-4 bg-arc-orange/[0.03]">
                    <div className="text-[10px] text-arc-orange mb-2 text-right flex justify-end items-center">{m.sender}<span className="w-1.5 h-1.5 bg-arc-orange rounded-full ml-2 opacity-50"></span></div>
                    <p className="text-white text-xs flex items-center justify-end font-semibold">
                      <span className="w-1 h-3 bg-arc-orange mr-2 animate-pulse"/> {m.text}
                    </p>
                  </motion.div>
               );
            }
            return null;
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedTrace && <TraceabilityModal message={selectedTrace} onClose={() => setSelectedTrace(null)} />}
      </AnimatePresence>

      <div className="p-4 border-t border-arc-border bg-[#0a0a0a] shrink-0">
        <div className="flex items-center space-x-3">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={running ? "Type instructions to override pipeline..." : "Start pipeline to interact..."}
            disabled={!running}
            className="flex-1 bg-transparent border border-arc-border p-2 text-sm font-mono text-white placeholder-arc-muted focus:outline-none focus:border-arc-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!running || inputValue.trim() === ''}
            className="bg-arc-orange p-2 text-[#000] hover:bg-arc-orange/80 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// --- TaskTemplates ---
function TaskTemplates() {
  const templates = [
    { title: "Defi Arbitrage Bot", desc: "Research -> Code -> Test", cost: "~$4.50", level: "HIGH" },
    { title: "Sentiment Analysis", desc: "Scrape -> NLP -> Review", cost: "~$0.80", level: "LOW" },
  ];
  return (
    <div className="bg-arc-surface border border-arc-border p-5">
      <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider mb-4">Pipeline Templates</h3>
      <div className="space-y-3">
        {templates.map((t, i) => (
          <div key={i} className="p-3 border border-arc-border bg-[#0a0a0a] hover:border-arc-orange cursor-pointer transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-mono text-sm text-white group-hover:text-arc-orange transition-colors">{t.title}</h4>
              <span className={cn("text-[10px] font-mono px-1.5 py-0.5 border", t.level === 'HIGH' ? 'text-arc-red border-arc-red' : 'text-arc-green border-arc-green')}>
                {t.level}
              </span>
            </div>
            <p className="text-xs font-mono text-arc-muted mb-3">{t.desc}</p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-arc-muted font-mono">EST: <span className="text-white">{t.cost}</span></span>
              <ArrowRight className="w-4 h-4 text-arc-muted group-hover:text-arc-orange transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- TaskFeed ---
function TaskFeed() {
  const tasks = [
    { id: '1', hash: '0x33A...11F', agent: 'Research_Alpha', status: 'COMPLETED', time: '1m ago' },
    { id: '2', hash: '0x99B...C44', agent: 'Code_Weaver', status: 'RUNNING', time: '2m ago' },
    { id: '3', hash: '0x88F...D71', agent: 'QA_Sentinel', status: 'PENDING', time: '5m ago' },
  ];
  return (
    <div className="bg-arc-surface border border-arc-border p-5">
      <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider mb-4">Task Execution Feed</h3>
      <div className="space-y-3">
        {tasks.map((task) => (
           <div key={task.id} className="p-3 bg-[#0a0a0a] border border-arc-border flex items-center justify-between text-xs font-mono">
             <div>
               <a href="#" className="text-arc-orange hover:text-white mb-1 block">{task.hash}</a>
               <span className="text-arc-muted">{task.agent}</span>
             </div>
             <div className="text-right">
               <span className={cn("px-2 py-0.5 border text-[10px] mb-1 inline-block", 
                 task.status === 'COMPLETED' ? 'border-arc-green text-arc-green' : 
                 task.status === 'RUNNING' ? 'border-arc-orange text-arc-orange' : 'border-arc-muted text-arc-muted'
               )}>
                 {task.status}
               </span>
               <span className="text-arc-muted block">{task.time}</span>
             </div>
           </div>
        ))}
      </div>
    </div>
  );
}

// --- EscrowTimeline ---
function EscrowTimeline() {
  return (
    <div className="bg-arc-surface border border-arc-border p-5 h-[150px] hidden md:block">
      <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider mb-6">Task Lifecycle: Escrow Timeline</h3>
      <div className="flex justify-between items-center relative z-10 w-full px-8 text-xs font-mono">
        <div className="absolute top-3 left-12 right-12 h-0.5 bg-[#222] -z-10" />
        
        <div className="flex flex-col items-center">
           <div className="w-6 h-6 rounded-full bg-arc-green border-2 border-arc-green flex items-center justify-center mb-2"><CheckCircle className="w-4 h-4 text-[#0a0a0a]" /></div>
           <span className="text-arc-muted">Create Task</span>
        </div>
        <div className="flex flex-col items-center">
           <div className="w-6 h-6 rounded-full bg-arc-green border-2 border-arc-green flex items-center justify-center mb-2"><CheckCircle className="w-4 h-4 text-[#0a0a0a]" /></div>
           <span className="text-arc-muted">Agent Claims</span>
        </div>
        <div className="flex flex-col items-center">
           <div className="w-6 h-6 rounded-full border-2 border-arc-orange bg-[#0a0a0a] flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(255,83,0,0.5)]"></div>
           <span className="text-white">Submit Result</span>
        </div>
        <div className="flex flex-col items-center opacity-50">
           <div className="w-6 h-6 rounded-full border-2 border-arc-border bg-[#0a0a0a] flex items-center justify-center mb-2"></div>
           <span className="text-arc-muted">Approve & Pay</span>
        </div>
      </div>
    </div>
  );
}

export function TasksTab() {
  const [running, setRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleTemplateSelect = (id: string) => {
    setRunning(true);
    // In a real app, this would change the stream messages or parameters
    console.log(`Template selected: ${id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-arc-surface border border-arc-border" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="h-64 bg-arc-surface border border-arc-border" />
            <div className="h-64 bg-arc-surface border border-arc-border" />
          </div>
          <div className="space-y-6">
             <div className="h-48 bg-arc-surface border border-arc-border" />
             <div className="h-64 bg-arc-surface border border-arc-border" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Tasks & Pipelines</h2>
          <p className="text-arc-muted text-sm mt-1">Orchestrate complex agent workflows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6 flex flex-col">
          <TaskDAGVisualization running={running} />
          <EscrowTimeline />
          <div className="flex-1 min-h-0">
             <AgentChat running={running} />
          </div>
        </div>
        <div className="space-y-6">
          <DemoLauncher running={running} setRunning={setRunning} onTemplateSelect={handleTemplateSelect} />
          <TaskTemplates />
          <TaskFeed />
        </div>
      </div>
    </div>
  );
}
