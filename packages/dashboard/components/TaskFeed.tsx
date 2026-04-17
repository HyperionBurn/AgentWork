interface TaskFeedProps {
  tasks: Array<{
    id: string;
    task_id: string;
    agent_type: string;
    status: "pending" | "paying" | "completed" | "failed";
    gateway_tx: string | null;
    amount: string;
    result: string | null;
    created_at: string;
  }>;
}

const statusStyles: Record<string, { badge: string; icon: string }> = {
  pending: { badge: "bg-yellow-500/10 text-yellow-400", icon: "⏳" },
  paying: { badge: "bg-arc-purple/10 text-arc-purple", icon: "💸" },
  completed: { badge: "bg-green-500/10 text-green-400", icon: "✅" },
  failed: { badge: "bg-red-500/10 text-red-400", icon: "❌" },
};

const agentLabels: Record<string, string> = {
  research: "Research Agent",
  code: "Code Agent",
  test: "Test Agent",
  review: "Review Agent",
  orchestrator: "Orchestrator",
};

// Format amount consistently — avoid double $ prefix
const formatAmount = (a: string) => a.startsWith("$") ? a : `$${a}`;

export default function TaskFeed({ tasks }: TaskFeedProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Task Execution Feed
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <p>No tasks yet. Submit a task via the orchestrator to see activity.</p>
            <p className="mt-2 text-xs">
              Run: <code className="bg-arc-dark px-2 py-1 rounded">npm run dev:orchestrator</code>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-arc-border max-h-[400px] overflow-y-auto">
            {tasks.map((task) => {
              const style = statusStyles[task.status] || statusStyles.pending;
              const isMockTx = task.gateway_tx?.startsWith("MOCK_") ?? false;
              return (
                <div
                  key={task.id}
                  className={`px-4 py-3 flex items-center gap-3 hover:bg-arc-dark/50 transition-colors animate-slide-in ${task.status === "completed" ? "animate-pulse-glow" : ""}`}
                >
                  <span className="text-sm">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {agentLabels[task.agent_type] || task.agent_type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${style.badge}`}>
                        {task.status}
                      </span>
                    </div>
                    {task.result && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {task.result}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-300">{formatAmount(task.amount)}</p>
                    {task.gateway_tx && !isMockTx && (
                      <a
                        href={`https://testnet.arcscan.io/tx/${task.gateway_tx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-arc-purple hover:underline"
                      >
                        view tx ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
