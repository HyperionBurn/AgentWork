import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Shield, Bell, User, Volume2, Database, Key, CheckCircle2, ChevronRight, Zap, Monitor, Globe } from 'lucide-react';
import { audioEngine } from '../../../lib/audio';
import { cn } from '../../../lib/utils';

export default function SettingsTab() {
  const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem('arc-audio-enabled') !== 'false');
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [activeSection, setActiveSection] = useState('experience');

  const [apiKeys, setApiKeys] = useState({
    gemini: "••••••••••••••••",
    supabase: "••••••••••••••••",
    gateway: "••••••••••••••••"
  });

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    audioEngine.setEnabled(newState);
    localStorage.setItem('arc-audio-enabled', String(newState));
    if (newState) audioEngine.play('click');
  };

  const sections = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'experience', label: 'Terminal Experience', icon: Monitor },
    { id: 'security', label: 'Security & API', icon: Shield },
    { id: 'network', label: 'Network Node', icon: Database },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Navigation */}
        <div className="w-full md:w-64 space-y-2">
           <h2 className="text-xl font-light text-white mb-8 px-4 uppercase tracking-tighter">System <span className="text-orange-500 font-mono italic text-sm">Config</span></h2>
           {sections.map((s) => (
             <button
               key={s.id}
               onClick={() => setActiveSection(s.id)}
               className={cn(
                 "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-mono text-[10px] uppercase tracking-widest text-left",
                 activeSection === s.id ? "bg-orange-500 text-black font-bold" : "text-white/40 hover:bg-white/5 hover:text-white"
               )}
             >
               <s.icon className="w-4 h-4" />
               <span>{s.label}</span>
             </button>
           ))}
        </div>

        {/* Content */}
        <div className="flex-1">
           <AnimatePresence mode="wait">
              {activeSection === 'experience' && (
                <motion.div
                  key="experience" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="glass-surface p-8 rounded-[2rem] border border-white/[0.08] space-y-8">
                      <div className="flex items-center justify-between">
                         <div>
                            <h3 className="text-lg font-medium text-white mb-1">Audio feedback</h3>
                            <p className="text-xs text-white/30 font-mono uppercase">Interface sound effects & alerts</p>
                         </div>
                         <button 
                           onClick={toggleAudio}
                           className={cn("w-12 h-6 rounded-full p-1 transition-colors", audioEnabled ? "bg-orange-500" : "bg-zinc-800")}
                         >
                           <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", audioEnabled ? "translate-x-6" : "translate-x-0")} />
                         </button>
                      </div>

                      <div className="flex items-center justify-between">
                         <div>
                            <h3 className="text-lg font-medium text-white mb-1">Developer Mode</h3>
                            <p className="text-xs text-white/30 font-mono uppercase">Verbose logs & low-level VM metrics</p>
                         </div>
                         <button 
                           onClick={() => setDevMode(!devMode)}
                           className={cn("w-12 h-6 rounded-full p-1 transition-colors", devMode ? "bg-orange-500" : "bg-zinc-800")}
                         >
                           <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", devMode ? "translate-x-6" : "translate-x-0")} />
                         </button>
                      </div>

                      <div className="pt-8 border-t border-white/[0.05]">
                         <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] block mb-4">Notification Volume</label>
                         <input type="range" className="w-full accent-orange-500" />
                      </div>
                   </div>
                </motion.div>
              )}

              {activeSection === 'security' && (
                <motion.div
                  key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="glass-surface p-8 rounded-[2rem] border border-white/[0.08] space-y-8">
                      <div className="flex items-center space-x-3 mb-6">
                         <Key className="w-5 h-5 text-orange-500" />
                         <h3 className="text-lg font-medium text-white">API Keys</h3>
                      </div>
                      <div className="space-y-6">
                         {Object.entries(apiKeys).map(([key, value]) => (
                           <div key={key} className="space-y-2">
                             <label className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{key} Provider</label>
                             <div className="flex space-x-3">
                               <div className="flex-1 bg-white/[0.02] border border-white/[0.1] rounded-xl px-4 py-3 font-mono text-sm text-white/40">
                                 {value}
                               </div>
                               <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-[10px] font-mono text-white/60">UPDATE</button>
                             </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="glass-surface p-8 rounded-[2rem] border border-white/[0.08]">
                      <div className="flex items-center justify-between text-yellow-500 mb-6">
                         <div className="flex items-center space-x-2">
                            <Shield className="w-5 h-5" />
                            <h3 className="text-lg font-medium">Session Guard</h3>
                         </div>
                         <span className="text-[10px] font-mono uppercase bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">Enabled</span>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed font-mono uppercase">
                         All transactions require multi-signature approval from the connected wallet provider. No private keys are stored on-server.
                      </p>
                   </div>
                </motion.div>
              )}

              {activeSection === 'profile' && (
                <motion.div
                   key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                   className="space-y-8"
                >
                   <div className="glass-surface p-12 rounded-[3rem] border border-white/[0.08] flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 p-1 mb-6 relative">
                         <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center">
                            <User className="w-10 h-10 text-white/20" />
                         </div>
                         <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-[#050505] rounded-full" />
                      </div>
                      <h3 className="text-2xl font-light text-white mb-2">Arc_Commander_01</h3>
                      <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-8">Registered since April 2024</p>
                      
                      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                         <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                            <p className="text-[9px] font-mono text-white/20 uppercase mb-1">Rank</p>
                            <p className="text-sm font-mono text-orange-500 font-bold">LEGENDARY</p>
                         </div>
                         <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                            <p className="text-[9px] font-mono text-white/20 uppercase mb-1">ID</p>
                            <p className="text-sm font-mono text-white">#04291</p>
                         </div>
                      </div>

                      <button 
                        onClick={() => {
                          useDashboardStore.getState().addNotification({ title: 'System Security', message: 'Generating system-wide authority certificate...', type: 'info' });
                          setTimeout(() => useDashboardStore.getState().addNotification('Root certificate successfully exported.', 'success'), 2000);
                        }}
                        className="mt-8 w-full max-w-md flex items-center justify-center space-x-3 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 hover:bg-white/10 hover:text-white transition-all"
                      >
                         <Database className="w-4 h-4 text-orange-500" />
                         <span>Download System Certificate</span>
                      </button>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
