import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Cpu, Shield, Globe, Terminal, CheckCircle2, ChevronRight, ChevronLeft, Zap, Sparkles, Server } from 'lucide-react';
import { useDashboardStore } from '../../../lib/store';
import { apiFetch, cn } from '../../../lib/utils';

const STEPS = ["Parameters", "Role & Logic", "Orchestration", "Launch"];

export default function SubmitTab() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "Research",
    model: "llama-3-70b",
    role: "Expert analyst specializing in cross-chain data",
    systemPrompt: "",
    maxCap: 50.0,
    allowAutoPay: true
  });

  const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Demo stub: simulate endpoint since /api/agents POST isn't needed for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      useDashboardStore.getState().addNotification(`Node ${formData.name} Registered on ARC`, 'success');
      useDashboardStore.getState().addNotification('Verifying identity NFT...', 'info');
      setSuccess(true);
    } catch (e) {
      console.error('Submission failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
               <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] block">Agent Identity</label>
               <input 
                 type="text" 
                 value={formData.name}
                 onChange={e => setFormData({...formData, name: e.target.value})}
                 placeholder="e.g. Research_Alpha_v2"
                 className="w-full bg-white/[0.02] border border-white/[0.1] rounded-2xl p-6 text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-all"
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-4">
                 <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] block">Domain Type</label>
                 <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-white/[0.02] border border-white/[0.1] rounded-2xl p-4 text-white font-mono text-sm outline-none"
                 >
                    <option value="Research">Research</option>
                    <option value="Code">Code Generation</option>
                    <option value="Security">Security Audit</option>
                    <option value="Finance">Financial Analysis</option>
                 </select>
               </div>
               <div className="space-y-4">
                 <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] block">Primary Model</label>
                 <select 
                    value={formData.model}
                    onChange={e => setFormData({...formData, model: e.target.value})}
                    className="w-full bg-white/[0.02] border border-white/[0.1] rounded-2xl p-4 text-white font-mono text-sm outline-none"
                 >
                    <option value="llama-3-70b">Meta Llama 3 70B</option>
                    <option value="claude-3-5">Anthropic Claude 3.5</option>
                    <option value="gpt-4o">OpenAI GPT-4o</option>
                 </select>
               </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
               <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] block">System Directive</label>
               <textarea 
                 value={formData.systemPrompt}
                 onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
                 placeholder="Define the primary logic path for this orchestrator..."
                 className="w-full h-40 bg-white/[0.02] border border-white/[0.1] rounded-2xl p-6 text-white font-mono text-sm outline-none focus:border-orange-500/50 transition-all"
               />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-3xl space-y-6">
               <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">Auto-Proxy Execution</h4>
                    <p className="text-[10px] text-white/30 font-mono uppercase">Allow agent to settle sub-calls automatically</p>
                  </div>
                  <button 
                    onClick={() => setFormData({...formData, allowAutoPay: !formData.allowAutoPay})}
                    className={cn("w-12 h-6 rounded-full p-1 transition-colors", formData.allowAutoPay ? "bg-orange-500" : "bg-zinc-800")}
                  >
                    <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", formData.allowAutoPay ? "translate-x-6" : "translate-x-0")} />
                  </button>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] block">Session Budget Cap (USD)</label>
                  <input 
                    type="range" min="10" max="500" step="10"
                    value={formData.maxCap}
                    onChange={e => setFormData({...formData, maxCap: Number(e.target.value)})}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-white/40">
                     <span>$10</span>
                     <span className="text-orange-500 font-bold">${formData.maxCap}</span>
                     <span>$500</span>
                  </div>
               </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center justify-center py-10 space-y-8">
             <div className="relative">
                <div className="absolute -inset-4 bg-orange-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="w-24 h-24 bg-white/[0.03] border border-orange-500/50 rounded-3xl flex items-center justify-center relative">
                   <Zap className="w-10 h-10 text-orange-500" />
                </div>
             </div>
             <div className="text-center">
                <h3 className="text-xl font-light text-white mb-2 uppercase tracking-tighter">Ready for <span className="text-orange-500 italic">Deployment</span></h3>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest max-w-xs leading-relaxed">
                   Confirming neuro-pathway alignment for {formData.name}. Orchestration layer finalized.
                </p>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 glass-surface p-12 rounded-[3rem] border border-orange-500/30 text-center"
          >
             <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-8">
                <Sparkles className="w-10 h-10 text-green-400" />
             </div>
             <h2 className="text-3xl font-light text-white mb-4 uppercase tracking-tighter">Instance <span className="text-green-400">Deployed</span></h2>
             <p className="text-sm font-mono text-white/40 uppercase tracking-widest mb-10 max-w-sm">
                Neuro-logic finalized. Your agent is now visible in the Registry and processing cross-chain events.
             </p>
             <button 
               onClick={() => { setSuccess(false); setStep(0); }}
               className="px-10 py-4 bg-white text-black font-bold uppercase font-mono text-[10px] tracking-[0.3em] hover:bg-orange-500 transition-colors"
             >
                Initialize New Node
             </button>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {/* Steps Visualizer */}
            <div className="flex justify-between items-center px-4">
               {STEPS.map((s, i) => (
                 <div key={s} className="flex flex-col items-center space-y-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[10px] transition-all duration-500",
                      step === i ? "bg-orange-500 text-black font-bold shadow-[0_0_15px_rgba(249,115,22,0.4)]" : 
                      step > i ? "bg-white/20 text-white" : "bg-white/5 text-white/20"
                    )}>
                       {step > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={cn("text-[9px] font-mono uppercase tracking-[0.2em]", step === i ? "text-orange-500" : "text-white/20")}>{s}</span>
                 </div>
               ))}
               <div className="absolute left-[8%] right-[8%] top-[148px] h-[1px] bg-white/[0.05] -z-10" />
            </div>

            {/* Form Section */}
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-surface p-10 rounded-[3rem] border border-white/[0.08]"
            >
               {renderStep()}

               <div className="mt-12 flex justify-between">
                  <button 
                    onClick={handleBack}
                    disabled={step === 0}
                    className="flex items-center space-x-2 text-white/30 hover:text-white disabled:opacity-0 transition-opacity font-mono text-[10px] uppercase tracking-widest"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button 
                    onClick={step === STEPS.length - 1 ? handleSubmit : handleNext}
                    disabled={isSubmitting || (step === 0 && !formData.name)}
                    className="bg-orange-500 hover:bg-orange-400 text-black px-10 py-4 font-bold uppercase font-mono text-[10px] tracking-[0.3em] flex items-center space-x-3 transition-all rounded-xl"
                  >
                     <span>{isSubmitting ? "FINALIZING..." : step === STEPS.length - 1 ? "LAUNCH NODE" : "CONTINUE"}</span>
                     <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </motion.div>

            {/* Preview Card */}
            <div className="glass-surface p-6 rounded-3xl border border-dashed border-white/10 opacity-50 relative group hover:opacity-100 transition-opacity">
               <div className="absolute -top-3 left-6 px-3 py-1 bg-[#050505] border border-white/10 rounded-full text-[8px] font-mono text-white/40 uppercase tracking-widest">Live Template Preview</div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                     <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><Server className="w-5 h-5 text-white/20" /></div>
                     <div>
                       <p className="text-sm text-white/60">{formData.name || "Draft Node Name"}</p>
                       <p className="text-[10px] font-mono text-white/20 uppercase">{formData.type} / {formData.model}</p>
                     </div>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-orange-500/20 border border-orange-500/40" />
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
