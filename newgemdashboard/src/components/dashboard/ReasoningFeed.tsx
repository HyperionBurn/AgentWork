import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../../lib/utils';

export function ReasoningFeed() {
  const [messages, setMessages] = useState<{ id: string, text: string, agent: string, type: string }[]>([
    { id: 'initial', text: "ARC Virtual Machine initialized. Monitoring neural pathways...", agent: "🧠 Orchestrator", type: "info" },
  ]);

  useEffect(() => {
    // Try to fetch real reasoning feed if available, otherwise fallback to local generation
    const interval = setInterval(async () => {
      try {
        const data = await apiFetch<{ events: any[] }>('/api/reasoning');
        if (data.events && data.events.length > 0) {
          const mappedMessages = data.events.map(ev => ({
            id: ev.id,
            text: ev.reasoning?.decision || ev.result || "Processing...",
            agent: ev.reasoning?.agent || ev.agent_type,
            type: ev.status === 'error' ? 'error' : 'info'
          }));
          setMessages(prev => [...prev, ...mappedMessages].slice(-5));
          return;
        }
      } catch (e) {
        // Fallback simulation
        const payloads = [
          { text: "Detected reentrancy risk on line 42.", agent: "🛡️ QA_Sentinel", type: "review" },
          { text: "Executing parameter fuzzing (10k iterations).", agent: "⚡ Research_Alpha", type: "info" },
          { text: "Deployed fix to testnet-arc-3.", agent: "💻 Code_Weaver", type: "code" },
          { text: "Validating cross-chain messaging payload.", agent: "🛡️ QA_Sentinel", type: "review" },
          { text: "Orchestrator requesting consensus on deployment.", agent: "🧠 Orchestrator", type: "info" },
          { text: "Writing test assertions for edge cases.", agent: "💻 Code_Weaver", type: "code" },
        ];
        const payload = payloads[Math.floor(Math.random() * payloads.length)];
        setMessages(prev => [...prev, { id: Math.random().toString(), ...payload }].slice(-5));
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-10 border-t border-white/[0.05] bg-black/40 backdrop-blur-md flex items-center px-4 overflow-hidden fixed bottom-0 left-0 right-0 z-50 shrink-0">
      <div className="flex items-center space-x-2 mr-6 shrink-0">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
        <span className="text-[10px] font-mono text-orange-500 font-bold uppercase tracking-widest">Neural Link</span>
      </div>
      <div className="flex-1 relative h-full">
        <AnimatePresence mode="popLayout">
          {messages.slice(-1).map((m) => (
            <motion.div
              key={m.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="absolute inset-0 flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                 <span className="text-[10px] font-mono text-white/40 uppercase">{m.agent}</span>
                 <div className="w-1 h-1 rounded-full bg-white/20" />
              </div>
              <span className="text-[11px] font-mono text-white/80 truncate max-w-4xl tracking-tight">
                {m.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="hidden md:flex items-center space-x-4 shrink-0 text-[9px] font-mono text-white/20 uppercase tracking-widest">
         <span>Block 14.2M</span>
         <span>Latency 12ms</span>
         <span>Node ARC-01-SYD</span>
      </div>
    </div>
  );
}
