import { motion } from "motion/react";
import { Hexagon } from "lucide-react";

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-6"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <Hexagon className="w-5 h-5 text-orange-500 fill-orange-500/20" />
        </div>
        <span className="font-display font-medium text-lg tracking-wide text-white">agenwork</span>
      </div>

      <div className="hidden md:flex items-center gap-8 glass-pill px-8 py-3 rounded-full">
        {['Network', 'Agents', 'Protocol', 'Governance'].map((item) => (
          <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-white/60 hover:text-white transition-colors">
            {item}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <a href="https://github.com/HyperionBurn/AgentWork#readme" target="_blank" rel="noopener noreferrer" className="hidden md:block text-sm font-medium text-white/80 hover:text-white transition-colors">
          Documentation
        </a>
        <a href="https://github.com/HyperionBurn/AgentWork" target="_blank" rel="noopener noreferrer" className="glass-pill px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white/5 transition-colors border-orange-500/30 text-orange-50">
          Initialize Node
        </a>
      </div>
    </motion.nav>
  );
}
