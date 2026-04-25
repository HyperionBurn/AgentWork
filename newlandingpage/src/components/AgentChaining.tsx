import { motion } from "motion/react";
import { Bot, ArrowRight, Wallet, Blocks } from "lucide-react";

export default function AgentChaining() {
  return (
    <section id="agents" className="relative z-10 py-32 px-6 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto text-center mb-20 relative z-10">
        <h2 className="text-4xl md:text-6xl font-display font-light mb-6">Agent Chaining</h2>
        <p className="text-white/50 text-xl font-light mx-auto max-w-2xl">
          The orchestrator decomposes complex tasks into subtasks, routes them to specialist agents, and settles each payment on Arc L1 via Circle's x402 protocol.
        </p>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-4 w-48"
          >
            <div className="w-24 h-24 rounded-2xl glass-surface flex items-center justify-center border-orange-500/20 relative">
               <Bot className="w-10 h-10 text-white/80" />
               <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 border-2 border-black" />
            </div>
            <div className="text-center">
              <div className="font-medium">Research Agent</div>
              <div className="text-xs text-white/40 font-mono mt-1">:4021 · $0.005/call</div>
            </div>
          </motion.div>

          <div className="flex-1 hidden md:flex items-center justify-center relative h-24 min-w-[100px]">
            <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
               <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
               <motion.line 
                 x1="0" y1="50%" x2="100%" y2="50%" 
                 stroke="#f97316" 
                 strokeWidth="2" 
                 strokeDasharray="40 80" 
                 initial={{ strokeDashoffset: 120 }}
                 animate={{ strokeDashoffset: 0 }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                 style={{ filter: "drop-shadow(0 0 6px #f97316)" }}
               />
             </svg>
             <motion.div 
                className="absolute top-1/2 -translate-y-1/2 bg-[#050505] px-3 py-1 border border-white/10 rounded-full z-10"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
             >
                <div className="flex items-center gap-2 text-[10px] font-mono text-orange-400 uppercase">
                  <Wallet className="w-3 h-3" />
                  <span>Settling</span>
                </div>
             </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-4 w-48"
          >
            <div className="w-24 h-24 rounded-2xl glass-surface flex items-center justify-center border-orange-500/20 shadow-[0_0_40px_-10px_rgba(249,115,22,0.3)] relative">
               <Blocks className="w-10 h-10 text-orange-500" />
               <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 border-2 border-black" />
            </div>
             <div className="text-center">
              <div className="font-medium text-orange-50">Code Agent</div>
              <div className="text-xs text-orange-500/50 font-mono mt-1">:4022 · $0.005/call</div>
            </div>
          </motion.div>

          <div className="flex-1 hidden md:flex items-center justify-center relative h-24 min-w-[100px]">
             <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
               <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
               <motion.line 
                 x1="0" y1="50%" x2="100%" y2="50%" 
                 stroke="#22c55e" 
                 strokeWidth="2" 
                 strokeDasharray="40 80" 
                 initial={{ strokeDashoffset: 120 }}
                 animate={{ strokeDashoffset: 0 }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.75 }}
                 style={{ filter: "drop-shadow(0 0 6px #22c55e)" }}
               />
             </svg>
             <motion.div 
                className="absolute top-1/2 -translate-y-1/2 bg-[#050505] px-3 py-1 border border-white/10 rounded-full z-10"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
             >
                <div className="flex items-center gap-2 text-[10px] font-mono text-green-400 uppercase">
                  <Wallet className="w-3 h-3" />
                  <span>Verify</span>
                </div>
             </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-4 w-48"
          >
            <div className="w-24 h-24 rounded-full glass-surface flex items-center justify-center border-orange-500/20 relative">
               <Bot className="w-10 h-10 text-white/80" />
               <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-blue-500 border-2 border-black" />
            </div>
             <div className="text-center">
              <div className="font-medium">Test Agent</div>
              <div className="text-xs text-white/40 font-mono mt-1">:4023 · $0.005/call</div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
