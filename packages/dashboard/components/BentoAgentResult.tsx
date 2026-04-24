"use client";

import React from "react";

interface ResearchResult {
  summary: string;
  key_findings: string[];
  sources: { title: string; relevance: number }[];
  confidence: number;
}

interface CodeResult {
  code: string;
  language: string;
  files_modified: string[];
  test_coverage: number;
  summary: string;
}

interface TestResult {
  tests_generated: number;
  passing: number;
  failing: number;
  coverage: number;
  test_suite: string;
}

interface ReviewResult {
  quality_score: number;
  issues: { severity: string; description: string }[];
  approved: boolean;
  suggestions: string[];
  summary: string;
}

interface BentoAgentResultProps {
  agentType: string;
  result: string | null;
}

export default function BentoAgentResult({ agentType, result }: BentoAgentResultProps) {
  if (!result) return null;

  let data: any;
  try {
    data = JSON.parse(result);
  } catch (e) {
    // Fallback if not JSON
    return (
      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
        <p className="text-sm text-slate-300 whitespace-pre-wrap">{result}</p>
      </div>
    );
  }

  // Handle nested results (some agents wrap the result)
  const finalData = data.result || data;

  switch (agentType) {
    case "research":
      return <ResearchBento data={finalData as ResearchResult} />;
    case "code":
      return <CodeBento data={finalData as CodeResult} />;
    case "test":
      return <TestBento data={finalData as TestResult} />;
    case "review":
      return <ReviewBento data={finalData as ReviewResult} />;
    default:
      return (
        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
          <pre className="text-xs text-slate-400 overflow-auto">{JSON.stringify(finalData, null, 2)}</pre>
        </div>
      );
  }
}

function ResearchBento({ data }: { data: ResearchResult }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
      <div className="md:col-span-2 space-y-4">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Executive Summary</h4>
          <p className="text-sm text-slate-200 leading-relaxed">{data.summary}</p>
        </div>
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Findings</h4>
          <ul className="space-y-2">
            {data.key_findings?.map((f, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-violet-400 mt-1">✦</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center text-center">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Confidence</h4>
          <div className="relative w-20 h-20 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 36}
                        strokeDashoffset={2 * Math.PI * 36 * (1 - (data.confidence || 0))}
                        className="text-violet-500 transition-all duration-1000" />
             </svg>
             <span className="absolute text-lg font-bold text-white">{Math.round((data.confidence || 0) * 100)}%</span>
          </div>
        </div>
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sources</h4>
          <div className="space-y-2">
            {data.sources?.map((s, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-xs text-slate-300 truncate">{s.title}</span>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                  <div className="bg-violet-500 h-full" style={{ width: `${s.relevance * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeBento({ data }: { data: CodeResult }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
      <div className="md:col-span-3 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{data.language} implementation</h4>
          <button className="text-[10px] text-slate-500 hover:text-white uppercase tracking-widest border border-slate-800 px-2 py-0.5 rounded">Copy</button>
        </div>
        <pre className="text-xs font-mono text-blue-300 overflow-x-auto leading-relaxed max-h-[300px]">
          {data.code}
        </pre>
      </div>
      <div className="space-y-4">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Coverage</h4>
          <div className="text-2xl font-bold text-emerald-400">{Math.round((data.test_coverage || 0) * 100)}%</div>
          <p className="text-[10px] text-slate-500 mt-1">Verified with unit tests</p>
        </div>
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Artifacts</h4>
          <div className="space-y-1">
            {data.files_modified?.map((f, i) => (
              <div key={i} className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="text-blue-500">📄</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestBento({ data }: { data: TestResult }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Test Suite Stats</h4>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-3xl font-bold text-white">{data.tests_generated}</div>
              <div className="text-[10px] text-slate-500 uppercase">Total Tests</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-emerald-400">{data.passing} Passing</div>
              <div className="text-sm font-medium text-red-400">{data.failing} Failing</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Pass Rate</span>
            <span>{Math.round((data.passing / data.tests_generated) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(data.passing / data.tests_generated) * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="md:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Execution Logs</h4>
        <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto leading-tight max-h-[150px]">
          {data.test_suite}
        </pre>
      </div>
    </div>
  );
}

function ReviewBento({ data }: { data: ReviewResult }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quality Score</h4>
        <div className={`text-4xl font-black ${data.quality_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {data.quality_score}
        </div>
        <div className={`text-[10px] mt-2 px-2 py-0.5 rounded uppercase font-bold ${data.approved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {data.approved ? 'Approved' : 'Needs Work'}
        </div>
      </div>
      <div className="md:col-span-2 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Detected Issues</h4>
        <div className="space-y-2">
          {data.issues?.length > 0 ? data.issues.map((issue, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className={`text-[10px] uppercase font-bold px-1 rounded ${issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {issue.severity}
              </span>
              <span className="text-xs text-slate-300 leading-tight">{issue.description}</span>
            </div>
          )) : <p className="text-xs text-slate-500 italic">No issues detected</p>}
        </div>
      </div>
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Best Practices</h4>
        <ul className="space-y-1">
          {data.suggestions?.map((s, i) => (
            <li key={i} className="text-[10px] text-slate-400 flex items-start gap-1">
              <span className="text-amber-500">💡</span> {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
