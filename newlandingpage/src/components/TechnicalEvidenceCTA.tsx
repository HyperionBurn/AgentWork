import { motion } from "motion/react";
import { ChevronRight, FileCode2 } from "lucide-react";

export default function TechnicalEvidenceCTA() {
  return (
    <section id="governance" className="relative z-10 py-32 px-6 overflow-hidden border-t border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="max-w-xl">
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="inline-flex py-1 px-3 glass-pill items-center gap-2 rounded-full mb-8 border border-orange-500/30"
          >
             <FileCode2 className="w-4 h-4 text-orange-500" />
             <span className="text-xs uppercase tracking-widest text-orange-100 font-mono">Verifiable Code</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-light leading-tight mb-6"
          >
            Don't trust us.<br />
            <span className="text-white/40">Verify the protocol.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/50 font-light text-lg mb-8 leading-relaxed"
          >
            Review our open-source settlement contracts, zk-circuit implementations, and robust peer-to-peer networking layer on GitHub. Fully audited by top firms.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <a href="https://github.com/HyperionBurn/AgentWork" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-black hover:bg-white/90 px-8 py-4 rounded-full text-sm font-medium transition-colors group">
              View Source Repository
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>

        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 w-full bg-[#080808] border border-white/10 rounded-3xl p-8 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <FileCode2 className="w-32 h-32" />
            </div>
            
            <div className="space-y-6 relative z-10">
                <div>
                   <h4 className="text-xs font-mono text-orange-500 uppercase tracking-widest mb-2">Audit Status</h4>
                   <div className="flex gap-2">
                       <span className="glass-pill px-3 py-1 rounded-md text-xs font-mono text-green-400">PASSED: CertiK</span>
                       <span className="glass-pill px-3 py-1 rounded-md text-xs font-mono text-green-400">PASSED: Trail of Bits</span>
                   </div>
                </div>
                
                <div className="h-px bg-white/5" />

                <div>
                   <h4 className="text-xs font-mono text-orange-500 uppercase tracking-widest mb-2">Network Performance</h4>
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <div className="text-2xl font-light text-white mb-1">99.999%</div>
                           <div className="text-xs text-white/40">Uptime (Last 30 Days)</div>
                       </div>
                       <div>
                           <div className="text-2xl font-light text-white mb-1">0.8s</div>
                           <div className="text-xs text-white/40">Time to Finality</div>
                       </div>
                   </div>
                </div>
            </div>
        </motion.div>
      </div>
    </section>
  );
}
