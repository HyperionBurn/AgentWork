"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardChartsProps {
  timeseries?: Array<{ timestamp: string; count: number; totalAmount: number }>;
  agentBreakdown?: Array<{ agentType: string; count: number; totalAmount: number }>;
  totalTransactions?: number;
}

const COLORS = {
  purple: "#7C3AED",
  blue: "#3B82F6",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
} as const;

const AXIS_STROKE = "#64748b";
const TICK_FILL = "#94a3b8";
const GRID_STROKE = "#334155";

const AGENT_COLORS: Record<string, string> = {
  research: COLORS.purple,
  code: COLORS.blue,
  test: COLORS.green,
  review: COLORS.amber,
};

const DEFAULT_AGENTS = ["research", "code", "test", "review"];

function buildCostComparisonData(
  timeseries: Array<{ timestamp: string; count: number; totalAmount: number }>
) {
  let cumulativeArc = 0;
  let cumulativeL2 = 0;
  let cumulativeStripe = 0;

  return timeseries.map((point) => {
    cumulativeArc += point.totalAmount;
    cumulativeL2 += point.count * 0.1;
    cumulativeStripe += point.count * 0.3;

    const label = new Date(point.timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return {
      time: label,
      Arc: Number(cumulativeArc.toFixed(4)),
      L2: Number(cumulativeL2.toFixed(4)),
      Stripe: Number(cumulativeStripe.toFixed(4)),
    };
  });
}

function buildSavingsData(
  timeseries: Array<{ timestamp: string; count: number; totalAmount: number }>
) {
  let cumulativeSavings = 0;

  return timeseries.map((point) => {
    const stripeCost = point.count * 0.3;
    const arcCost = point.totalAmount;
    cumulativeSavings += stripeCost - arcCost;

    const label = new Date(point.timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return {
      time: label,
      savings: Number(Math.max(0, cumulativeSavings).toFixed(4)),
    };
  });
}

function buildVolumeData(
  timeseries: Array<{ timestamp: string; count: number; totalAmount: number }>
) {
  return timeseries.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    count: point.count,
  }));
}

function buildAgentData(
  agentBreakdown?: Array<{ agentType: string; count: number; totalAmount: number }>
) {
  if (!agentBreakdown || agentBreakdown.length === 0) {
    return DEFAULT_AGENTS.map((agent) => ({
      agent: agent.charAt(0).toUpperCase() + agent.slice(1),
      count: 0,
      fill: AGENT_COLORS[agent],
    }));
  }

  return agentBreakdown.map((item) => ({
    agent: item.agentType.charAt(0).toUpperCase() + item.agentType.slice(1),
    count: item.count,
    fill: AGENT_COLORS[item.agentType.toLowerCase()] ?? COLORS.purple,
  }));
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-arc-card border border-arc-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">{title}</h3>
      {children}
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

const tooltipItemStyle: React.CSSProperties = {
  color: "#94a3b8",
};

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
      Run a demo to see chart data
    </div>
  );
}

export function DashboardCharts({
  timeseries = [],
  agentBreakdown = [],
  totalTransactions = 0,
}: DashboardChartsProps) {
  const hasData = timeseries.length > 0 || agentBreakdown.length > 0 || totalTransactions > 0;

  const volumeData = buildVolumeData(timeseries);
  const costData = buildCostComparisonData(timeseries);
  const savingsData = buildSavingsData(timeseries);
  const agentData = buildAgentData(agentBreakdown);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Chart 1: Transaction Volume */}
      <ChartCard title="Transaction Volume">
        {hasData && volumeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="time"
                stroke={AXIS_STROKE}
                tick={{ fill: TICK_FILL, fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                stroke={AXIS_STROKE}
                tick={{ fill: TICK_FILL, fontSize: 11 }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.purple}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS.purple }}
                activeDot={{ r: 5, fill: COLORS.purple }}
                name="Txns"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </ChartCard>

      {/* Chart 2: Cost Accumulation */}
      <ChartCard title="Cost Accumulation (Arc vs L2 vs Stripe)">
        {hasData && costData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="time"
                stroke={AXIS_STROKE}
                tick={{ fill: TICK_FILL, fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                stroke={AXIS_STROKE}
                tick={{ fill: TICK_FILL, fontSize: 11 }}
                tickLine={false}
                tickFormatter={(value: number) => `$${value}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                formatter={(value: unknown) => [`$${Number(Array.isArray(value) ? value[0] : value ?? 0).toFixed(4)}`, undefined]}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", color: TICK_FILL }}
              />
              <Line
                type="monotone"
                dataKey="Arc"
                stroke={COLORS.purple}
                strokeWidth={2}
                dot={false}
                name="Arc (actual)"
              />
              <Line
                type="monotone"
                dataKey="L2"
                stroke={COLORS.amber}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="L2 (est.)"
              />
              <Line
                type="monotone"
                dataKey="Stripe"
                stroke={COLORS.red}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Stripe (est.)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </ChartCard>

      {/* Chart 3: Agent Throughput */}
      <ChartCard title="Agent Throughput">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={agentData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis
              dataKey="agent"
              stroke={AXIS_STROKE}
              tick={{ fill: TICK_FILL, fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              stroke={AXIS_STROKE}
              tick={{ fill: TICK_FILL, fontSize: 11 }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Tasks">
              {agentData.map((entry, index) => (
                <rect key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Chart 4: Cumulative Savings */}
      <ChartCard title="Cumulative Savings vs Stripe">
        {hasData && savingsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={savingsData}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="time"
                stroke={AXIS_STROKE}
                tick={{ fill: TICK_FILL, fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                stroke={AXIS_STROKE}
                tick={{ fill: TICK_FILL, fontSize: 11 }}
                tickLine={false}
                tickFormatter={(value: number) => `$${value}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                formatter={(value: unknown) => [`$${Number(Array.isArray(value) ? value[0] : value ?? 0).toFixed(4)}`, "Saved"]}
              />
              <Area
                type="monotone"
                dataKey="savings"
                stroke={COLORS.purple}
                strokeWidth={2}
                fill="url(#savingsGradient)"
                name="Savings"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </ChartCard>
    </div>
  );
}
