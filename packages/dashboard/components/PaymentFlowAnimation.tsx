"use client";

import { useEffect, useState, useMemo } from "react";

interface PaymentFlowAnimationProps {
  recentTasks?: Array<{
    agent_type: string;
    status: string;
    amount: string;
    created_at: string;
  }>;
}

const AGENT_COLORS: Record<string, string> = {
  research: "#8B5CF6", // violet
  code: "#3B82F6", // blue
  test: "#10B981", // emerald
  review: "#F59E0B", // amber
};

const AGENT_LABELS: Record<string, { emoji: string; label: string; y: number }> = {
  research: { emoji: "🔬", label: "Research", y: 40 },
  code: { emoji: "💻", label: "Code", y: 80 },
  test: { emoji: "🧪", label: "Test", y: 120 },
  review: { emoji: "📋", label: "Review", y: 160 },
};

const AGENT_KEYS = Object.keys(AGENT_LABELS);

interface ActiveCoin {
  id: number;
  agentType: string;
  startedAt: number;
  duration: number;
}

export function PaymentFlowAnimation({ recentTasks }: PaymentFlowAnimationProps) {
  const [now, setNow] = useState(Date.now());
  const [coinCounter, setCoinCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  const recentActivity = useMemo(() => {
    if (!recentTasks || recentTasks.length === 0) return [];
    const thirtySecondsAgo = now - 30_000;
    return recentTasks.filter(
      (t) => new Date(t.created_at).getTime() > thirtySecondsAgo
    );
  }, [recentTasks, now]);

  const last5Tasks = useMemo(() => {
    if (!recentTasks) return [];
    return recentTasks.slice(-5);
  }, [recentTasks]);

  const [activeCoins, setActiveCoins] = useState<ActiveCoin[]>([]);

  useEffect(() => {
    if (recentActivity.length === 0) return;

    const latest = recentActivity[recentActivity.length - 1];
    if (!latest) return;

    const agentType = AGENT_KEYS.find(
      (k) => latest.agent_type.toLowerCase().includes(k)
    ) ?? "research";

    setCoinCounter((prev) => {
      const newId = prev + 1;
      setActiveCoins((coins) => {
        const trimmed = coins.filter(
          (c) => now - c.startedAt < c.duration + 500
        );
        return [
          ...trimmed,
          {
            id: newId,
            agentType,
            startedAt: now,
            duration: 1500,
          },
        ];
      });
      return newId;
    });
  }, [recentActivity.length]);

  useEffect(() => {
    if (activeCoins.length === 0) return;
    const timeout = setTimeout(() => {
      setActiveCoins((coins) =>
        coins.filter((c) => now - c.startedAt < c.duration + 500)
      );
    }, 600);
    return () => clearTimeout(timeout);
  }, [activeCoins, now]);

  const activeAgents = useMemo(() => {
    const active = new Set<string>();
    recentActivity.forEach((t) => {
      const key = AGENT_KEYS.find((k) =>
        t.agent_type.toLowerCase().includes(k)
      );
      if (key) active.add(key);
    });
    return active;
  }, [recentActivity]);

  const isWaiting = !recentTasks || recentTasks.length === 0;

  function getNodeOpacity(agentKey?: string): number {
    if (isWaiting) return 0.5;
    if (agentKey) {
      return activeAgents.has(agentKey) ? 1.0 : 0.6;
    }
    return recentActivity.length > 0 ? 1.0 : 0.7;
  }

  function getCoinPath(agentType: string): string {
    const agentY = AGENT_LABELS[agentType]?.y ?? 100;
    return `M 150,100 L 250,100 L 450,100 L 550,100 L 650,${agentY}`;
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
      <style>{`
        @keyframes pulseNode {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes coinFlow {
          0% { offset-distance: 0%; opacity: 1; }
          90% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        .flow-node-idle {
          animation: pulseNode 2s ease-in-out infinite;
        }
        .flow-coin {
          animation: coinFlow 1.5s linear forwards;
        }
      `}</style>

      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">
          Payment Flow
        </h3>
        {isWaiting && (
          <span className="text-xs text-slate-500 animate-pulse">
            Waiting for transactions...
          </span>
        )}
        {!isWaiting && recentActivity.length > 0 && (
          <span className="text-xs text-emerald-400">
            ● {recentActivity.length} active
          </span>
        )}
      </div>

      <svg
        viewBox="0 0 800 200"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Connection lines */}
        {/* Orchestrator → Gateway */}
        <line
          x1="150" y1="100" x2="250" y2="100"
          stroke="#334155" strokeWidth="2"
        />
        {/* Gateway → Arc */}
        <line
          x1="350" y1="100" x2="450" y2="100"
          stroke="#334155" strokeWidth="2"
        />
        {/* Arc → Agents */}
        {AGENT_KEYS.map((key) => {
          const agentY = AGENT_LABELS[key].y;
          return (
            <line
              key={`line-${key}`}
              x1="550" y1="100" x2="650" y2={agentY}
              stroke="#334155"
              strokeWidth="2"
              opacity={getNodeOpacity(key)}
            />
          );
        })}

        {/* Orchestrator node */}
        <g
          opacity={getNodeOpacity()}
          className={recentActivity.length === 0 ? "flow-node-idle" : undefined}
        >
          <rect
            x="50" y="75" width="100" height="50" rx="8"
            fill="#1E1B4B" stroke="#7C3AED" strokeWidth="1.5"
          />
          {activeCoins.length > 0 && (
            <rect
              x="50" y="75" width="100" height="50" rx="8"
              fill="none" stroke="#7C3AED" strokeWidth="2"
              opacity={0.6}
              filter="url(#glow)"
            />
          )}
          <text x="100" y="95" textAnchor="middle" fontSize="16">💰</text>
          <text
            x="100" y="115" textAnchor="middle"
            fontSize="9" fill="#C4B5FD" fontFamily="sans-serif"
          >
            Orchestrator
          </text>
        </g>

        {/* Gateway node */}
        <g
          opacity={getNodeOpacity()}
          className={recentActivity.length === 0 ? "flow-node-idle" : undefined}
        >
          <rect
            x="250" y="75" width="100" height="50" rx="8"
            fill="#172554" stroke="#3B82F6" strokeWidth="1.5"
          />
          {activeCoins.length > 0 && (
            <rect
              x="250" y="75" width="100" height="50" rx="8"
              fill="none" stroke="#3B82F6" strokeWidth="2"
              opacity={0.6}
              filter="url(#glow-blue)"
            />
          )}
          <text x="300" y="95" textAnchor="middle" fontSize="16">🏦</text>
          <text
            x="300" y="115" textAnchor="middle"
            fontSize="9" fill="#93C5FD" fontFamily="sans-serif"
          >
            Gateway
          </text>
        </g>

        {/* Arc L1 node */}
        <g
          opacity={getNodeOpacity()}
          className={recentActivity.length === 0 ? "flow-node-idle" : undefined}
        >
          <rect
            x="450" y="75" width="100" height="50" rx="8"
            fill="#052e16" stroke="#10B981" strokeWidth="1.5"
          />
          {activeCoins.length > 0 && (
            <rect
              x="450" y="75" width="100" height="50" rx="8"
              fill="none" stroke="#10B981" strokeWidth="2"
              opacity={0.6}
              filter="url(#glow-green)"
            />
          )}
          <text x="500" y="95" textAnchor="middle" fontSize="16">⛓️</text>
          <text
            x="500" y="115" textAnchor="middle"
            fontSize="9" fill="#6EE7B7" fontFamily="sans-serif"
          >
            Arc L1
          </text>
        </g>

        {/* Agent nodes */}
        {AGENT_KEYS.map((key) => {
          const { emoji, label, y } = AGENT_LABELS[key];
          const color = AGENT_COLORS[key];
          const isActive = activeAgents.has(key);
          const opacity = getNodeOpacity(key);

          return (
            <g
              key={key}
              opacity={opacity}
              className={!isActive && !isWaiting ? "flow-node-idle" : undefined}
            >
              <rect
                x="650" y={y - 18} width="110" height="36" rx="6"
                fill="#0F172A" stroke={color} strokeWidth="1.5"
              />
              {isActive && (
                <rect
                  x="650" y={y - 18} width="110" height="36" rx="6"
                  fill="none" stroke={color} strokeWidth="2.5"
                  opacity={0.7}
                  filter={`url(#glow-${key})`}
                />
              )}
              <text x="690" y={y + 1} textAnchor="middle" fontSize="14">
                {emoji}
              </text>
              <text
                x="730" y={y + 4} textAnchor="middle"
                fontSize="10" fill={color} fontFamily="sans-serif"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Animated coins for last 5 tasks */}
        {activeCoins.map((coin) => {
          const pathD = getCoinPath(coin.agentType);
          const color = AGENT_COLORS[coin.agentType] ?? "#7C3AED";
          const pathId = `coin-path-${coin.id}`;

          return (
            <g key={coin.id}>
              <path
                id={pathId}
                d={pathD}
                fill="none"
                stroke="none"
              />
              <circle
                r="4"
                fill={color}
                className="flow-coin"
                style={{ offsetPath: `path('${pathD}')` }}
              />
            </g>
          );
        })}

        {/* SVG filter definitions for glow effects */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#7C3AED" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#3B82F6" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#10B981" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {AGENT_KEYS.map((key) => (
            <filter
              key={`glow-${key}`}
              id={`glow-${key}`}
              x="-50%" y="-50%" width="200%" height="200%"
            >
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood
                floodColor={AGENT_COLORS[key]}
                floodOpacity="0.6"
                result="color"
              />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>
      </svg>

      {/* Last 5 transactions mini-feed */}
      {!isWaiting && last5Tasks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {last5Tasks.map((task, i) => {
            const agentKey =
              AGENT_KEYS.find((k) =>
                task.agent_type.toLowerCase().includes(k)
              ) ?? "research";
            const color = AGENT_COLORS[agentKey];
            return (
              <span
                key={`tx-${i}-${task.created_at}`}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: `${color}15`,
                  color,
                  border: `1px solid ${color}40`,
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {task.amount}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
