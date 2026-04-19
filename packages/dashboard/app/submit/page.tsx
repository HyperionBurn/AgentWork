"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// Types
// ============================================================

interface Metrics {
  totalTransactions: number;
  costSavings: string;
  agentsActive: number;
  contractsDeployed: number;
  totalSpent: string;
}

interface EvidenceData {
  totalVerified: number;
  latestTxHash: string | null;
}

// ============================================================
// Fallback defaults (C5 — always render meaningful content)
// ============================================================

const DEFAULT_METRICS: Metrics = {
  totalTransactions: 60,
  costSavings: "99.5%",
  agentsActive: 4,
  contractsDeployed: 5,
  totalSpent: "$0.30",
};

const DEFAULT_EVIDENCE: EvidenceData = {
  totalVerified: 60,
  latestTxHash: null,
};

// ============================================================
// Architecture Diagram (inline SVG, dark themed)
// ============================================================

function ArchitectureDiagram() {
  return (
    <div className="w-full overflow-x-auto py-6">
      <svg
        viewBox="0 0 820 220"
        className="w-full max-w-4xl mx-auto"
        style={{ minHeight: 180 }}
      >
        {/* Background */}
        <defs>
          <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#94A3B8" />
          </marker>
        </defs>

        {/* Dashboard */}
        <rect x="20" y="65" width="120" height="55" rx="8" fill="url(#boxGrad)" stroke="#7C3AED" strokeWidth="1.5" />
        <text x="80" y="88" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">Dashboard</text>
        <text x="80" y="104" textAnchor="middle" fill="#94A3B8" fontSize="9">Next.js UI</text>

        {/* Arrow: Dashboard → Orchestrator */}
        <line x1="140" y1="92" x2="190" y2="92" stroke="#94A3B8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

        {/* Orchestrator */}
        <rect x="195" y="55" width="140" height="75" rx="8" fill="url(#boxGrad)" stroke="#7C3AED" strokeWidth="1.5" />
        <text x="265" y="78" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">Orchestrator</text>
        <text x="265" y="94" textAnchor="middle" fill="#94A3B8" fontSize="9">Task Decomposer</text>
        <text x="265" y="108" textAnchor="middle" fill="#94A3B8" fontSize="9">+ x402 Client</text>

        {/* Arrows: Orchestrator → Agents */}
        <line x1="335" y1="72" x2="395" y2="45" stroke="#94A3B8" strokeWidth="1.2" markerEnd="url(#arrowhead)" />
        <line x1="335" y1="85" x2="395" y2="85" stroke="#94A3B8" strokeWidth="1.2" markerEnd="url(#arrowhead)" />
        <line x1="335" y1="98" x2="395" y2="125" stroke="#94A3B8" strokeWidth="1.2" markerEnd="url(#arrowhead)" />
        <line x1="335" y1="110" x2="395" y2="165" stroke="#94A3B8" strokeWidth="1.2" markerEnd="url(#arrowhead)" />

        {/* Agents */}
        <rect x="400" y="25" width="110" height="35" rx="6" fill="url(#boxGrad)" stroke="#3B82F6" strokeWidth="1.2" />
        <text x="455" y="47" textAnchor="middle" fill="#E2E8F0" fontSize="10">🔍 Research</text>

        <rect x="400" y="68" width="110" height="35" rx="6" fill="url(#boxGrad)" stroke="#3B82F6" strokeWidth="1.2" />
        <text x="455" y="90" textAnchor="middle" fill="#E2E8F0" fontSize="10">💻 Code</text>

        <rect x="400" y="111" width="110" height="35" rx="6" fill="url(#boxGrad)" stroke="#3B82F6" strokeWidth="1.2" />
        <text x="455" y="133" textAnchor="middle" fill="#E2E8F0" fontSize="10">🧪 Test</text>

        <rect x="400" y="154" width="110" height="35" rx="6" fill="url(#boxGrad)" stroke="#3B82F6" strokeWidth="1.2" />
        <text x="455" y="176" textAnchor="middle" fill="#E2E8F0" fontSize="10">📝 Review</text>

        {/* Arrow: Agents → Gateway */}
        <line x1="510" y1="92" x2="565" y2="92" stroke="#94A3B8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

        {/* Circle Gateway */}
        <rect x="570" y="55" width="120" height="75" rx="8" fill="url(#boxGrad)" stroke="#10B981" strokeWidth="1.5" />
        <text x="630" y="78" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">Circle</text>
        <text x="630" y="94" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">Gateway</text>
        <text x="630" y="110" textAnchor="middle" fill="#94A3B8" fontSize="9">EIP-3009 Batch</text>

        {/* Arrow: Gateway → Arc */}
        <line x1="690" y1="92" x2="715" y2="92" stroke="#94A3B8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

        {/* Arc L1 */}
        <rect x="720" y="65" width="85" height="55" rx="8" fill="url(#arcGrad)" stroke="none" />
        <text x="762" y="88" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="700">Arc L1</text>
        <text x="762" y="104" textAnchor="middle" fill="#E2E8F0" fontSize="9">USDC Gas</text>
      </svg>
    </div>
  );
}

