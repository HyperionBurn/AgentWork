import type { Metadata } from "next";
import "./globals.css";
import { NavSidebar } from "@/components/NavSidebar";

export const metadata: Metadata = {
  title: "AgentWork — AI Agent Marketplace on Arc",
  description:
    "Autonomous AI agent marketplace with nanopayments on Arc L1. Task decomposition, specialist agents, on-chain escrow, and ERC-8004 reputation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-arc-dark">
        <div className="flex">
          <NavSidebar />
          <main className="flex-1 md:ml-[200px] mb-14 md:mb-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
