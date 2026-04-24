"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";

const ThreeScene = dynamic(() => import("@/app/landing/components/ThreeScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0F172A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const fadeUp = {
  hidden: { y: 30, opacity: 0 },
  visible: (delay: number = 0) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div className="relative w-full min-h-screen overflow-hidden bg-[#0F172A]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Fixed 3D Canvas Background */}
        <div className="fixed inset-0 z-0">
          <ThreeScene />
        </div>

        {/* ── Navbar ── */}
        <motion.nav
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed top-0 left-0 right-0 z-50 px-8 md:px-10 py-4 bg-[#0F172A]/70 backdrop-blur-xl border-b border-[#334155]/50"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center shadow-[0_0_12px_rgba(124,58,237,0.3)]">
                <span className="text-white font-bold text-sm tracking-tight">AW</span>
              </div>
              <span className="text-lg font-semibold text-[#F1F5F9] tracking-[-0.02em]">AgentWork</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-[13px] font-medium tracking-[0.02em] uppercase text-[#94A3B8] hover:text-[#F1F5F9] transition-colors duration-300">
                Dashboard
              </Link>
              <a href="#features" className="text-[13px] font-medium tracking-[0.02em] uppercase text-[#94A3B8] hover:text-[#F1F5F9] transition-colors duration-300">
                Features
              </a>
              <a href="#evidence" className="text-[13px] font-medium tracking-[0.02em] uppercase text-[#94A3B8] hover:text-[#F1F5F9] transition-colors duration-300">
                Evidence
              </a>
              <Link
                href="/"
                className="ml-2 px-5 py-2 text-[13px] font-medium tracking-[0.02em] bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white rounded-full hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </motion.nav>

        {/* ── Hero ── */}
        <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-24">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-3xl mx-auto text-center">
            {/* Pill badge */}
            <motion.div variants={fadeUp} custom={0} className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1E293B]/80 backdrop-blur-sm rounded-full border border-[#7C3AED]/30 text-[12px] font-medium tracking-[0.06em] uppercase text-[#94A3B8]">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                Live on Arc Testnet · Chain 5042002
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              custom={0.1}
              className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.035em] text-[#F1F5F9] mb-6"
            >
              AI Agents That
              <br />
              <span className="bg-gradient-to-r from-[#7C3AED] via-[#3B82F6] to-[#06B6D4] bg-clip-text text-transparent">
                Scale on Chain
              </span>
            </motion.h1>

            {/* Subhead */}
            <motion.p
              variants={fadeUp}
              custom={0.2}
              className="text-lg md:text-xl font-light leading-[1.7] tracking-[-0.01em] text-[#94A3B8] max-w-xl mx-auto mb-10"
            >
              Chain research, coding, testing, and review agents — pay $0.005
              per task with gasless x402 payments on Arc.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} custom={0.3} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="group px-8 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white rounded-full text-[15px] font-medium tracking-[-0.01em] shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all duration-300 flex items-center gap-2"
              >
                Launch Demo
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#features"
                className="px-8 py-3.5 text-[15px] font-medium tracking-[-0.01em] text-[#94A3B8] border border-[#334155] rounded-full hover:border-[#7C3AED] hover:text-[#F1F5F9] transition-all duration-300"
              >
                Explore Features
              </a>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.5 }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="w-5 h-8 border border-[#475569] rounded-full flex justify-center pt-1.5">
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="w-1 h-1 bg-[#7C3AED] rounded-full" />
            </div>
          </motion.div>
        </section>

        {/* ── Tech Stats Ribbon ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 py-6 px-6 bg-[#1E293B]/90 backdrop-blur-sm border-y border-[#334155]/50"
        >
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {[
              { label: "Chain ID", value: "5042002", accent: "text-[#06B6D4]" },
              { label: "Gas Token", value: "USDC", accent: "text-[#10B981]" },
              { label: "Protocol", value: "x402 · EIP-3009", accent: "text-[#7C3AED]" },
              { label: "Contracts", value: "5 Vyper", accent: "text-[#3B82F6]" },
              { label: "Cost", value: "$0.005/task", accent: "text-[#F59E0B]" },
              { label: "Identity", value: "ERC-8004", accent: "text-[#06B6D4]" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-[13px]">
                <span className="text-[#64748B]">{stat.label}</span>
                <span className={stat.accent}>{stat.value}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Features ── */}
        <section id="features" className="relative z-10">
          {/* Feature 1 — Nanopayments */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="min-h-screen flex items-center px-6 py-32">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <motion.div variants={stagger} className="space-y-8">
                <motion.div variants={fadeUp}>
                  <span className="text-[12px] font-semibold tracking-[0.15em] uppercase text-[#7C3AED]">01 — Nanopayments</span>
                </motion.div>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[#F1F5F9]">
                  $0.005 per task.
                  <br />No gas. No hassle.
                </motion.h2>
                <motion.p variants={fadeUp} className="text-lg font-light leading-[1.7] tracking-[-0.01em] text-[#94A3B8] max-w-md">
                  Gasless EIP-3009 transfers via Circle Gateway. Pay per call
                  with automatic batch settlement on Arc L1.
                </motion.p>
                <motion.ul variants={stagger} className="space-y-3 pt-2">
                  {[
                    "Automatic batch settlement via Gateway",
                    "Every transaction verifiable on arcscan.io",
                    "100× cheaper gas than Arbitrum, 2500× vs Ethereum",
                  ].map((item) => (
                    <motion.li key={item} variants={fadeUp} className="flex items-center gap-3 text-[15px] text-[#CBD5E1] tracking-[-0.005em]">
                      <span className="w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {item}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>

              {/* Gas comparison card */}
              <motion.div variants={fadeUp} className="p-6 bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-[#334155]/50 space-y-4">
                <h3 className="text-sm font-semibold tracking-[0.1em] uppercase text-[#7C3AED] mb-4">Gas Cost Comparison</h3>
                {[
                  { network: "Arc L1", cost: "$0.001", total60: "$0.06", color: "text-[#10B981]", bar: "w-[2%]" },
                  { network: "Arbitrum", cost: "$0.10", total60: "$6.00", color: "text-[#F59E0B]", bar: "w-[12%]" },
                  { network: "Ethereum", cost: "$2.50", total60: "$150.00", color: "text-red-400", bar: "w-full" },
                ].map((row) => (
                  <div key={row.network} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#94A3B8]">{row.network}</span>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono ${row.color}`}>{row.cost}/tx</span>
                        <span className="text-[#64748B] text-xs">({row.total60} / 60 txns)</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden">
                      <div className={`h-full ${row.bar} rounded-full bg-gradient-to-r from-[#7C3AED] to-[#3B82F6]`} />
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {/* Feature 2 — Agent Chaining */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="min-h-screen flex items-center px-6 py-32">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <motion.div variants={stagger} className="space-y-8">
                <motion.div variants={fadeUp}>
                  <span className="text-[12px] font-semibold tracking-[0.15em] uppercase text-[#7C3AED]">02 — Agent Chaining</span>
                </motion.div>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[#F1F5F9]">
                  Specialized agents.
                  <br />One seamless flow.
                </motion.h2>
                <motion.p variants={fadeUp} className="text-lg font-light leading-[1.7] tracking-[-0.01em] text-[#94A3B8] max-w-md">
                  Break complex tasks into specialized subtasks. Each handled
                  by an expert, orchestrated on-chain.
                </motion.p>
                <motion.div variants={stagger} className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    { name: "Research", desc: "Deep synthesis", accent: "bg-[#7C3AED]/20 text-[#7C3AED] border-[#7C3AED]/20" },
                    { name: "Code", desc: "Implementation", accent: "bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/20" },
                    { name: "Test", desc: "Quality assurance", accent: "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/20" },
                    { name: "Review", desc: "Peer feedback", accent: "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/20" },
                  ].map((agent) => (
                    <motion.div
                      key={agent.name}
                      variants={fadeUp}
                      className={`p-4 bg-[#1E293B]/80 backdrop-blur-sm rounded-xl border ${agent.accent}`}
                    >
                      <span className="text-[11px] font-semibold tracking-[0.05em] uppercase mb-2 block">{agent.name}</span>
                      <p className="text-[14px] text-[#94A3B8] tracking-[-0.005em]">{agent.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Chain flow card */}
              <motion.div variants={fadeUp} className="p-6 bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-[#334155]/50 space-y-3">
                <h3 className="text-sm font-semibold tracking-[0.1em] uppercase text-[#7C3AED] mb-4">Task Decomposition Flow</h3>
                {[
                  { step: "Input", desc: '"Build a REST API for user management"', color: "#94A3B8" },
                  { step: "Research", desc: "Analyze requirements, suggest architecture", color: "#7C3AED" },
                  { step: "Code", desc: "Implement endpoints + data models", color: "#3B82F6" },
                  { step: "Test", desc: "Unit tests + integration validation", color: "#10B981" },
                  { step: "Review", desc: "Code review + quality scoring", color: "#F59E0B" },
                ].map((s, i) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `${s.color}20`, color: s.color }}>
                        {i + 1}
                      </div>
                      {i < 4 && <div className="w-px h-4 bg-[#334155]" />}
                    </div>
                    <div>
                      <span className="text-[13px] font-semibold" style={{ color: s.color }}>{s.step}</span>
                      <p className="text-[13px] text-[#64748B]">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {/* Feature 3 — On-Chain Escrow */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="min-h-screen flex items-center px-6 py-32">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <motion.div variants={stagger} className="space-y-8">
                <motion.div variants={fadeUp}>
                  <span className="text-[12px] font-semibold tracking-[0.15em] uppercase text-[#7C3AED]">03 — Escrow</span>
                </motion.div>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[#F1F5F9]">
                  Trust minimized.
                  <br />Fully on-chain.
                </motion.h2>
                <motion.p variants={fadeUp} className="text-lg font-light leading-[1.7] tracking-[-0.01em] text-[#94A3B8] max-w-md">
                  Funds locked in Vyper smart contracts until task completion.
                  Automatic refund on failure.
                </motion.p>
                <motion.div variants={fadeUp} className="p-6 bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-[#334155]/50 space-y-4">
                  {[
                    { num: "01", text: "Create task and deposit USDC" },
                    { num: "02", text: "Agent claims and completes task" },
                    { num: "03", text: "Submit result for approval" },
                    { num: "✓", text: "Funds released or refunded", done: true },
                  ].map((step) => (
                    <div key={step.num} className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold tracking-wide ${step.done ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#334155] text-[#94A3B8]"}`}>
                        {step.num}
                      </span>
                      <span className="text-[15px] text-[#CBD5E1] tracking-[-0.005em]">{step.text}</span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </motion.section>

          {/* Feature 4 — ERC-8004 Reputation */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="min-h-screen flex items-center px-6 py-32">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <motion.div variants={stagger} className="space-y-8">
                <motion.div variants={fadeUp}>
                  <span className="text-[12px] font-semibold tracking-[0.15em] uppercase text-[#7C3AED]">04 — Reputation</span>
                </motion.div>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[#F1F5F9]">
                  On-chain identity.
                  <br />Proven quality.
                </motion.h2>
                <motion.p variants={fadeUp} className="text-lg font-light leading-[1.7] tracking-[-0.01em] text-[#94A3B8] max-w-md">
                  ERC-8004 identity NFTs and 0–100 quality scoring. Transparent
                  feedback history with revocable on-chain audit trail.
                </motion.p>
                <motion.ul variants={stagger} className="space-y-3 pt-2">
                  {[
                    "NFT-based agent identities",
                    "0–100 quality scoring system",
                    "Transparent on-chain feedback",
                    "Revocable feedback with audit trail",
                  ].map((item) => (
                    <motion.li key={item} variants={fadeUp} className="flex items-center gap-3 text-[15px] text-[#CBD5E1] tracking-[-0.005em]">
                      <span className="w-5 h-5 rounded-full bg-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {item}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            </div>
          </motion.section>
        </section>

        {/* ── Technical Evidence ── */}
        <section id="evidence" className="relative z-10 py-24 px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-[#F1F5F9] text-center mb-4">
              Verified On-Chain
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#94A3B8] text-center mb-10 font-light">
              Deployed Vyper smart contracts on Arc testnet — verifiable on arcscan.io
            </motion.p>

            {/* Contract addresses */}
            <motion.div variants={fadeUp} className="bg-[#0D1117] rounded-xl p-6 border border-[#334155]/30" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div className="text-[#7C3AED] text-sm mb-4">// AgentWork Contracts — Arc Testnet (5042002)</div>
              <div className="space-y-2 text-[13px]">
                {[
                  { name: "IdentityRegistry", addr: "0x858A5CB26a8f5e4C65F9799699385779E7Fd7431" },
                  { name: "ReputationRegistry", addr: "0x75b4D64669a0837B93ffa930945E4E40dCe4f8Ea" },
                  { name: "AgentEscrow", addr: "0x57141AF833bD46706DEE3155C7C32da37AA407F3" },
                  { name: "PaymentSplitter", addr: "0xc23913b38cEA341714b466d7ce16c82DEb20aa30" },
                  { name: "SpendingLimiter", addr: "0xe0c736FDe0064c3988c86c2393BB3234A942072D" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="text-[#06B6D4]">{c.name}</span>
                    <span className="text-[#64748B]">:</span>
                    <span className="text-[#94A3B8]">{c.addr}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#334155]/30">
                <div className="text-[#10B981] text-sm mb-2">// Payment flow — 3 lines, gasless:</div>
                <div className="text-[#94A3B8] text-[13px]">
                  <span className="text-[#7C3AED]">const</span> gateway = <span className="text-[#3B82F6]">new</span> GatewayClient(&#123; <span className="text-[#06B6D4]">chain</span>: <span className="text-[#10B981]">&quot;arcTestnet&quot;</span> &#125;);<br />
                  <span className="text-[#7C3AED]">await</span> gateway.<span className="text-[#F59E0B]">deposit</span>(<span className="text-[#10B981]">&quot;1.0&quot;</span>);<br />
                  <span className="text-[#7C3AED]">const</span> result = <span className="text-[#7C3AED]">await</span> gateway.<span className="text-[#F59E0B]">pay</span>(<span className="text-[#10B981]">&quot;http://localhost:4021/task&quot;</span>);
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── CTA ── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="relative z-10 min-h-[60vh] flex items-center justify-center px-6 py-32">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[#F1F5F9]">
              Start building with
              <br />autonomous agents.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg font-light leading-[1.7] tracking-[-0.01em] text-[#94A3B8]">
              Explore the live testnet dashboard. 60+ on-chain transactions.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/"
                className="px-8 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white rounded-full text-[15px] font-medium tracking-[-0.01em] shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all duration-300"
              >
                Launch Demo Now
              </Link>
              <a
                href="#"
                className="px-8 py-3.5 text-[15px] font-medium tracking-[-0.01em] text-[#94A3B8] border border-[#334155] rounded-full hover:border-[#7C3AED] hover:text-[#F1F5F9] transition-all duration-300"
              >
                Read Documentation
              </a>
            </motion.div>
          </div>
        </motion.section>

        {/* ── Footer ── */}
        <footer className="relative z-10 border-t border-[#334155]/50 py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">AW</span>
              </div>
              <span className="text-[14px] font-medium text-[#F1F5F9] tracking-[-0.02em]">AgentWork</span>
            </div>
            <p className="text-[13px] text-[#64748B] tracking-[-0.005em]">
              Agentic Economy on Arc · lablab.ai Hackathon 2026
            </p>
            <div className="flex items-center gap-6">
              {["GitHub", "Discord", "Docs"].map((link) => (
                <a key={link} href="#" className="text-[13px] text-[#94A3B8] hover:text-[#7C3AED] tracking-[-0.005em] transition-colors duration-300">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