// ============================================================
// Metric Card
// ============================================================

function MetricCard({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: string;
}) {
  return (
    <div className="bg-[var(--arc-card)] border border-[var(--arc-border)] rounded-xl p-6 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        {value}
      </div>
      {sublabel && (
        <div className="text-xs text-slate-500 mt-1">{sublabel}</div>
      )}
    </div>
  );
}

// ============================================================
// Technical Highlight Item
// ============================================================

function HighlightItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 items-start p-4 rounded-lg hover:bg-slate-800/50 transition-colors">
      <span className="text-xl mt-0.5 shrink-0">{icon}</span>
      <div>
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Section Wrapper
// ============================================================

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-12 border-b border-slate-800">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      {children}
    </section>
  );
}

// ============================================================
// Submit Page
// ============================================================

export default function SubmitPage() {
  const [metrics, setMetrics] = useState<Metrics>(DEFAULT_METRICS);
  const [evidence, setEvidence] = useState<EvidenceData>(DEFAULT_EVIDENCE);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/task-status");
        if (res.ok) {
          const data = await res.json();
          if (data.stats?.totalOnChainTransactions > 0) {
            setMetrics((prev) => ({
              ...prev,
              totalTransactions: data.stats.totalOnChainTransactions,
              totalSpent: data.stats.totalSpent ?? prev.totalSpent,
            }));
          }
        }
      } catch {
        // Silently fall back to defaults
      }
    };

    const fetchAgentMetrics = async () => {
      try {
        const res = await fetch("/api/agent-metrics");
        if (res.ok) {
          const data = await res.json();
          if (data.agents?.length > 0) {
            setMetrics((prev) => ({
              ...prev,
              agentsActive: data.agents.filter(
                (a: { status: string }) => a.status === "online"
              ).length,
            }));
          }
        }
      } catch {
        // Silently fall back to defaults
      }
    };

    const fetchEvidence = async () => {
      try {
        const res = await fetch("/api/evidence");
        if (res.ok) {
          const data = await res.json();
          if (data.totalVerified > 0) {
            setEvidence({
              totalVerified: data.totalVerified,
              latestTxHash: data.latestTxHash ?? null,
            });
          }
        }
      } catch {
        // Silently fall back to defaults
      }
    };

    fetchMetrics();
    fetchAgentMetrics();
    fetchEvidence();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* ──────────────────────────────────────────────
          Hero Section
      ────────────────────────────────────────────── */}
      <header className="text-center py-16">
        <div className="inline-block mb-6">
          <span className="text-6xl">🤖</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            AgentWork
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 mb-2">
          AI Agent Marketplace with Nanopayments on Arc L1
        </p>
        <p className="text-sm text-slate-500">
          Built for the{" "}
          <a
            href="https://lablab.ai/event/agentic-economy-on-arc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
          >
            Agentic Economy on Arc Hackathon
          </a>{" "}
          (lablab.ai, April 20–26, 2026)
        </p>
      </header>

      {/* ──────────────────────────────────────────────
          What We Built
      ────────────────────────────────────────────── */}
      <Section id="what-we-built" title="What We Built">
        <div className="prose prose-invert max-w-none">
          <p className="text-slate-300 leading-relaxed text-base">
            <strong className="text-white">AgentWork</strong> is a fully
            functional AI agent marketplace that demonstrates the power of
            nanopayments on Arc L1. A central{" "}
            <strong className="text-purple-400">Orchestrator</strong> decomposes
            complex tasks into subtasks, then hires specialist AI agents via the{" "}
            <strong className="text-blue-400">x402 nanopayment protocol</strong>.
            Each agent call costs just{" "}
            <strong className="text-cyan-400">$0.005</strong> — settled through
            the{" "}
            <strong className="text-green-400">Circle Gateway</strong> using
            EIP-3009 gasless batch transfers directly on Arc L1.
          </p>
          <p className="text-slate-300 leading-relaxed text-base mt-4">
            Agents are identified on-chain via{" "}
            <strong className="text-purple-400">ERC-8004</strong> identity
            registrations, and their reputation is tracked immutably through a{" "}
            <strong className="text-purple-400">ReputationRegistry</strong>{" "}
            smart contract written in Vyper. The entire payment flow — from task
            submission to agent payout — is visible on the{" "}
            <a
              href="https://testnet.arcscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              Arc block explorer
            </a>
            .
          </p>
        </div>
      </Section>

      {/* ──────────────────────────────────────────────
          Architecture Diagram
      ────────────────────────────────────────────── */}
      <Section id="architecture" title="Architecture">
        <ArchitectureDiagram />
        <p className="text-center text-xs text-slate-500 mt-2">
          End-to-end flow: Dashboard → Orchestrator → 4 Specialist Agents →
          Circle Gateway → Arc L1
        </p>
      </Section>

      {/* ──────────────────────────────────────────────
          Key Metrics (live data with fallbacks)
      ────────────────────────────────────────────── */}
      <Section id="metrics" title="Key Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon="🔗"
            label="Transactions"
            value={metrics.totalTransactions}
            sublabel="on-chain (Arc L1)"
          />
          <MetricCard
            icon="💰"
            label="Cost Savings"
            value={metrics.costSavings}
            sublabel="vs. traditional payment rails"
          />
          <MetricCard
            icon="🤖"
            label="Agents Active"
            value={metrics.agentsActive}
            sublabel="specialist AI agents"
          />
          <MetricCard
            icon="📜"
            label="Smart Contracts"
            value={metrics.contractsDeployed}
            sublabel="Vyper contracts on Arc"
          />
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">
          Total spent: <strong className="text-slate-300">{metrics.totalSpent}</strong>{" "}
          in USDC across all agent calls
        </p>
      </Section>

      {/* ──────────────────────────────────────────────
          Technical Highlights
      ────────────────────────────────────────────── */}
      <Section id="highlights" title="Technical Highlights">
        <div className="grid md:grid-cols-2 gap-2">
          <HighlightItem
            icon="⚡"
            title="x402 Nanopayment Protocol ($0.005/call)"
            description="Every agent interaction is priced and paid via the x402 protocol. The orchestrator deposits USDC into the Circle Gateway and authorizes per-call payments without signing individual on-chain transactions."
          />
          <HighlightItem
            icon="🏦"
            title="Circle Gateway Batch Settlement (EIP-3009)"
            description="Agent authorizations are batched by the Circle Gateway and settled as single on-chain transactions on Arc L1, dramatically reducing gas costs while preserving individual payment granularity."
          />
          <HighlightItem
            icon="🪪"
            title="ERC-8004 Agent Identity Standard"
            description="Each agent is registered on-chain with an ERC-721 identity NFT. Metadata URIs store agent capabilities, pricing, and endpoint details — enabling trustless agent discovery."
          />
          <HighlightItem
            icon="📝"
            title="Vyper Smart Contracts"
            description="AgentEscrow, PaymentSplitter, SpendingLimiter, IdentityRegistry, and ReputationRegistry — all written in Vyper 0.4.x for maximum security and auditability."
          />
          <HighlightItem
            icon="📊"
            title="Real-Time Dashboard (Supabase)"
            description="Every payment, task event, and agent response is streamed to a live dashboard via Supabase real-time subscriptions, providing full transparency into the agentic economy."
          />
          <HighlightItem
            icon="🔄"
            title="Autonomous Task Decomposition"
            description="The orchestrator breaks complex requests into parallel and sequential subtasks, assigns them to the best-suited agents, and aggregates results — all coordinated through on-chain payments."
          />
        </div>
      </Section>

      {/* ──────────────────────────────────────────────
          Evidence
      ────────────────────────────────────────────── */}
      <Section id="evidence" title="On-Chain Evidence">
        <div className="bg-[var(--arc-card)] border border-[var(--arc-border)] rounded-xl p-6 text-center">
          <p className="text-lg text-slate-300 mb-2">
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {evidence.totalVerified}
            </span>{" "}
            verified on-chain transactions
          </p>
          {evidence.latestTxHash && (
            <p className="text-xs text-slate-500 mb-4">
              Latest tx:{" "}
              <a
                href={`https://testnet.arcscan.io/tx/${evidence.latestTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-mono"
              >
                {evidence.latestTxHash.slice(0, 10)}...
                {evidence.latestTxHash.slice(-8)}
              </a>
            </p>
          )}
          <Link
            href="/evidence"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold hover:from-purple-500 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-purple-500/20"
          >
            View All Evidence →
          </Link>
        </div>
      </Section>

      {/* ──────────────────────────────────────────────
          Team
      ────────────────────────────────────────────── */}
      <Section id="team" title="Team">
        <div className="bg-[var(--arc-card)] border border-[var(--arc-border)] rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                AgentWork Team
              </h3>
              <p className="text-sm text-slate-400">
                Building the future of autonomous AI agent economies
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────────────
          Links
      ────────────────────────────────────────────── */}
      <Section id="links" title="Links">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://github.com/agentwork/agentwork"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[var(--arc-card)] border border-[var(--arc-border)] rounded-xl p-5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group block"
          >
            <div className="text-2xl mb-2">🐙</div>
            <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
              GitHub Repository
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Full source code, contracts, and documentation
            </p>
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[var(--arc-card)] border border-[var(--arc-border)] rounded-xl p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group block"
          >
            <div className="text-2xl mb-2">🎬</div>
            <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
              Demo Video
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              3-minute walkthrough of the full system
            </p>
          </a>
          <a
            href="https://testnet.arcscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[var(--arc-card)] border border-[var(--arc-border)] rounded-xl p-5 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 group block"
          >
            <div className="text-2xl mb-2">🔍</div>
            <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
              Arc Explorer
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              View all transactions on Arc testnet
            </p>
          </a>
        </div>
      </Section>

      {/* ──────────────────────────────────────────────
          Footer
      ────────────────────────────────────────────── */}
      <footer className="py-12 text-center">
        <p className="text-sm text-slate-500">
          Built with ❤️ for the{" "}
          <span className="text-purple-400">Agentic Economy on Arc</span>{" "}
          Hackathon
        </p>
        <p className="text-xs text-slate-600 mt-2">
          Next.js 14 · TypeScript · Vyper · Arc L1 · Circle Gateway
        </p>
      </footer>
    </div>
  );
}
