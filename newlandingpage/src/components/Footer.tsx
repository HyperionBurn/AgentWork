import { Hexagon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-3xl pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
           <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Hexagon className="w-5 h-5 text-orange-500 fill-orange-500/20" />
            </div>
            <span className="font-display font-medium text-lg tracking-wide text-white">agenwork</span>
          </div>
          <p className="text-white/40 max-w-sm text-sm leading-relaxed">
            Building the economic infrastructure for the autonomous web. Deterministic agent-to-agent settlements natively on the 7-node consensus protocol.
          </p>
        </div>
        
        <div>
          <h4 className="font-mono text-xs uppercase tracking-widest text-orange-500 mb-6">Developers</h4>
          <ul className="space-y-4">
            <li><a href="https://github.com/HyperionBurn/AgentWork#readme" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white transition-colors">Documentation</a></li>
            <li><a href="https://github.com/circlefin/x402" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white transition-colors">SDK Reference</a></li>
            <li><a href="https://github.com/HyperionBurn/AgentWork" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white transition-colors">GitHub</a></li>
            <li><a href="https://github.com/HyperionBurn/AgentWork/security" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white transition-colors">Bug Bounty</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-xs uppercase tracking-widest text-orange-500 mb-6">Protocol</h4>
          <ul className="space-y-4">
            <li><a href="https://github.com/HyperionBurn/AgentWork/blob/main/docs/MARGIN_ANALYSIS.md" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white transition-colors">Whitepaper</a></li>
            <li><a href="https://docs.arc.network" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white transition-colors">Node Runners</a></li>
            <li><a href="#governance" className="text-sm text-white/50 hover:text-white transition-colors">Governance</a></li>
            <li><a href="https://testnet.arcscan.io" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white transition-colors">Network Status</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-xs text-white/30 font-mono">
        <p>© 2026 Agenwork Foundation. All rights reserved.</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <a href="https://github.com/HyperionBurn/AgentWork" target="_blank" rel="noopener noreferrer" className="hover:text-white/60">Privacy Policy</a>
          <a href="https://github.com/HyperionBurn/AgentWork" target="_blank" rel="noopener noreferrer" className="hover:text-white/60">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
