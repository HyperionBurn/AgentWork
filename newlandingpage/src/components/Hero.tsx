import { motion } from "motion/react";
import { ArrowRight, Activity } from "lucide-react";
import MagneticButton from "./MagneticButton"; // Added import

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-black/0 to-black/0" />
      
      <div className="max-w-5xl mx-auto w-full z-10 flex flex-col items-center text-center mt-20">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
           className="glass-pill px-4 py-1.5 rounded-full flex items-center gap-2 mb-8 border-orange-500/20"
        >
            <Activity className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-mono text-orange-200/80 uppercase tracking-wider">Network Status: Nominal — 7 Active Nodes</span>
        </motion.div>

        <h1 className="text-6xl md:text-8xl lg:text-[110px] font-display font-light leading-[0.85] tracking-tight mb-8">
          <div className="overflow-hidden pb-4 -mb-4">
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-gradient">Agentic Work.</span>
            </motion.div>
          </div>
          <div className="overflow-hidden pb-4 -mb-4">
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-white">Settled Instantly.</span>
            </motion.div>
          </div>
        </h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-white/50 max-w-2xl font-light mb-12 leading-relaxed"
        >
          The first multi-agent payment protocol built for autonomous machine-to-machine settlements. Execute complex task chains with cryptographically guaranteed compensation.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <MagneticButton onClick={() => window.open(import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:3001', '_blank')} intensity={0.3} className="bg-orange-600 hover:bg-orange-500 text-white rounded-full px-8 py-4 text-sm font-medium transition-all shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)] flex items-center gap-2 group cursor-pointer">
            Deploy Smart Agent
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </MagneticButton>
          <MagneticButton onClick={() => window.open('https://github.com/HyperionBurn/AgentWork/blob/main/docs/MARGIN_ANALYSIS.md', '_blank')} intensity={0.2} className="glass-pill rounded-full px-8 py-4 text-sm font-medium text-white hover:bg-white/5 transition-colors cursor-pointer">
            Read Whitepaper
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
