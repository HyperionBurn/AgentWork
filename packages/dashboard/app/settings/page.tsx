"use client";

import { ArcHealthMonitor } from "@/components/ArcHealthMonitor";
import BridgeStatus from "@/components/BridgeStatus";
import TaskTemplates from "@/components/TaskTemplates";
import SessionExport from "@/components/SessionExport";

export default function SettingsPage() {
  return (
    <div className="min-h-screen p-6 bg-[#0a0a0f] text-gray-100">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            ⚙️ Settings
          </h1>
          <p className="mt-2 text-gray-400">
            Network monitoring, session management, and task templates
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column — Network Health */}
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-800 bg-[#12121a] p-5">
              <ArcHealthMonitor />
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#12121a] p-5">
              <BridgeStatus />
            </div>
          </div>

          {/* Right Column — Templates & Export */}
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-800 bg-[#12121a] p-5">
              <TaskTemplates />
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#12121a] p-5">
              <SessionExport />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
