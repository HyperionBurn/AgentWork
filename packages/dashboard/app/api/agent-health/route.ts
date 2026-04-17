import { NextResponse } from "next/server";

/**
 * Server-side agent health proxy.
 *
 * The dashboard client cannot reach Docker service names (e.g., http://research-agent:4021)
 * because those DNS names only exist inside the Docker network.
 *
 * This route runs server-side where Docker DNS resolves, fetches each agent's
 * metadata, and returns a combined health status to the browser.
 */

interface AgentConfig {
  type: string;
  port: number;
  envKey: string;
}

const AGENTS: AgentConfig[] = [
  { type: "research", port: 4021, envKey: "NEXT_PUBLIC_RESEARCH_AGENT_URL" },
  { type: "code", port: 4022, envKey: "NEXT_PUBLIC_CODE_AGENT_URL" },
  { type: "test", port: 4023, envKey: "NEXT_PUBLIC_TEST_AGENT_URL" },
  { type: "review", port: 4024, envKey: "NEXT_PUBLIC_REVIEW_AGENT_URL" },
];

function getAgentUrl(agent: AgentConfig): string {
  // In Docker, use the service name from env; locally fall back to localhost
  const envUrl = process.env[agent.envKey];
  if (envUrl) return envUrl;
  return `http://localhost:${agent.port}`;
}

export async function GET() {
  const results = await Promise.all(
    AGENTS.map(async (agent) => {
      const baseUrl = getAgentUrl(agent);
      try {
        const res = await fetch(`${baseUrl}/`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const meta = await res.json();
          return {
            type: agent.type,
            status: "online" as const,
            description: meta.description || "",
            name: meta.name || `${agent.type} agent`,
            pricing: meta.pricing || {},
            capabilities: meta.capabilities || [],
            port: agent.port,
          };
        }
      } catch {
        // Agent unreachable
      }
      return {
        type: agent.type,
        status: "offline" as const,
        description: "",
        name: `${agent.type} agent`,
        pricing: {},
        capabilities: [],
        port: agent.port,
      };
    })
  );

  return NextResponse.json({ agents: results });
}
