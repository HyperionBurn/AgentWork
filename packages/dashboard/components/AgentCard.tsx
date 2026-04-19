interface AgentCardProps {
  agent: {
    name: string;
    type: string;
    port: number;
    status: "online" | "offline";
    earnings: number;
    tasksCompleted: number;
    description: string;
  };
  metrics?: {
    tasksCompleted: number;
    totalEarnings: number;
    successRate: string;
  } | null;
}

export default function AgentCard({ agent, metrics }: AgentCardProps) {
  const colors: Record<string, string> = {
    research: "from-violet-500 to-purple-600",
    code: "from-blue-500 to-cyan-500",
    test: "from-emerald-500 to-green-600",
    review: "from-amber-500 to-orange-500",
  };

  const gradient = colors[agent.type] || "from-slate-500 to-slate-600";

  // Use real metrics if available, otherwise fall back to static data
  const displayTasks = metrics?.tasksCompleted ?? agent.tasksCompleted;
  const displayEarnings = metrics?.totalEarnings ?? agent.earnings;
  const displaySuccessRate = metrics?.successRate ?? null;

  return (
    <div className="bg-arc-card border border-arc-border rounded-xl p-4 flex items-start gap-3 hover:border-arc-purple/30 transition-colors">
      {/* Agent icon */}
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0 flex items-center justify-center text-white font-bold text-sm`}
      >
        {agent.name[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">{agent.name}</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              agent.status === "online"
                ? "bg-green-500/10 text-green-400"
                : "bg-slate-500/10 text-slate-500"
            }`}
          >
            {agent.status === "online" ? `:${agent.port}` : "offline"}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 truncate">
          {agent.description}
        </p>
        {/* Real metrics grid (HF-6) */}
        {(displayTasks > 0 || displayEarnings > 0) && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase">Tasks</p>
              <p className="text-sm font-bold text-white">{displayTasks}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase">Earned</p>
              <p className="text-sm font-bold text-green-400">${displayEarnings.toFixed(3)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase">Success</p>
              <p className="text-sm font-bold text-cyan-400">
                {displaySuccessRate ? `${displaySuccessRate}%` : "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
