/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { DashboardShell } from './components/dashboard/DashboardShell';
import { AnimatePresence, motion } from 'motion/react';
import { audioEngine } from './lib/audio';
import { ErrorBoundary } from './components/dashboard/ErrorBoundary';

// Lazy load all tabs
const DashboardHome = lazy(() => import('./components/dashboard/tabs/DashboardHome'));
const PlaygroundTab = lazy(() => import('./components/dashboard/tabs/PlaygroundTab'));
const AgentsTab = lazy(() => import('./components/dashboard/tabs/AgentsTab'));
const EconomyTab = lazy(() => import('./components/dashboard/tabs/EconomyTab'));
const SpendingTab = lazy(() => import('./components/dashboard/tabs/SpendingTab'));
const ReceiptsTab = lazy(() => import('./components/dashboard/tabs/ReceiptsTab'));
const EvidenceTab = lazy(() => import('./components/dashboard/tabs/EvidenceTab'));
const GovernanceTab = lazy(() => import('./components/dashboard/tabs/GovernanceTab'));
const SettingsTab = lazy(() => import('./components/dashboard/tabs/SettingsTab'));

import { useDashboardStore } from './lib/store';

export default function App() {
  const { activeTab, setActiveTab } = useDashboardStore();

  useEffect(() => {
    // Global Audio Initialization
    const audioEnabled = localStorage.getItem('arc-audio-enabled') !== 'false';
    audioEngine.setEnabled(audioEnabled);
  }, []);

  const renderTab = () => {
    switch(activeTab) {
      case 'home': return <DashboardHome />;
      case 'playground': return <PlaygroundTab />;
      case 'agents': return <AgentsTab />;
      case 'economy': return <EconomyTab />;
      case 'spending': return <SpendingTab />;
      case 'receipts': return <ReceiptsTab />;
      case 'evidence': return <EvidenceTab />;
      case 'governance': return <GovernanceTab />;
      case 'settings': return <SettingsTab />;
      default: return <DashboardHome />;
    }
  }

  return (
    <ErrorBoundary>
      <DashboardShell activeTab={activeTab} setActiveTab={setActiveTab}>
        <AnimatePresence>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="max-w-7xl mx-auto w-full pb-20 pt-4"
          >
            <Suspense fallback={<div className="h-96 flex items-center justify-center font-mono text-white/20 uppercase tracking-[0.3em] animate-pulse">Initializing Interface...</div>}>
              {renderTab()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </DashboardShell>
    </ErrorBoundary>
  );
}


