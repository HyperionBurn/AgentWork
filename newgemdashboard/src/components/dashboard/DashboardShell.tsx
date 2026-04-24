import React, { useState, useEffect, useMemo } from 'react';
import { NavSidebar } from './NavSidebar';
import { WalletConnect } from './WalletConnect';
import { useShortcuts } from '../../lib/useShortcuts';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Search, Terminal, X, Zap, ChevronRight, Play, Server, Clock, Shield } from 'lucide-react';
import { audioEngine } from '../../lib/audio';
import { cn } from '../../lib/utils';
import { ReasoningFeed } from './ReasoningFeed';
import { DemoNotification } from './DemoNotification';

// --- OnboardingTour ---
function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { 
      title: "PROTOCOL INITIALIZED", 
      desc: "Welcome to ARC Terminal. You are commanding a high-frequency multi-chain orchestrator. Calibrating neuro-interface...",
      icon: <Zap className="w-10 h-10 text-orange-500" />
    },
    { 
      title: "AGENT REGISTRY", 
      desc: "Deploy specialized LLM agents via our decentralized registry to perform cross-domain research or code generation.",
      icon: <Server className="w-8 h-8 text-orange-500" />
    },
    { 
      title: "FINALITY & PROOFS", 
      desc: "Every computation is finalized on L3 with sub-12ms latency. Monitor cryptographic proofs in the Evidence tab.",
      icon: <Shield className="w-8 h-8 text-green-400" />
    },
    { 
      title: "KEYBOARD COMMANDS", 
      desc: "Use [1-9] to switch tabs. Cmd+K to open the command nexus. '?' for the tactical shortcut manual.",
      icon: <Terminal className="w-8 h-8 text-white/50" />
    }
  ];

  const handleNext = () => {
    audioEngine.play('click');
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-md w-full glass-surface border border-orange-500/20 p-10 text-center relative overflow-hidden rounded-[3rem]"
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="py-6"
          >
            <div className="flex justify-center mb-8">{steps[step].icon}</div>
            <h3 className="text-2xl font-light text-white mb-4 tracking-tighter uppercase">{steps[step].title}</h3>
            <p className="text-white/40 text-sm leading-relaxed mb-10 font-mono uppercase text-[10px] tracking-widest">{steps[step].desc}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-4">
          <div className="flex space-x-1.5">
            {steps.map((_, i) => (
              <div key={i} className={cn("w-6 h-1 rounded-full transition-all", step === i ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]" : "bg-white/5")} />
            ))}
          </div>
          <button 
            onClick={handleNext}
            className="flex items-center space-x-3 text-orange-500 font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:text-white transition-colors group"
          >
            <span>{step === steps.length - 1 ? "INITIALIZE" : "CONTINUE"}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DashboardShell({ children, activeTab, setActiveTab }: { children: React.ReactNode, activeTab: string, setActiveTab: (t: string) => void }) {
  useShortcuts(setActiveTab);
  
  const [showSearch, setShowSearch] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('arc-onboarding-seen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('arc-onboarding-seen', 'true');
    setShowOnboarding(false);
    audioEngine.play('success');
  };

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const items = [
      { id: '1', title: 'Market Sentiment Node', category: 'Agent', tab: 'agents' },
      { id: '2', title: 'Code Settlement Path', category: 'Logic', tab: 'playground' },
      { id: '3', title: 'Consensus Analytics', category: 'Economy', tab: 'economy' },
      { id: '4', title: 'Cryptographic Proofs', category: 'Evidence', tab: 'evidence' },
      { id: '5', title: 'Protocol AIPs', category: 'Governance', tab: 'governance' },
    ];
    return items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  useEffect(() => {
    const handleOpenSearch = () => setShowSearch(true);
    const handleToggleHelp = () => setShowHelp(prev => !prev);
    const handleCloseMods = () => {
      setShowSearch(false);
      setShowHelp(false);
    };

    window.addEventListener('openSearchMode', handleOpenSearch);
    window.addEventListener('toggleHelpMode', handleToggleHelp);
    window.addEventListener('closeModals', handleCloseMods);

    return () => {
      window.removeEventListener('openSearchMode', handleOpenSearch);
      window.removeEventListener('toggleHelpMode', handleToggleHelp);
      window.removeEventListener('closeModals', handleCloseMods);
    };
  }, []);
  
  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans relative">
      <div className="bg-noise absolute inset-0 z-50 pointer-events-none opacity-[0.02]"></div>
      <DemoNotification />
      
      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-start justify-center pt-32 px-4"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
          >
            <motion.div 
              initial={{ scale: 0.98, y: -20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.98, y: -20, opacity: 0 }}
              className="bg-white/[0.02] border border-white/[0.08] w-full max-w-2xl rounded-[2rem] shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
               <div className="p-8 border-b border-white/[0.05]">
                 <div className="flex items-center space-x-4">
                    <Search className="w-6 h-6 text-orange-500" />
                    <input 
                      autoFocus 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ACCESSING GLOBAL REGISTRY..." 
                      className="w-full bg-transparent text-xl text-white font-mono outline-none placeholder:text-white/10 uppercase tracking-tight" 
                    />
                 </div>
               </div>
               
               <div className="max-h-[400px] overflow-y-auto">
                 {searchResults.length > 0 ? (
                    <div className="p-4">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => {
                            setActiveTab(result.tab);
                            setShowSearch(false);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] transition-all group rounded-2xl"
                        >
                          <div className="flex items-center space-x-5">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:border-orange-500/30 transition-all">
                              <Terminal className="w-4 h-4 text-white/20 group-hover:text-orange-500" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors uppercase tracking-tight">{result.title}</p>
                              <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">{result.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-mono text-white/30 uppercase">Jump to {result.tab}</span>
                            <ChevronRight className="w-3 h-3 text-orange-500" />
                          </div>
                        </button>
                      ))}
                    </div>
                 ) : searchQuery ? (
                    <div className="p-20 text-center">
                      <p className="text-white/20 font-mono text-xs uppercase tracking-widest animate-pulse">Scanning neuro-registry... no match found</p>
                    </div>
                 ) : (
                    <div className="p-20 text-center opacity-30">
                      <p className="text-white/10 font-mono text-[10px] uppercase tracking-[0.4em]">Awaiting tactical input...</p>
                    </div>
                 )}
               </div>

               <div className="p-5 bg-black/40 border-t border-white/[0.05] flex justify-between items-center">
                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2 text-white/10">
                      <kbd className="bg-white/5 px-2 py-1 rounded text-[9px] font-mono uppercase border border-white/5">ESC</kbd>
                      <span className="text-[9px] font-mono uppercase tracking-widest">Abort</span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/10">
                      <kbd className="bg-white/5 px-2 py-1 rounded text-[9px] font-mono uppercase border border-white/5">ENTER</kbd>
                      <span className="text-[9px] font-mono uppercase tracking-widest">Execute</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-white/5 uppercase tracking-[0.3em]">ARC Nexus v4.1.0</span>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Shortcuts Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-surface border border-white/10 p-10 max-w-lg w-full relative rounded-[3rem]"
              onClick={e => e.stopPropagation()}
            >
               <div className="flex items-center space-x-3 mb-8 border-b border-white/5 pb-6">
                  <Terminal className="w-5 h-5 text-orange-500" />
                  <h3 className="text-xl font-light text-white uppercase tracking-tighter">Tactical <span className="text-orange-500">Manual</span></h3>
               </div>
               <div className="space-y-5 font-mono text-[11px] uppercase tracking-widest text-white/40">
                 <div className="flex justify-between items-center"><span>Jump Tab [1-9]</span><span className="text-white">NODE CONTROL</span></div>
                 <div className="flex justify-between items-center"><span>Global Command Nexus</span><span className="text-white">CMD + K</span></div>
                 <div className="flex justify-between items-center"><span>Toggle Tactical Manual</span><span className="text-white">?</span></div>
                 <div className="flex justify-between items-center"><span>Execute Command</span><span className="text-white">ENTER</span></div>
                 <div className="flex justify-between items-center"><span>Abort Overlay</span><span className="text-white">ESC</span></div>
               </div>
               <button onClick={() => setShowHelp(false)} className="w-full mt-10 py-4 bg-orange-500 text-black font-bold uppercase tracking-[0.3em] font-mono text-[10px] hover:bg-orange-400 transition-colors rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                 DISMISS
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && <OnboardingTour onComplete={completeOnboarding} />}
        {showChangelog && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4"
            onClick={() => setShowChangelog(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-surface border border-white/10 p-12 max-w-xl w-full relative overflow-hidden rounded-[3rem]"
              onClick={e => e.stopPropagation()}
            >
               <div className="absolute top-0 right-0 p-8 opacity-5"><Zap className="w-40 h-40" /></div>
               <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
                  <h3 className="text-2xl font-light text-white uppercase tracking-tighter">System <span className="text-orange-500 font-mono">Updates</span></h3>
                  <span className="text-[10px] font-mono text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-widest">v4.2.0</span>
               </div>
               <div className="space-y-8">
                  <div className="flex items-start space-x-6">
                     <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                     <div>
                        <p className="text-[11px] font-mono text-white font-bold uppercase tracking-widest mb-1">Decentralized Evidence Stream</p>
                        <p className="text-xs text-white/30 leading-relaxed uppercase font-mono">L3 finality proofs now visible in real-time. Cryptographic validation prioritized.</p>
                     </div>
                  </div>
                  <div className="flex items-start space-x-6">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                     <div>
                        <p className="text-[11px] font-mono text-white font-bold uppercase tracking-widest mb-1">Optimized Execution Paths</p>
                        <p className="text-xs text-white/30 leading-relaxed uppercase font-mono">Agent sub-calls reduced by 40%. Settlement latency finalized at 12ms.</p>
                     </div>
                  </div>
               </div>
               <button onClick={() => setShowChangelog(false)} className="w-full mt-12 py-4 bg-white text-black font-bold uppercase text-[10px] tracking-[0.3em] font-mono hover:bg-orange-500 transition-colors rounded-xl">
                 ACKNOWLEDGE DATA
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Glow ambient background element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

        <header className="h-20 border-b border-white/[0.05] flex items-center justify-between px-10 bg-[#050505]/40 backdrop-blur-xl z-40 sticky top-0 shrink-0">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                <Zap className="w-5 h-5 text-black" />
              </div>
              <h1 className="text-xl font-light text-white tracking-widest lowercase">ARC <span className="font-mono text-orange-500 italic font-bold">TERMINAL</span></h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Network Stable</span>
              </div>
              <div className="flex items-center space-x-2">
                 <Clock className="w-3.5 h-3.5 text-white/20" />
                 <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">L3: 12ms</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 border-l border-white/5 pl-8">
              <button 
                onClick={() => setShowHelp(true)}
                className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.1] flex items-center justify-center hover:bg-white/10 transition-all text-white/30 hover:text-white"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowSearch(true)}
                className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.1] flex items-center justify-center hover:bg-white/10 transition-all text-white/30 hover:text-white"
              >
                <Search className="w-5 h-5" />
              </button>
              <WalletConnect />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth relative z-10 scrollbar-hide">
          {children}
        </main>

        <ReasoningFeed />
      </div>
    </div>
  );
}
