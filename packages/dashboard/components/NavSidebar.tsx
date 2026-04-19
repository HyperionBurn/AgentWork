"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavSidebarProps {
  connected?: boolean;
  agentCount?: { online: number; total: number };
  connectionMode?: "connecting" | "live" | "polling";
}

const routes = [
  { path: "/", label: "Dashboard", icon: "📊" },
  { path: "/agents", label: "Agents", icon: "🤖" },
  { path: "/economy", label: "Economy", icon: "💰" },
  { path: "/evidence", label: "Evidence", icon: "📋" },
  { path: "/governance", label: "Governance", icon: "🏛️" },
  { path: "/settings", label: "Settings", icon: "⚙️" },
  { path: "/submit", label: "Submit", icon: "🚀" },
] as const;

const MOBILE_VISIBLE_COUNT = 5;

function StatusDot({ mode }: { mode: NavSidebarProps["connectionMode"] }) {
  const color =
    mode === "live"
      ? "bg-emerald-400"
      : mode === "connecting"
        ? "bg-yellow-400 animate-pulse"
        : "bg-slate-500";

  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

export function NavSidebar({
  connected = false,
  agentCount = { online: 0, total: 0 },
  connectionMode = "connecting",
}: NavSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const mobileRoutes = routes.slice(0, MOBILE_VISIBLE_COUNT);
  const overflowRoutes = routes.slice(MOBILE_VISIBLE_COUNT);
  const hasOverflow = overflowRoutes.length > 0;

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <nav
        className="fixed left-0 top-0 z-40 hidden h-screen w-[200px] flex-col border-r border-arc-border bg-arc-card md:flex"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex flex-col gap-0.5 border-b border-arc-border px-4 py-5">
          <span className="text-lg font-bold text-white">
            🤖 AgentWork
          </span>
          <span className="text-xs text-slate-500">Arc L1</span>
        </div>

        {/* Routes */}
        <ul className="flex-1 overflow-y-auto py-2" role="list">
          {routes.map((route) => {
            const active = isActive(route.path);
            const isSubmit = route.path === "/submit";

            return (
              <li key={route.path}>
                <Link
                  href={route.path}
                  className={`flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm transition-colors ${
                    active
                      ? "border-arc-purple bg-arc-purple/20 text-white"
                      : isSubmit
                        ? "border-arc-purple/40 text-arc-purple hover:bg-slate-800 hover:text-white"
                        : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="text-base" aria-hidden="true">
                    {route.icon}
                  </span>
                  <span>{route.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Connection Status */}
        <div className="border-t border-arc-border px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <StatusDot mode={connectionMode} />
            <span>
              {agentCount.online}/{agentCount.total} agents
            </span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
            {connected ? "● Live" : "○ Offline"}
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-arc-border bg-arc-card md:hidden"
        aria-label="Mobile navigation"
      >
        {mobileRoutes.map((route) => {
          const active = isActive(route.path);

          return (
            <Link
              key={route.path}
              href={route.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors ${
                active
                  ? "text-arc-purple"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-lg" aria-hidden="true">
                {route.icon}
              </span>
              <span>{route.label}</span>
            </Link>
          );
        })}

        {hasOverflow && (
          <details className="group relative flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200">
            <summary className="flex cursor-pointer flex-col items-center gap-0.5 list-none">
              <span className="text-lg" aria-hidden="true">
                ⋯
              </span>
              <span>More</span>
            </summary>
            <ul
              className="absolute bottom-full right-0 mb-2 min-w-[140px] rounded-lg border border-arc-border bg-arc-card p-1 shadow-xl"
              role="list"
            >
              {overflowRoutes.map((route) => {
                const active = isActive(route.path);

                return (
                  <li key={route.path}>
                    <Link
                      href={route.path}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-arc-purple/20 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <span aria-hidden="true">{route.icon}</span>
                      <span>{route.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </nav>
    </>
  );
}
