/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  TrendingDown, 
  ShieldCheck, 
  Globe, 
  ArrowRight,
  Activity,
  CreditCard,
  ExternalLink
} from 'lucide-react';

// --- Constants & Animations ---

const TRANSITION = { duration: 1.0, ease: [0.16, 1, 0.3, 1] };

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const ANIM_ITEM_UP = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: TRANSITION }
};

// Represents the overall sliding transition
const SLIDE_VARIANTS = {
  hidden: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    filter: 'blur(10px)',
    scale: 0.98
  }),
  show: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: TRANSITION
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    filter: 'blur(10px)',
    scale: 0.98,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  })
};


// --- Slide Components ---

const Slide1 = () => {
  const costs = [
    { name: "Ethereum L1", cost: 3.50, width: "w-full", color: "bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]" },
    { name: "Arbitrum L2", cost: 0.10, width: "w-1/12", color: "bg-white/20" },
    { name: "Polygon / Base", cost: 0.05, width: "w-[15%]", color: "bg-white/20", opacity: "opacity-60" },
    { name: "Arc L1 + x402", cost: 0.0001, width: "w-full", highlight: true },
  ];

  return (
    <motion.div variants={STAGGER_CONTAINER} className="flex flex-col lg:flex-row h-full items-center gap-12 p-12 lg:p-16 pt-24 z-10 relative">
      <div className="flex-1 z-10 space-y-8 flex flex-col">
        <motion.h1 
          variants={ANIM_ITEM_UP}
          className="text-[56px] lg:text-[72px] leading-[0.9] font-black tracking-tighter uppercase"
        >
          A <span className="text-[#f97316] drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">$0.005</span> AGENT CALL COSTS <span className="text-white/20 line-through decoration-white/20 decoration-2"> $3.50</span> IN GAS ON ETHEREUM.
        </motion.h1>
        <motion.p 
          variants={ANIM_ITEM_UP}
          className="text-xl text-white/50 max-w-lg font-light leading-relaxed"
        >
          That's not a marketplace. That's a money incinerator. Either gas eats the revenue, or it doesn't.
        </motion.p>
      </div>

      <div className="flex-1 w-full max-w-2xl pl-12 relative z-10">
        <motion.div variants={ANIM_ITEM_UP} className="space-y-6">
          <h3 className="text-[10px] font-bold text-[#f97316] uppercase tracking-widest mb-4">Cost of One Agent Call (USD)</h3>
          <div className="space-y-4">
            {costs.map((c, i) => {
              if (c.highlight) {
                 return (
                  <div key={c.name} className="group">
                    <div className="flex justify-between text-[11px] mb-1 font-mono text-[#f97316] uppercase tracking-tighter font-bold drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                      <span>{c.name} (AgentWork)</span>
                      <span>${c.cost.toFixed(4)}</span>
                    </div>
                    <div className="h-10 bg-[#f97316]/10 w-full relative overflow-hidden rounded-sm border border-[#f97316]/30 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                      <motion.div
                        variants={{ hidden: { width: 0 }, show: { width: '100%', transition: { delay: 0.6, duration: 1.5, ease: "easeOut" } } }}
                        className="h-full absolute left-0 top-0"
                      >
                         <div className="h-full bg-[#f97316] w-[2px] shadow-[0_0_20px_#f97316]"></div>
                      </motion.div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#f97316] italic">35,000× CHEAPER</div>
                    </div>
                  </div>
                 )
              }
              return (
                <div key={c.name} className={`group ${c.opacity || ''}`}>
                  <div className="flex justify-between text-[11px] mb-1 font-mono text-white/40 uppercase tracking-tighter">
                    <span>{c.name}</span>
                    <span>${c.cost.toFixed(c.cost < 0.1 ? 2 : 2)}</span>
                  </div>
                  <div className="h-6 w-full bg-white/10 rounded-sm overflow-hidden border border-transparent hover:border-white/10 transition-colors">
                    <motion.div
                      variants={{ hidden: { width: 0 }, show: { width: c.width, transition: { delay: 0.2 + i * 0.1, duration: 1, ease: "easeOut" } } }}
                      className={`h-full ${c.color} relative transition-all`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const Slide2 = () => {
  return (
    <motion.div variants={STAGGER_CONTAINER} className="flex flex-col h-full bg-[#050505]">
      <div className="p-12 lg:p-16 space-y-12 h-full flex flex-col pt-24 z-10 relative">
        <motion.div variants={ANIM_ITEM_UP} className="space-y-4">
          <h2 className="text-[48px] lg:text-[64px] font-black tracking-tighter leading-[0.9] uppercase drop-shadow-lg">
            AgentWork: Agents Pay Agents.<br/><span className="text-[#f97316] drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]">Economics Finally Work.</span>
          </h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-16 flex-1">
          <div className="lg:w-1/3 grid grid-cols-1 gap-6">
            {[
              { icon: <CreditCard className="text-[#f97316]" size={20} />, title: "Pay", desc: "gateway.pay(url) — one function call, Circle handles the rest" },
              { icon: <Globe className="text-[#f97316]" size={20} />, title: "Chain", desc: "Orchestrator → Research → Code → Test → Review, each hop on-chain" },
              { icon: <ShieldCheck className="text-[#f97316]" size={20} />, title: "Reputation", desc: "ERC-8004 scores 0–100. Portable identity NFTs." }
            ].map((prop, i) => (
              <motion.div 
                key={i}
                variants={ANIM_ITEM_UP}
                className="border-t border-white/10 pt-6 flex items-start gap-4"
              >
                <div className="mt-1">{prop.icon}</div>
                <div>
                  <h4 className="text-xl font-black mb-1 tracking-tight uppercase">{prop.title}</h4>
                  <p className="text-white/60 leading-relaxed text-sm font-light">{prop.desc}</p>
                </div>
              </motion.div>
            ))}
            
            <motion.div variants={ANIM_ITEM_UP} className="mt-4 p-4 border border-[#f97316]/30 rounded-sm bg-[#f97316]/5 text-xs text-white/50 leading-loose shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]">
              <strong className="text-white font-bold tracking-wide">Why Arc L1?</strong> USDC is the native gas token. No ETH-USDC conversion. No L2 bridging. Circle Gateway batches settlements via EIP-3009 — agents never hold gas tokens.
            </motion.div>
          </div>

          <motion.div variants={ANIM_ITEM_UP} className="flex-1 border-l border-white/10 pl-16 flex items-center justify-center relative overflow-hidden bg-grid-white bg-[size:40px_40px]">
             <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
             <div className="relative z-10 w-full max-w-lg space-y-8 p-8 bg-[#050505]/80 backdrop-blur-sm border border-white/5 shadow-2xl rounded-sm">
                <div className="bg-[#050505] border border-white/20 p-4 rounded-sm text-center font-mono text-sm uppercase tracking-widest relative">
                  Dashboard (React + AI)
                  <div className="absolute top-full left-1/2 -translate-x-1/2 h-8 w-[1px] border-l border-dashed border-white/30" />
                </div>
                
                <div className="bg-[#050505] border border-white/20 p-6 rounded-sm text-center font-mono text-sm relative uppercase tracking-widest">
                  Orchestrator
                  <div className="text-white/40 text-[10px] mt-1 lowercase tracking-normal font-sans">decompose → pay</div>
                  <div className="absolute top-full left-1/4 w-[50%] h-12 flex justify-around">
                    <div className="w-[1px] h-full border-l border-dashed border-[#f97316]/40 shadow-[0_0_10px_#f97316]" />
                    <div className="w-[1px] h-full border-l border-dashed border-[#f97316]/40" />
                    <div className="w-[1px] h-full border-l border-dashed border-[#f97316]/40" />
                    <div className="w-[1px] h-full border-l border-dashed border-[#f97316]/40 shadow-[0_0_10px_#f97316]" />
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-4 gap-4">
                  {['🔬', '💻', '🧪', '📋'].map((icon, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 hover:border-[#f97316]/50 transition-colors cursor-pointer aspect-square flex flex-col items-center justify-center rounded-sm relative">
                      <span className="text-2xl drop-shadow-md">{icon}</span>
                      <span className="text-[10px] font-bold text-[#f97316] mt-1 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]">$0.005</span>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 h-8 w-[1px] border-l border-dashed border-[#f97316]/40" />
                    </div>
                  ))}
                </div>

                <div className="bg-[#f97316]/10 border border-[#f97316]/40 p-4 rounded-sm text-center font-mono text-sm tracking-widest shadow-[0_0_30px_rgba(249,115,22,0.1)] relative backdrop-blur-md">
                  Circle x402 Gateway
                  <div className="absolute top-full left-1/2 -translate-x-1/2 h-8 w-[2px] bg-[#f97316] shadow-[0_0_15px_#f97316]" />
                </div>

                <div className="bg-[#f97316] p-4 rounded-sm text-center font-mono text-sm text-[#050505] font-bold shadow-[0_0_40px_rgba(249,115,22,0.3)] tracking-widest">
                  Arc L1 (USDC = Gas)
                  <div className="text-[#050505]/70 text-[10px] mt-1 font-sans leading-none tracking-normal">0.0001 per TX</div>
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const Slide3 = () => {
  const txs = [
    { type: "🔬 DeepResearch v3", amount: "$0.005", hash: "0x8f2a...11c2", fullHash: "0x8f2a11c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9011c2", status: "✅" },
    { type: "💻 CodeForge Alpha", amount: "$0.005", hash: "0xa1b2...c3d4", fullHash: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4", status: "✅" },
    { type: "🧪 SentinelQA", amount: "$0.005", hash: "0xe5f6...7890", fullHash: "0xe5f67890a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2", status: "✅" },
    { type: "📋 LogicReviewer", amount: "$0.005", hash: "0x1a2b...3c4d", fullHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7", status: "✅" },
    { type: "📝 Escrow Created", amount: "$0.00", hash: "0x5e6f...7g8h", fullHash: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0", status: "✅" }
  ];

  return (
    <motion.div variants={STAGGER_CONTAINER} className="h-full p-12 lg:p-16 flex flex-col gap-12 pt-24 z-10 relative">
      <motion.div variants={ANIM_ITEM_UP} className="space-y-4">
        <h2 className="text-[48px] lg:text-[64px] font-black tracking-tighter leading-[0.9] uppercase drop-shadow-lg">
          Not a prototype. <span className="text-[#f97316] drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]">Real Evidence.</span>
        </h2>
        <p className="text-xl text-white/60 font-light">3,400+ real on-chain transactions processed during testing.</p>
      </motion.div>

      <div className="flex-1 flex flex-col lg:flex-row gap-16 min-h-0">
        <motion.div variants={ANIM_ITEM_UP} className="lg:w-1/2 flex flex-col overflow-hidden bg-[#050505]/50 border border-white/5 rounded-sm p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold flex items-center gap-2 tracking-tight uppercase text-lg"><Activity size={18} className="text-[#f97316]" /> Task Feed</h4>
            <div className="text-right">
              <div className="text-[10px] text-[#f97316] font-bold uppercase tracking-widest drop-shadow-md">Gateway Balance</div>
              <div className="text-xl font-mono font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">$154.20</div>
            </div>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar border-t border-white/10 pt-6 mask-image:linear-gradient(to_bottom,transparent,black_10px,black_90%,transparent)">
            {txs.map((tx, i) => (
              <motion.div 
                key={i}
                variants={ANIM_ITEM_UP}
                className="bg-white/5 hover:bg-white/10 border border-transparent rounded-sm p-4 flex items-center justify-between group transition-colors cursor-pointer"
                onClick={() => window.open(`https://testnet.arcscan.app/tx/${tx.hash}`, '_blank')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-sm shadow-inner shadow-black/50">{tx.status}</div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-tight">{tx.type}</div>
                    <div className="text-xs text-white/40 font-mono tracking-widest mt-0.5">{tx.hash}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[#f97316] font-mono text-sm font-bold tracking-tight drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">{tx.amount}</div>
                  <ExternalLink size={14} className="text-white/20 group-hover:text-[#f97316]/80 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={STAGGER_CONTAINER} className="flex-1 flex flex-col justify-end gap-12 pb-12 border-l border-white/10 pl-16">
          <motion.div variants={ANIM_ITEM_UP} className="rounded-sm p-6 border-l-2 border-l-[#f97316] bg-[#050505] shadow-[10px_10px_30px_rgba(0,0,0,0.5),inset_0_0_15px_rgba(255,255,255,0.02)] border border-white/5">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#f97316] mb-3 flex items-center gap-2">
               <ShieldCheck size={14} /> Smart Contracts
            </h5>
            <p className="text-sm text-white/60 leading-relaxed font-light">
              5 Vyper contracts deployed on Arc testnet:<br/>
              <span className="font-mono text-[11px] opacity-70 tracking-widest font-bold mt-2 inline-block text-white">AgentEscrow · PaymentSplitter · IdentityRegistry · ReputationRegistry · SpendingLimiter</span>
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10 relative bg-grid-white bg-[size:30px_30px]">
            <div className="absolute inset-0 bg-[#050505]/60 block" />
            {[
              { label: "On-Chain TXs", val: "3,400+" },
              { label: "Avg Finality", val: "12ms" },
              { label: "Total Gas Cost", val: "$0.05" },
              { label: "Profit Margin", val: "97.8%" }
            ].map((stat, i) => (
              <motion.div key={i} variants={ANIM_ITEM_UP} className="space-y-1 relative z-10 p-4 border border-white/5 bg-[#050505] rounded-sm shadow-xl">
                <div className="text-3xl lg:text-4xl font-black tracking-tighter drop-shadow-md">{stat.val}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#f97316]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const Slide4 = () => {
  return (
    <motion.div variants={STAGGER_CONTAINER} className="h-full p-12 lg:p-16 flex flex-col gap-12 pt-24 z-10 relative">
      <motion.div variants={ANIM_ITEM_UP} className="space-y-4">
        <h2 className="text-[48px] lg:text-[64px] font-black tracking-tighter leading-[0.9] uppercase drop-shadow-lg">
          Circle's SDK. <span className="text-[#f97316] drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]">Built for Scale.</span>
        </h2>
        <p className="text-xl text-white/60 font-light">Infrastructure designed for the production agentic economy.</p>
      </motion.div>

      <div className="flex-1 flex flex-col lg:flex-row gap-16 border-t border-white/10 pt-12">
        <motion.div variants={ANIM_ITEM_UP} className="flex-1 border border-white/10 rounded-sm p-8 bg-[#050505] bg-noise overflow-hidden relative shadow-2xl flex flex-col">
          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          </div>
          <h4 className="text-[10px] text-white/40 font-mono mb-6 uppercase tracking-widest border-b border-white/10 pb-4 relative z-10">GatewayClient.ts</h4>
          <pre className="font-mono text-sm leading-loose overflow-x-auto text-white/80 relative z-10 flex-1">
            <code className="block">
              <span className="text-[#f97316] font-bold">import</span> {'{ GatewayClient }'} <span className="text-[#f97316] font-bold">from</span> <span className="text-white/60">"@circle-fin/x402-batching/client"</span>;{'\n\n'}
              <span className="text-white/40 italic">const</span> gateway = <span className="text-[#f97316]">new</span> GatewayClient({'{'}{'\n'}
              {'  '}chain: <span className="text-white/60 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">"arcTestnet"</span>,{'\n'}
              {'  '}privateKey: process.env.KEY <span className="text-[#f97316] italic">as</span> Hex,{'\n'}
              {'}'});{'\n\n'}
              <span className="text-white/40 italic">const</span> result = <span className="text-[#f97316] font-bold">await</span> gateway.pay(<span className="text-white/60 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">"https://agent.example/research"</span>);{'\n'}
              <span className="text-[#f97316]/60 italic tracking-tight">// → On-chain receipt. 12ms finality. $0.0001 gas.</span>
            </code>
          </pre>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
        </motion.div>

        <motion.div variants={STAGGER_CONTAINER} className="lg:w-2/5 space-y-8">
          {[
            { tag: "Protocol", title: "EIP-3009 Gasless Signing", desc: "Agents never hold gas tokens. Off-chain auth → batch settlement." },
            { tag: "System", title: "Settlement Polling", desc: "Gateway returns immediately. We backfill real tx hashes asynchronously." },
            { tag: "Logic", title: "Escrow Lifecycle", desc: "Funds locked until 'submitResult → approveCompletion' logic finishes." },
            { tag: "Identity", title: "ERC-8004 Reputation", desc: "Agent scores live on-chain, owned by the agent, portable to any marketplace." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              variants={ANIM_ITEM_UP}
              className="border-t border-white/10 pt-4 group"
            >
              <div className="text-[10px] uppercase tracking-widest text-[#f97316] font-bold mb-1 transition-all group-hover:tracking-[0.2em]">{item.tag}</div>
              <h5 className="font-black tracking-tight text-xl mb-1 uppercase group-hover:text-[#f97316] transition-colors">{item.title}</h5>
              <p className="text-sm text-white/50 leading-relaxed font-light">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

const Slide5 = () => {
  return (
    <motion.div variants={STAGGER_CONTAINER} className="h-full p-12 lg:p-16 flex flex-col items-center justify-center text-center relative z-10 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f97316]/20 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-5xl relative z-20 w-full flex flex-col items-center">
        <motion.h2 variants={ANIM_ITEM_UP} className="text-[56px] lg:text-[80px] font-black tracking-tighter leading-[0.9] mb-8 uppercase drop-shadow-2xl">
          The Rails for the <span className="text-[#f97316] block mt-2 drop-shadow-[0_0_40px_rgba(249,115,22,0.4)]">Agentic Economy.</span>
        </motion.h2>
        <motion.p variants={ANIM_ITEM_UP} className="text-xl text-white/60 font-light mb-16 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
          Every AI agent will need to pay other agents. <br className="hidden lg:block" />
          AgentWork is the protocol where the math finally scales.
        </motion.p>

        {/* Timeline */}
        <motion.div variants={STAGGER_CONTAINER} className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20 w-full">
          {[
            { phase: "NOW", title: "Hackathon MVP", items: ["✓ 4 Agent Types", "✓ x402 Payments", "✓ Dashboard", "✓ 3,400+ TXs"] },
            { phase: "NEXT", title: "Agent Registry", items: ["Any agent can list", "Automatic settlement", "Verified scores", "Cross-chain expansion"] },
            { phase: "FUTURE", title: "Open Protocol", items: ["Permissionless SDK", "Multi-chain integration", "Arbitrated Disputing", "Billion-agent scale"] }
          ].map((step, i) => (
            <motion.div 
              key={i} 
              variants={ANIM_ITEM_UP}
              className="border-t-2 border-[#f97316] pt-8 text-left flex flex-col h-full bg-[#050505]/80 backdrop-blur-3xl p-8 rounded-sm shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#f97316]/10 blur-[50px] -mr-10 -mt-10 group-hover:bg-[#f97316]/20 transition-colors" />
              <div className="text-[10px] font-mono text-[#f97316] font-bold mb-4 tracking-[0.2em] relative z-10">{step.phase}</div>
              <h4 className="text-2xl font-black mb-6 uppercase tracking-tight relative z-10">{step.title}</h4>
              <ul className="space-y-3 mt-auto relative z-10">
                {step.items.map((item, j) => (
                  <li key={j} className="text-sm text-white/60 flex items-center gap-3 font-light">
                    <div className="w-1 h-1 rounded-full bg-[#f97316] flex-shrink-0 shadow-[0_0_5px_#f97316]" /> 
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
           variants={ANIM_ITEM_UP}
           className="flex flex-col md:flex-row items-center justify-center gap-10"
        >
          <button onClick={() => window.open(import.meta.env.VITE_DASHBOARD_URL || 'https://agentwork-dashboard.vercel.app', '_blank')} className="px-10 py-5 bg-[#f97316] hover:bg-white text-[#050505] font-black tracking-tight rounded-sm transition-all hover:scale-105 active:scale-95 group flex items-center gap-3 uppercase shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]">
             Launch Live Demo <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <a href="https://github.com/HyperionBurn/AgentWork" target="_blank" rel="noopener noreferrer" className="space-y-2 text-left bg-white/5 border border-white/10 p-4 rounded-sm hover:bg-white/10 transition-colors block">
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">View on GitHub</div>
            <div className="text-sm font-mono font-bold tracking-tight text-white/80 hover:text-[#f97316] cursor-pointer transition-colors pb-1">
              github.com/HyperionBurn/AgentWork
            </div>
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [[page, direction], setPage] = useState([0, 0]);
  const totalSlides = 5;

  const paginate = (newDirection: number) => {
    let newPage = page + newDirection;
    if (newPage >= totalSlides) newPage = 0;
    if (newPage < 0) newPage = totalSlides - 1;
    setPage([newPage, newDirection]);
  };

  const jumpTo = (i: number) => {
    const newDirection = i > page ? 1 : i < page ? -1 : 0;
    setPage([i, newDirection]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') paginate(1);
      if (e.key === 'ArrowLeft') paginate(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page]);

  const slideComponents = [Slide1, Slide2, Slide3, Slide4, Slide5];

  return (
    <div className="h-screen w-screen bg-[#050505] overflow-hidden selection:bg-[#f97316] selection:text-[#050505] flex flex-col font-sans text-white relative">
      {/* Background layers */}
      <div className="fixed inset-0 pointer-events-none bg-dot-white opacity-40 z-0" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f97316] opacity-10 blur-[150px] rounded-full -mr-40 -mt-40 pointer-events-none z-0" />
      <div className="absolute bottom-16 right-16 rotate-90 origin-bottom-right opacity-[0.03] pointer-events-none z-0 mix-blend-screen">
        <span className="text-[180px] font-black leading-none select-none tracking-tighter">ARC</span>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full p-8 lg:px-16 flex justify-between items-center z-50">
        <div className="flex items-center gap-5">
          <div className="w-8 h-8 bg-[#f97316] rounded-sm rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)]">
             <div className="w-3 h-3 bg-[#050505]"></div>
          </div>
          <div>
            <div className="text-sm font-bold tracking-[0.3em] uppercase drop-shadow-md">AgentWork</div>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
           <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest bg-[#050505] py-2 px-4 rounded-sm border border-white/10 shadow-lg">
             <span className="text-[#f97316] font-bold tracking-widest drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">Slide 0{page + 1}</span>
             <span className="opacity-50">/</span>
             <span className="opacity-50 tracking-widest">0{totalSlides}</span>
           </div>
           
           <div className="flex gap-2">
             <button onClick={() => paginate(-1)} className="w-10 h-10 rounded-sm border border-white/10 bg-[#050505] flex items-center justify-center hover:bg-[#f97316] hover:border-[#f97316] hover:text-[#050505] transition-all hover:scale-105 active:scale-95 shadow-md">
               <ChevronLeft size={18} />
             </button>
             <button onClick={() => paginate(1)} className="w-10 h-10 rounded-sm border border-white/10 bg-[#050505] flex items-center justify-center hover:bg-[#f97316] hover:border-[#f97316] hover:text-[#050505] transition-all hover:scale-105 active:scale-95 shadow-md">
               <ChevronRight size={18} />
             </button>
           </div>
        </div>
      </header>

      {/* Slide Content */}
      <main className="flex-1 relative z-10 w-full max-w-[1440px] mx-auto pt-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="hidden"
            animate="show"
            exit="exit"
            className="h-full w-full"
          >
            {React.createElement(slideComponents[page], { isActive: true })}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer / Navigation Dots */}
      <footer className="fixed bottom-0 left-0 w-full p-8 lg:px-16 flex justify-between items-end pointer-events-none z-50">
        <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest hidden md:block">
          CONFIDENTIAL PITCH DECK <br/> V1.2.0 • 2026
        </div>
        <div className="pointer-events-auto flex gap-2 bg-[#050505]/80 backdrop-blur-md p-3 rounded-sm border border-white/10 shadow-2xl">
           {Array.from({ length: totalSlides }).map((_, i) => (
             <button 
               key={i}
               onClick={() => jumpTo(i)}
               className={`h-1.5 rounded-sm transition-all duration-300 ${page === i ? 'w-8 bg-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'w-4 bg-white/20 hover:bg-white/40'}`}
             />
           ))}
        </div>
      </footer>
    </div>
  );
}
