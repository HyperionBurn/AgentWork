import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Terminal, Zap, DollarSign, CheckCircle2, AlertTriangle, ShieldCheck, Cpu, Volume2, VolumeX, Server, Loader2 } from 'lucide-react';
import { apiFetch, cn, formatCurrency } from '../../../lib/utils';
import { useDashboardStore } from '../../../lib/store';

interface PlaygroundEvent {
  id: string;
  type: "status" | "payment" | "agent" | "result" | "error";
  status?: string;
  agent?: string;
  message: string;
  txHash?: string;
  amount?: number;
  explorerUrl?: string;
  timestamp: string;
  rawPayload?: any;
  rawResult?: any;
}

const ARC_EXPLORER_BASE = import.meta.env.VITE_ARC_EXPLORER || 'https://testnet.arcscan.app/tx/';

function isRealTransactionHash(value?: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(mock_|pending|\[pending|\[settling|undefined|null)$/i.test(trimmed)) return false;
  return /^0x[0-9a-fA-F]{64}$/.test(trimmed);
}

function normalizePercent(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return value > 1 ? value : value * 100;
}

function buildExplorerUrl(txHash?: string, explorerUrl?: string): string {
  if (explorerUrl && isRealTransactionHash(txHash)) return explorerUrl;
  if (!isRealTransactionHash(txHash)) return '';
  return `${ARC_EXPLORER_BASE}${txHash}`;
}

function shortHash(txHash: string): string {
  return txHash.length > 20 ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}` : txHash;
}

function formatJsonPrimitive(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.0+$/, '');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function JsonNode({ value, label, depth = 0 }: { value: unknown; label?: string; depth?: number }) {
  const indentClass = depth > 0 ? 'pl-4 border-l border-white/10' : '';

  if (Array.isArray(value)) {
    return (
      <div className={`${indentClass} space-y-2`}>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-orange-500">{label || 'array'}</span>
          <span className="text-[10px] font-mono text-white/30">{value.length} item{value.length === 1 ? '' : 's'}</span>
        </div>
        <div className="space-y-2">
          {value.map((item, index) => (
            <JsonNode key={`${label || 'item'}-${index}`} value={item} label={`[${index}]`} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div className={`${indentClass} space-y-2`}>
        {label && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-orange-500">{label}</span>
            <span className="h-px flex-1 bg-gradient-to-r from-orange-500/30 via-white/10 to-transparent" />
          </div>
        )}
        <div className="space-y-2">
          {entries.map(([key, nestedValue]) => (
            <JsonNode key={`${label || 'root'}-${key}`} value={nestedValue} label={key} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${indentClass} flex items-start gap-3 rounded-xl border border-white/10 bg-[#090909] px-3 py-2`}>
      {label && <span className="min-w-28 shrink-0 text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">{label}</span>}
      <span className="break-words text-[11px] text-white/80">{formatJsonPrimitive(value)}</span>
    </div>
  );
}

function JsonPayloadCard({ data }: { data: unknown }) {
  const fieldCount = data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data as Record<string, unknown>).length : Array.isArray(data) ? data.length : 1;

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0b0b0b] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-orange-500">Structured JSON</p>
          <p className="mt-1 text-[10px] text-white/30">{fieldCount} field{fieldCount === 1 ? '' : 's'} rendered</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/30">pretty view</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
        <JsonNode value={data} />
      </div>
    </div>
  );
}

