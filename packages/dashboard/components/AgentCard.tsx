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
}

export default function AgentCard({ agent }: AgentCardProps) {
  const colors: Record<string, string> = {
    research: "from-violet-500 to-purple-600",
    code: "from-blue-500 to-cyan-500",
    test: "from-emerald-500 to-green-600",
    review: "from-amber-500 to-orange-500",
  };

  const gradient = colors[agent.type] || "from-slate-500 to-slate-600";

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
        {(agent.earnings > 0 || agent.tasksCompleted > 0) && (
          <div className="flex items-center gap-3 mt-1.5">
            {agent.tasksCompleted > 0 && (
              <span className="text-xs text-slate-500">
                {agent.tasksCompleted} task{agent.tasksCompleted !== 1 ? "s" : ""}
              </span>
            )}
            {agent.earnings > 0 && (
              <span className="text-xs text-green-400 font-medium">
                ${agent.earnings.toFixed(3)} earned
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
