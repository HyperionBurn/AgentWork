import { NextResponse } from 'next/server';
import { GET as getHealth } from '../agent-health/route';
import { GET as getMetrics } from '../agent-metrics/route';

export async function GET() {
  try {
    const [healthRes, metricsRes] = await Promise.all([
      getHealth(),
      getMetrics()
    ]);

    const healthData = await healthRes.json();
    const metricsData = await metricsRes.json();

    const agents = healthData.agents || [];
    const metrics = metricsData.metrics || [];

    const mergedAgents = agents.map((agent: any) => {
      const metric = metrics.find((m: any) => m.agentType === agent.type);
      
      return {
        id: agent.type,
        name: agent.name || `${agent.type} agent`,
        type: agent.type,
        status: agent.status,
        capabilities: agent.capabilities || [],
        performance: metric ? parseFloat(metric.successRate) : 95,
        tasksCompleted: metric ? metric.tasksCompleted : 0,
        uptime: '24h 0m' // Default or derived
      };
    });

    return NextResponse.json({ agents: mergedAgents });
  } catch (error) {
    console.error('Error fetching all-agents:', error);
    return NextResponse.json({ agents: [] }, { status: 500 });
  }
}