function AgentOutputRenderer({ data, agent }: { data: any, agent: string }) {
  if (!data || typeof data !== 'object') {
    return <div className="text-white/80 text-[11px] font-mono whitespace-pre-wrap">{String(data)}</div>;
  }

  // Research Agent
  if (data.key_findings || agent === "research") {
    const confidence = normalizePercent(data.confidence);
    return (
      <div className="space-y-4">
        {confidence > 0 && (
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-orange-500/60 text-[10px] uppercase">Confidence</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500" style={{ width: `${Math.round(Math.min(confidence, 100))}%` }} />
            </div>
            <span className="text-orange-500 font-bold text-xs">{Math.round(Math.min(confidence, 100))}%</span>
          </div>
        )}
        {data.key_findings && (
          <div className="space-y-2">
            <h4 className="text-white/60 text-[10px] uppercase tracking-widest">Key Findings</h4>
            <ul className="space-y-2">
              {data.key_findings.map((f: string, i: number) => (
                <li key={i} className="flex space-x-2 text-white/80 text-xs">
                  <span className="text-orange-500">›</span>
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.sources && (
          <div className="space-y-2 pt-2">
            <h4 className="text-white/60 text-[10px] uppercase tracking-widest">Sources</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.sources.map((s: any, i: number) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 p-2 rounded-lg flex items-center justify-between">
                   <span className="text-white/70 text-[11px] truncate pr-2">{s.title}</span>
                   <span className="text-green-400 text-[10px] bg-green-400/10 px-1.5 py-0.5 rounded">{Math.round(Math.min(normalizePercent(s.relevance), 100))}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Code Agent
  if (data.code || agent === "code") {
    return (
      <div className="space-y-4">
        {data.files_modified && (
          <div className="flex flex-wrap gap-2 mb-4">
            {data.files_modified.map((f: string, i: number) => (
              <span key={i} className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-1 rounded-md border border-orange-500/20">
                {f}
              </span>
            ))}
          </div>
        )}
        {data.code && (
          <div className="bg-[#0D0D0D] border border-white/10 rounded-xl overflow-hidden">
            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-white/40 text-[10px] uppercase">{data.language || 'Code'}</span>
            </div>
            <pre className="p-4 text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-64 scrollbar-hide">
              <code>{data.code}</code>
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Test Agent
  if (data.test_suite || data.tests_generated !== undefined) {
    const coverage = Math.round(Math.min(normalizePercent(data.coverage), 100));
    return (
      <div className="space-y-4">
        <div className="flex space-x-4 mb-4">
           <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1 text-center">
             <div className="text-green-400 text-2xl font-light mb-1">{data.passing || 0}</div>
             <div className="text-white/40 text-[10px] uppercase tracking-widest">Passing</div>
           </div>
           <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1 text-center">
             <div className="text-red-400 text-2xl font-light mb-1">{data.failing || 0}</div>
             <div className="text-white/40 text-[10px] uppercase tracking-widest">Failing</div>
           </div>
           <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1 text-center">
             <div className="text-orange-400 text-2xl font-light mb-1">{coverage}%</div>
             <div className="text-white/40 text-[10px] uppercase tracking-widest">Coverage</div>
           </div>
        </div>
        {data.test_suite && (
          <div className="bg-black/40 border border-white/5 rounded-xl p-4">
            <pre className="text-[10px] text-white/60 font-mono whitespace-pre-wrap">{data.test_suite}</pre>
          </div>
        )}
      </div>
    );
  }

  // Review Agent
  if (data.quality_score || agent === "review") {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4 mb-4">
           <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" className="text-orange-500" strokeWidth="4" strokeDasharray="175" strokeDashoffset={175 - (175 * (data.quality_score || 0)) / 100} />
              </svg>
              <span className="text-white font-bold text-lg">{data.quality_score || 0}</span>
           </div>
           <div>
             <h4 className="text-white font-bold">Quality Assessment</h4>
             <p className="text-white/40 text-xs mt-1">{data.approved ? 'Approved for deployment' : 'Needs revisions'}</p>
           </div>
        </div>
        
        {data.issues && data.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-white/60 text-[10px] uppercase tracking-widest">Issues Identified</h4>
            <div className="space-y-2">
              {data.issues.map((iss: any, i: number) => (
                <div key={i} className="bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg flex items-start space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-white/80 text-xs">{iss.description || iss}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.suggestions && data.suggestions.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-white/60 text-[10px] uppercase tracking-widest">Suggestions</h4>
            <ul className="space-y-2">
              {data.suggestions.map((s: string, i: number) => (
                <li key={i} className="flex space-x-2 text-white/60 text-xs">
                  <span className="text-orange-500">›</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <JsonPayloadCard data={data} />
  );
}

const AGENT_COLORS: Record<string, string> = {
  "orchestrator": "text-white",
  "research": "text-blue-400",
  "code": "text-purple-400",
  "test": "text-green-400",
  "review": "text-amber-400",
  "review-agent": "text-amber-400",
  "research→code": "text-blue-400",
  "code→test": "text-purple-400",
  "test→review": "text-green-400",
  "research→review": "text-blue-400",
  "code→review": "text-purple-400",
};

const SUGGESTED_TASKS = [
  "Audit UniswapV2 smart contract for reentrancy vulnerabilities",
  "Generate a cross-chain arbitrage bot for USDC/DAI",
  "Research recent L2 scaling solutions and summarize governance trends",
  "Analyze MEV patterns on Base network during peak hours"
];

export default function PlaygroundTab() {
  const [task, setTask] = useState("");
  const [executing, setExecuting] = useState(false);
  const [booting, setBooting] = useState(false);
  const [bootStage, setBootStage] = useState(0);
  const [events, setEvents] = useState<PlaygroundEvent[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [step, setStep] = useState(0); // 0: Idle, 1: Decompose, 2: Route, 3: Pay, 4: Verify
  const logEndRef = useRef<HTMLDivElement>(null);

  const BOOT_STAGES = [
    "📡 Establishing Secure Channel to Arc L1...",
    "🧠 Gemini Brain: Analyzing task architecture...",
    "🧩 Decomposing complex logic into atomic subtasks...",
    "🤖 Recruiting high-reputation specialized agents...",
    "💰 Calculating USDC nanopayment escrows..."
  ];

  // Cycle boot stages with smooth easing
  useEffect(() => {
    if (!booting) return;
    const interval = setInterval(() => {
      setBootStage(prev => (prev + 1) % BOOT_STAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [booting]);

  const totalCost = events.reduce((acc, ev) => acc + (ev.amount || 0), 0);

  // Auto-scroll disabled per user request
  // useEffect(() => {
  //   logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [events]);

  const handleLaunch = async (inputTask?: string, forceGroq?: boolean) => {
    const taskToLaunch = inputTask || task;
    if (!taskToLaunch) return;

    setExecuting(true);
    setBooting(true);
    setEvents([]);
    setStep(1);
    
    useDashboardStore.getState().addNotification({ title: 'Task Initiation', message: 'Launching real orchestrator...', type: 'info' });

    try {
      // 1. Start the real orchestrator via the Backend API
      const response = await apiFetch<any>('/api/demo-launch', {
        method: 'POST',
        body: JSON.stringify({
          task: taskToLaunch,
          runs: 1,
          forceGroq: forceGroq || false
        })
      });

      if (response.status === 'started') {
        const id = Math.random().toString(36).substring(7);
        setEvents(prev => [...prev, {
          id,
          type: "status",
          message: `Orchestrator started (PID: ${response.pid})`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error: any) {
      console.error('Launch failed:', error);
      const id = Math.random().toString(36).substring(7);
      setEvents(prev => [...prev, {
        id,
        type: "error",
        message: `Launch failed: ${error.message}. Is the dashboard backend running on port 3003?`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setExecuting(false);
      setBooting(false);
    }
  };

  // Real-time subscription for the playground
  useEffect(() => {
    if (!executing) return;

    let unsubscribe: () => void = () => {};

    const setupSubscription = async () => {
      const { subscribeToTasks } = await import('../../../lib/supabase');
      
      unsubscribe = subscribeToTasks((ev: any) => {
        // Map backend status to UI steps (Sticky — only move forward)
        if (ev.status === 'routing_decision') setStep(prev => Math.max(prev, 2));
        if (ev.status === 'completed' || ev.status === 'started_task') setStep(prev => Math.max(prev, 3));
        if (ev.status === 'receipt_generated') {
          setStep(prev => Math.max(prev, 4));
          setExecuting(false);
          setBooting(false);
        }

        // Hide booting once we get any real signal from the backend
        if (ev.agent || ev.status !== 'started') {
          setBooting(false);
        }

        setEvents(prev => {
          // Prevent duplicates by ID if backend sends multiple
          if (prev.some(p => p.id === ev.id)) return prev;
          
            let msg = ev.message;
            let rawPayload = ev.rawResult || ev.rawPayload;
            
            // ========= STEP 1: Unwrap agent response envelope =========
            // Agent responses come as: { success, agent, paid_by, amount, result: { summary, key_findings, code, ... } }
            // We want the inner .result for AgentOutputRenderer to render correctly.
            if (rawPayload && typeof rawPayload === 'object') {
              if (rawPayload.success === true && rawPayload.result !== undefined) {
                // Full agent response envelope — extract inner .result
                rawPayload = typeof rawPayload.result === 'object' ? rawPayload.result : rawPayload;
              }
            }
            
            // ========= STEP 2: Parse string message if no rawResult =========
            if (!rawPayload && msg && typeof msg === 'string' && (msg.trim().startsWith('{') || msg.trim().startsWith('['))) {
              try {
                const parsed = JSON.parse(msg);
                // Unwrap agent response envelope
                if (parsed.success === true && parsed.result && typeof parsed.result === 'object') {
                  rawPayload = parsed.result;
                } else {
                  rawPayload = parsed.result || parsed.decision || parsed.error || parsed;
                }
              } catch (e) {}
            }

            // ========= STEP 3: Generate readable message from payload =========
            if (rawPayload && typeof rawPayload === 'object') {
              // Agent output types
              if (rawPayload.summary && rawPayload.key_findings) {
                msg = rawPayload.summary;
              } else if (rawPayload.code) {
                msg = rawPayload.summary || `Generated ${rawPayload.language || ''} code`;
              } else if (rawPayload.test_suite || rawPayload.tests_generated !== undefined) {
                msg = `${rawPayload.passing || 0}/${(rawPayload.passing || 0) + (rawPayload.failing || 0)} tests passing, ${Math.round(Math.min(normalizePercent(rawPayload.coverage), 100))}% coverage`;
              } else if (rawPayload.quality_score !== undefined) {
                msg = `Quality Score: ${rawPayload.quality_score}/100${rawPayload.approved ? ' ✅ Approved' : ' ⚠️ Needs Work'}`;
              }
              // Orchestrator event types
              else if (rawPayload.type === 'routing') {
                msg = `📡 Routing: ${rawPayload.routing} — ${rawPayload.reasoning || ''}`;
                rawPayload = null; // Don't render as agent output
              } else if (rawPayload.type === 'evaluation') {
                msg = `⭐ ${rawPayload.agent}: ${rawPayload.score}/100 — ${rawPayload.feedback || ''}`;
                rawPayload = null;
              } else if (rawPayload.type === 'run_complete') {
                msg = `✅ Run ${rawPayload.run}/${rawPayload.totalRuns} complete — ${rawPayload.successful} successful, ${rawPayload.totalCost} spent`;
                rawPayload = null;
              }
              // Fallback: try to extract a summary
              else if (!msg || (typeof msg === 'string' && msg.trim().startsWith('{'))) {
                msg = rawPayload.summary || rawPayload.reasoning || rawPayload.feedback || '';
              }
              // If payload is empty/meaningless object like {}, don't render it
              if (rawPayload && typeof rawPayload === 'object' && Object.keys(rawPayload).length === 0) {
                rawPayload = null;
                if (!msg || msg.trim() === '') msg = ev.message || `${ev.agent || 'SYSTEM'} ${ev.status}`;
              }
            }
            if (typeof msg === 'object' && msg !== null) {
               msg = JSON.stringify(msg, null, 2);
            }
            
            return [...prev, {
              id: ev.id,
              type: ev.status === 'failed' ? 'error' : (ev.status === 'completed' ? 'result' : (ev.status === 'payment' ? 'payment' : 'status')),
              status: ev.status,
              message: msg || `${ev.agent || 'SYSTEM'} ${ev.status}`,
              agent: ev.agent,
              txHash: ev.gateway_tx || ev.txHash,
              explorerUrl: ev.explorerUrl || buildExplorerUrl(ev.gateway_tx || ev.txHash),
              amount: ev.amount,
              timestamp: new Date(ev.timestamp).toLocaleTimeString(),
              rawPayload,
          } as PlaygroundEvent];
        });
      });
    };

    setupSubscription();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [executing]);

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Command Entry */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-surface p-8 rounded-[2.5rem] border border-white/[0.08] relative overflow-hidden group min-h-[500px] flex flex-col">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full group-hover:bg-orange-500/10 transition-all duration-1000" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono text-white/80 uppercase tracking-widest">Command <span className="text-orange-500">Nexus</span></h3>
                    <p className="text-[10px] text-white/20 font-mono">v4.02-stable-arc</p>
                  </div>
               </div>
               <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/20 hover:text-orange-500"
              >
                 {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
               </button>
            </div>

            <div className="relative mb-6 z-10">
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Describe your cross-chain orchestration requirements..."
                className="w-full h-32 bg-white/[0.02] border border-white/[0.1] rounded-2xl p-6 text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-all placeholder:text-white/10"
              />
              <div className="absolute bottom-4 right-4 flex space-x-2">
                <button
                  onClick={() => handleLaunch("Build a REST API with user authentication, CRUD endpoints, and unit tests", true)}
                  disabled={executing}
                  className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-bold transition-all"
                >
                  <span>REST API Demo</span>
                </button>
                <button
                  onClick={() => handleLaunch()}
                  disabled={executing || !task}
                  className="bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black px-6 py-2 rounded-xl flex items-center space-x-2 font-bold transition-all shadow-lg shadow-orange-500/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>{executing ? "EXECUTING..." : "DEPLOY"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 z-10">
               <div className="flex items-center space-x-2">
                 <Terminal className="w-3.5 h-3.5 text-orange-500" />
                 <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Live Trace Log</span>
               </div>
               <div className="flex space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/30" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/30" />
                  <div className="w-2 h-2 rounded-full bg-green-500/30" />
               </div>
            </div>

            <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-6 font-mono text-[11px] overflow-y-auto space-y-3 scrollbar-hide min-h-[200px] z-10">
               {events.length === 0 && !executing && (
                 <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-30">
                    <Terminal className="w-12 h-12 text-orange-500/50" />
                    <p className="text-white/40 text-center italic uppercase tracking-widest text-[10px]">Awaiting deployment instructions...</p>
                 </div>
               )}

               <AnimatePresence>
                 {booting && (
                   <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050505]/80 backdrop-blur-sm rounded-2xl border border-orange-500/10"
                   >
                     <div className="relative mb-8">
                        <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full animate-pulse" />
                        <div className="relative w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center overflow-hidden">
                           <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                           <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent" />
                        </div>
                     </div>
                     <div className="text-center space-y-3">
                        <h4 className="text-sm font-bold text-white uppercase tracking-[0.3em] animate-pulse">Orchestrator Initializing</h4>
                        <div className="h-5 flex items-center justify-center">
                          <AnimatePresence mode="wait">
                            <motion.p 
                              key={bootStage}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="text-[10px] font-mono text-orange-500/80"
                            >
                              {BOOT_STAGES[bootStage]}
                            </motion.p>
                          </AnimatePresence>
                        </div>
                        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto mt-4">
                           <motion.div 
                             initial={{ width: "0%" }}
                             animate={{ width: "100%" }}
                             transition={{ duration: 10, ease: "linear" }}
                             className="h-full bg-orange-500" 
                           />
                        </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
               {events.map((event, i) => (
                 <motion.div 
                   initial={{ opacity: 0, x: -5 }}
                   animate={{ opacity: 1, x: 0 }}
                   key={event.id} 
                   className="flex space-x-4"
                 >
                    <span className="text-white/10 shrink-0">[{event.timestamp}]</span>
                    <span className={cn("font-bold min-w-[100px] uppercase tracking-tighter shrink-0", AGENT_COLORS[event.agent || ''] || 'text-white/20')}>
                       {event.agent ? (event.agent.includes('→') ? event.agent.toUpperCase() : event.agent.toUpperCase() + ':') : 'SYSTEM:'}
                    </span>
                    <div className={cn(
                      "flex-1 leading-relaxed break-words",
                      event.type === 'error' ? 'text-red-400 whitespace-pre-wrap' : 
                      event.type === 'payment' ? 'text-green-400 whitespace-pre-wrap' :
                      event.type === 'result' ? 'text-orange-500 font-bold' : 'text-white/60 whitespace-pre-wrap'
                    )}>
                      <div className="space-y-2">
                        {event.rawPayload ? (
                          <div className="mt-2 mb-2">
                             <AgentOutputRenderer data={event.rawPayload} agent={event.agent?.toLowerCase() || ''} />
                          </div>
                        ) : (
                          <div>{event.message}</div>
                        )}
                      {buildExplorerUrl(event.txHash, event.explorerUrl) ? (
                        <a
                          href={buildExplorerUrl(event.txHash, event.explorerUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-mono tracking-wide text-white/40 transition-colors hover:border-orange-500/30 hover:text-orange-300 hover:bg-orange-500/5"
                        >
                          <span className="text-white/35">🔗</span>
                          <span>Open explorer</span>
                          <span className="text-white/20">{shortHash(event.txHash || '')}</span>
                        </a>
                      ) : event.txHash ? (
                        <div className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-mono tracking-wide text-white/40">
                          <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
                          <span className="text-orange-400">Settling transaction...</span>
                          <span className="text-white/20">{shortHash(event.txHash)}</span>
                        </div>
                      ) : null}
                      </div>
                    </div>
                 </motion.div>
               ))}
               <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Info & Stepper */}
        <div className="space-y-6">
          <div className="glass-surface p-8 rounded-[2.5rem] border border-white/[0.08]">
             <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] mb-8">Orchestration Phase</h3>
             <div className="space-y-6">
                {[
                  { id: 1, label: "Decompose", icon: Cpu },
                  { id: 2, label: "Route", icon: Zap },
                  { id: 3, label: "Settlement", icon: DollarSign },
                  { id: 4, label: "Verification", icon: ShieldCheck },
                ].map((s) => (
                  <div key={s.id} className={cn(
                    "flex items-center space-x-4 p-4 rounded-2xl transition-all border",
                    step === s.id ? "bg-orange-500/10 border-orange-500/30" : "bg-white/[0.02] border-transparent opacity-40 grayscale"
                  )}>
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      step === s.id ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20" : "bg-white/5 text-white/40"
                    )}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={cn("text-xs font-bold uppercase tracking-widest", step === s.id ? "text-white" : "text-white/40")}>{s.label}</p>
                      <p className="text-[9px] font-mono text-white/20 mt-0.5">
                        {step > s.id ? 'VERIFIED' : step === s.id ? 'ACTIVE' : 'PENDING'}
                      </p>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="glass-surface p-8 rounded-[2.5rem] border border-white/[0.08] relative overflow-hidden">
             <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-500/5 blur-3xl rounded-full" />
             <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] mb-6">Live Settlement</h3>
             <div className="space-y-4 mb-8">
                {events.filter(e => e.type === 'payment').map((p) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={p.id} 
                    className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]"
                  >
                    <div className="flex items-center space-x-3">
                       <Zap className="w-3 h-3 text-orange-500" />
                       <span className="text-[10px] font-mono text-white/60">{p.agent}</span>
                    </div>
                    <span className="text-[10px] font-mono text-green-400">+{formatCurrency(p.amount || 0)}</span>
                  </motion.div>
                ))}
                {events.filter(e => e.type === 'payment').length === 0 && (
                  <p className="text-[10px] font-mono text-white/10 italic py-4 text-center border border-dashed border-white/5 rounded-xl">No payments registered...</p>
                )}
             </div>
             <div className="border-t border-white/[0.05] pt-6 flex justify-between items-end">
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Total Burn</span>
                <div className="text-right">
                  <span className="text-3xl font-light text-white leading-none">{formatCurrency(totalCost)}</span>
                  <p className="text-[8px] font-mono text-orange-500 uppercase mt-1 tracking-tighter">ARC L3 Optimized</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
