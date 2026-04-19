"use client";

import { useState } from "react";

// ============================================================
// SessionExport — Export session evidence package
// ============================================================

export default function SessionExport() {
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);

  async function handleExport(format: "json" | "html") {
    setExporting(true);
    try {
      const res = await fetch(`/api/session-export?format=${format}`);
      if (res.ok) {
        const data = format === "json" ? JSON.stringify(await res.json(), null, 2) : await res.text();
        setExportData(data);
        setShowModal(true);
      }
    } catch {
      // Export unavailable
    } finally {
      setExporting(false);
    }
  }

  function copyToClipboard() {
    if (exportData) {
      navigator.clipboard.writeText(exportData);
    }
  }

  return (
    <>
      <button
        onClick={() => handleExport("json")}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-arc-card border border-arc-border text-sm text-slate-300 hover:border-arc-purple transition-colors disabled:opacity-50"
      >
        <span>📤</span>
        <span>{exporting ? "Exporting..." : "Export"}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-arc-card border border-arc-border rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">📦 Session Export</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleExport("json")}
                className="px-3 py-1 rounded-lg bg-arc-purple/20 text-arc-purple text-xs hover:bg-arc-purple/30"
              >
                JSON
              </button>
              <button
                onClick={() => handleExport("html")}
                className="px-3 py-1 rounded-lg bg-arc-blue/20 text-arc-blue text-xs hover:bg-arc-blue/30"
              >
                HTML
              </button>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30"
              >
                📋 Copy
              </button>
            </div>

            <pre className="flex-1 overflow-auto bg-arc-dark rounded-lg p-3 text-xs text-slate-300 font-mono">
              {exportData}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
