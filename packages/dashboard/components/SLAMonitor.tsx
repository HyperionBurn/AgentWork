"use client";

import { useState, useEffect } from "react";

// ============================================================
// GC11: SLA Monitor Component
// ============================================================
// Enterprise-grade SLA compliance dashboard showing per-agent
// metrics against configurable policies, with violation
// tracking and trust scoring.
// ============================================================

interface SLAMetrics {
  avgResponseTimeMs: number;
  qualityScore: number;
  uptimePct: number;
  totalCalls: number;
  failedCalls: number;
}

interface SLAViolation {
  type: string;
  actual: number;
  threshold: number;
  severity: string;
  message: string;
}

interface AgentSLA {
  agentType: string;
  compliant: boolean;
  violations: SLAViolation[];
  metrics: SLAMetrics;
  evaluatedAt: string;
}

interface SLAPolicy {
  agentType: string;
  maxResponseTimeMs: number;
  minQualityScore: number;
  minUptimePct: number;
  penaltyAmount: string;
}

interface SLAData {
  agents: AgentSLA[];
  policies: SLAPolicy[];
  summary: {
    allCompliant: boolean;
    totalViolations: number;
    totalCalls: number;
    overallUptime: number;
  };
  evaluatedAt: string;
}

const AGENT_LABELS: Record<string, string> = {
  research: "🔬 Research",
  code: "💻 Code",
  test: "🧪 Test",
  review: "🔍 Review",
};

function getStatusBadge(sla: AgentSLA) {
  if (sla.metrics.totalCalls === 0) {
    return { label: "No Data", color: "text-slate-500", bg: "bg-slate-500/10 border-slate-500/20", icon: "⚪" };
  }
  if (!sla.compliant) {
    const hasCritical = sla.violations.some((v) => v.severity === "critical");
    if (hasCritical) {
      return { label: "Critical", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: "🔴" };
    }
    return { label: "Warning", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", icon: "🟡" };
  }
  return { label: "Compliant", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "🟢" };
}

function MetricBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function SLAMonitor() {
  const [data, setData] = useState<SLAData | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchSLA();
    const interval = setInterval(fetchSLA, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchSLA = async () => {
    try {
      const res = await fetch("/api/sla");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // Silent
    }
  };

  if (!data) {
    return (
      <div className="rounded-xl border border-arc-border bg-arc-card p-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-arc-border bg-arc-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">📋 SLA Engine</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise service-level agreement monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.summary.allCompliant ? (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              ✅ All SLAs Met
            </span>
          ) : (
            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
              ⚠️ {data.summary.totalViolations} Violation{data.summary.totalViolations !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-arc-border/50 bg-arc-bg p-3 text-center">
          <div className="text-lg font-bold text-cyan-400">{data.summary.totalCalls}</div>
          <div className="text-[10px] text-slate-500">Total Calls</div>
        </div>
        <div className="rounded-lg border border-arc-border/50 bg-arc-bg p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">{data.summary.overallUptime.toFixed(1)}%</div>
          <div className="text-[10px] text-slate-500">Overall Uptime</div>
        </div>
        <div className="rounded-lg border border-arc-border/50 bg-arc-bg p-3 text-center">
          <div className="text-lg font-bold text-purple-400">{data.agents.filter((a) => a.compliant).length}/4</div>
          <div className="text-[10px] text-slate-500">Compliant</div>
        </div>
        <div className="rounded-lg border border-arc-border/50 bg-arc-bg p-3 text-center">
          <div className="text-lg font-bold text-yellow-400">{data.summary.totalViolations}</div>
          <div className="text-[10px] text-slate-500">Violations</div>
        </div>
      </div>

      {/* Per-Agent SLA Cards */}
      <div className="space-y-2">
        {data.agents.map((sla) => {
          const status = getStatusBadge(sla);
          const isExpanded = expanded === sla.agentType;
          const policy = data.policies.find((p) => p.agentType === sla.agentType);

          return (
            <div
              key={sla.agentType}
              className={`rounded-lg border cursor-pointer transition-all ${
                isExpanded ? "border-arc-purple bg-arc-bg" : "border-arc-border/50 bg-arc-bg/50 hover:bg-arc-bg"
              }`}
              onClick={() => setExpanded(isExpanded ? null : sla.agentType)}
            >
              {/* Agent row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{status.icon}</span>
                  <span className="font-medium text-sm">
                    {AGENT_LABELS[sla.agentType] || sla.agentType}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">
                    {sla.metrics.avgResponseTimeMs}ms
                  </span>
                  <span className="text-slate-500">
                    {sla.metrics.qualityScore.toFixed(0)}% quality
                  </span>
                  <span className={status.color}>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-arc-border/30 px-4 py-3 space-y-3">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1">Response Time</div>
                      <div className="text-sm font-mono">{sla.metrics.avgResponseTimeMs}ms</div>
                      <MetricBar
                        value={sla.metrics.avgResponseTimeMs}
                        max={policy?.maxResponseTimeMs || 5000}
                        color={sla.metrics.avgResponseTimeMs > (policy?.maxResponseTimeMs || 5000) ? "#ef4444" : "#22c55e"}
                      />
                      <div className="text-[10px] text-slate-600 mt-1">
                        Max: {policy?.maxResponseTimeMs}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1">Quality Score</div>
                      <div className="text-sm font-mono">{sla.metrics.qualityScore.toFixed(1)}%</div>
                      <MetricBar
                        value={sla.metrics.qualityScore}
                        max={100}
                        color={sla.metrics.qualityScore < (policy?.minQualityScore || 80) ? "#ef4444" : "#22c55e"}
                      />
                      <div className="text-[10px] text-slate-600 mt-1">
                        Min: {policy?.minQualityScore}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1">Uptime</div>
                      <div className="text-sm font-mono">{sla.metrics.uptimePct.toFixed(1)}%</div>
                      <MetricBar
                        value={sla.metrics.uptimePct}
                        max={100}
                        color={sla.metrics.uptimePct < (policy?.minUptimePct || 95) ? "#ef4444" : "#22c55e"}
                      />
                      <div className="text-[10px] text-slate-600 mt-1">
                        SLA: {policy?.minUptimePct}%
                      </div>
                    </div>
                  </div>

                  {/* Violations */}
                  {sla.violations.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1">Violations</div>
                      {sla.violations.map((v, i) => (
                        <div
                          key={i}
                          className={`text-xs px-2 py-1 rounded mb-1 ${
                            v.severity === "critical"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {v.severity === "critical" ? "🔴" : "🟡"} {v.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Call Stats */}
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>{sla.metrics.totalCalls} total calls</span>
                    <span>{sla.metrics.failedCalls} failed</span>
                    <span>Penalty: {policy?.penaltyAmount}/violation</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
        <p className="text-[11px] text-emerald-400">
          🔒 SLA compliance enforced on-chain via ReputationRegistry + SpendingLimiter contracts.
          Violations trigger automatic reputation adjustments and penalty payments.
        </p>
      </div>
    </div>
  );
}
