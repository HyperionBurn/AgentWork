"use client";

// ============================================================
// EscrowTimeline — Visual task lifecycle visualization
// ============================================================
// Shows the escrow lifecycle: Create → Claim → Submit → Approve
// with on-chain status for each step.

interface EscrowStep {
  label: string;
  status: "completed" | "active" | "pending";
  txHash: string | null;
  timestamp: string | null;
  mock: boolean;
}

interface EscrowTimelineProps {
  steps?: EscrowStep[];
  taskId?: string;
}

const DEFAULT_STEPS: EscrowStep[] = [
  { label: "Create Task",   status: "completed", txHash: null, timestamp: null, mock: true },
  { label: "Agent Claims",  status: "completed", txHash: null, timestamp: null, mock: true },
  { label: "Submit Result", status: "active",    txHash: null, timestamp: null, mock: true },
  { label: "Approve & Pay", status: "pending",   txHash: null, timestamp: null, mock: true },
];

export default function EscrowTimeline({ steps = DEFAULT_STEPS, taskId }: EscrowTimelineProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        📋 Escrow Lifecycle
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4">
        {taskId && (
          <p className="text-xs text-slate-500 mb-3 font-mono">
            Task: {taskId}
          </p>
        )}

        {/* Timeline */}
        <div className="relative">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            const statusIcon: Record<string, string> = {
              completed: "✅",
              active: "🔄",
              pending: "⏳",
            };
            const statusColor: Record<string, string> = {
              completed: "border-green-500 bg-green-500/10",
              active: "border-arc-purple bg-arc-purple/10 animate-pulse",
              pending: "border-slate-600 bg-slate-600/10",
            };

            return (
              <div key={step.label} className="flex items-start gap-3">
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full border-2 ${statusColor[step.status]} flex items-center justify-center text-sm`}
                  >
                    {statusIcon[step.status]}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 h-8 ${i < steps.findIndex((s) => s.status === "active" || s.status === "pending") ? "bg-green-500/50" : "bg-slate-700"}`} />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${step.status === "pending" ? "text-slate-500" : "text-white"}`}>
                      {step.label}
                    </span>
                    {step.mock && step.txHash && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-500">
                        simulated
                      </span>
                    )}
                  </div>
                  {step.txHash && !step.txHash.startsWith("MOCK_") && (
                    <a
                      href={`https://testnet.arcscan.io/tx/${step.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-arc-purple hover:underline mt-0.5 inline-block"
                    >
                      {step.txHash.slice(0, 10)}...{step.txHash.slice(-8)} ↗
                    </a>
                  )}
                  {step.mock && step.txHash && step.txHash.startsWith("MOCK_") && (
                    <span className="text-xs text-slate-600 mt-0.5 inline-block font-mono">
                      {step.txHash.slice(0, 20)}...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status summary */}
        <div className="border-t border-arc-border pt-2 mt-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {steps.filter((s) => s.status === "completed").length}/{steps.length} steps completed
            </span>
            <span className="text-arc-purple">
              {steps.some((s) => s.status === "pending") ? "Funds locked in escrow" : "Funds released"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
