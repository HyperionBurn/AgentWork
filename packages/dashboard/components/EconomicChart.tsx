interface EconomicChartProps {
  liveCost?: string;
}

export default function EconomicChart({ liveCost }: EconomicChartProps) {
  const scenarios = [
    {
      name: "Stripe / PayPal",
      minTx: "$0.30",
      settlement: "1-3 days",
      cost50: "$15.00+",
      color: "bg-red-500",
      barWidth: "100%",
    },
    {
      name: "L2 (Arbitrum/Base)",
      minTx: "$0.05-0.50",
      settlement: "12s-2min",
      cost50: "$2.50-25.00",
      color: "bg-yellow-500",
      barWidth: "40%",
    },
    {
      name: "Arc + Circle Gateway",
      minTx: "$0.001",
      settlement: "<5 sec",
      cost50: "$0.05-0.50",
      color: "bg-gradient-to-r from-arc-purple to-arc-blue",
      barWidth: "3%",
    },
  ];

  const liveScenario = liveCost ? [{
    name: "Your Run (Arc Live)",
    minTx: "$0.001",
    settlement: "Live",
    cost50: liveCost,
    color: "bg-gradient-to-r from-green-400 to-emerald-500",
    barWidth: `${Math.max(3, Math.min(100, parseFloat(liveCost.replace("$", "")) / 15 * 100))}%`,
  }] : [];

  const allScenarios = [...scenarios, ...liveScenario];

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Cost Comparison (50-Agent Task)
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl p-4 space-y-4">
        {allScenarios.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">{s.name}</span>
              <span className="text-sm text-slate-300">{s.cost50}</span>
            </div>
            <div className="w-full bg-arc-dark rounded-full h-2">
              <div
                className={`h-2 rounded-full ${s.color} transition-all`}
                style={{ width: s.barWidth }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-xs text-slate-500">Min: {s.minTx}</span>
              <span className="text-xs text-slate-500">Settlement: {s.settlement}</span>
            </div>
          </div>
        ))}

        <div className="border-t border-arc-border pt-3 mt-3">
          <p className="text-xs text-slate-400">
            <span className="text-green-400 font-semibold">Arc saves 30-300x</span> on
            payment infrastructure costs compared to traditional and L2 alternatives.
            USDC is the native gas token — no token bridging required.
          </p>
        </div>
      </div>
    </div>
  );
}
