"use client";

import { useState, useEffect } from "react";
import EconomicChart from "@/components/EconomicChart";
import { DashboardCharts } from "@/components/DashboardCharts";
import RevenueDashboard from "@/components/RevenueDashboard";
import SpendingBudget from "@/components/SpendingBudget";
import GasDashboard from "@/components/GasDashboard";
import TierSelector from "@/components/TierSelector";

interface TaskStats {
  totalTasks: number;
  completed: number;
  totalSpent: string;
  totalOnChainTransactions: number;
}

interface TimeseriesPoint {
  timestamp: string;
  count: number;
  totalAmount: number;
}

interface AgentBreakdown {
  agentType: string;
  count: number;
  totalAmount: number;
}

export default function EconomyPage() {
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    completed: 0,
    totalSpent: "$0.0000",
    totalOnChainTransactions: 0,
  });
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [agentBreakdown, setAgentBreakdown] = useState<AgentBreakdown[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskRes, tsRes] = await Promise.all([
          fetch("/api/task-status"),
          fetch("/api/stats-timeseries"),
        ]);

        if (taskRes.ok) {
          const data = await taskRes.json();
          setStats(data.stats);
        }
        if (tsRes.ok) {
          const data = await tsRes.json();
          setTimeseries(data.timeseries || []);
          setAgentBreakdown(data.agentBreakdown || []);
        }
      } catch {
        // Silently handle fetch errors — dashboard remains functional with defaults
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-arc-bg text-white p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">💰 Economy Hub</h1>
        <p className="text-gray-400 mt-1">
          Real-time cost analysis, revenue tracking, and gas comparison
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-arc-card border border-arc-border rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Tasks</p>
          <p className="text-2xl font-bold">{stats.totalTasks}</p>
        </div>
        <div className="bg-arc-card border border-arc-border rounded-xl p-4">
          <p className="text-sm text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
        </div>
        <div className="bg-arc-card border border-arc-border rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Spent</p>
          <p className="text-2xl font-bold text-cyan-400">{stats.totalSpent}</p>
        </div>
        <div className="bg-arc-card border border-arc-border rounded-xl p-4">
          <p className="text-sm text-gray-400">On-Chain Txns</p>
          <p className="text-2xl font-bold text-purple-400">{stats.totalOnChainTransactions}</p>
        </div>
      </div>

      {/* Full-width: 4 Charts in 2×2 Grid */}
      <div className="bg-arc-card border border-arc-border rounded-xl p-4">
        <DashboardCharts
          timeseries={timeseries}
          agentBreakdown={agentBreakdown}
          totalTransactions={stats.totalOnChainTransactions}
        />
      </div>

      {/* Two-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-arc-card border border-arc-border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">Live Cost Comparison</h2>
            <EconomicChart liveCost={stats.totalSpent} totalTransactions={stats.totalOnChainTransactions} />
          </div>

          <div className="bg-arc-card border border-arc-border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">Gas Cost Comparison</h2>
            <GasDashboard />
          </div>

          <div className="bg-arc-card border border-arc-border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">Pricing Tier</h2>
            <TierSelector />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-arc-card border border-arc-border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">Revenue</h2>
            <RevenueDashboard />
          </div>

          <div className="bg-arc-card border border-arc-border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">Spending Budget</h2>
            <SpendingBudget />
          </div>
        </div>
      </div>
    </div>
  );
}
