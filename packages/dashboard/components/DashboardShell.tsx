"use client";

import { usePathname } from "next/navigation";
import { NavSidebar } from "@/components/NavSidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/landing";

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen dashboard-dark">
      <NavSidebar />
      <main className="flex-1 md:ml-[200px] mb-14 md:mb-0">
        {children}
      </main>
    </div>
  );
}
