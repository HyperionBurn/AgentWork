import React from 'react';
import { LayoutDashboard, Users, GitMerge, Zap, Settings, Menu, X, Cpu, Play, TrendingUp, DollarSign, CheckCircle2, Server, ArrowRightLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface NavSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function NavSidebar({ activeTab, setActiveTab }: NavSidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const tabs = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'playground', label: 'Playground', icon: Play },
    { id: 'agents', label: 'Agent Registry', icon: Users },
    { id: 'economy', label: 'Economy', icon: TrendingUp },
    { id: 'spending', label: 'Spending', icon: DollarSign },
    { id: 'receipts', label: 'Receipts', icon: CheckCircle2 },
    { id: 'evidence', label: 'Evidence', icon: Server },
    { id: 'governance', label: 'Governance', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'submit', label: 'Submission', icon: ArrowRightLeft },
  ];

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 h-16 w-16 z-50 flex items-center justify-center">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-arc-text hover:text-arc-orange">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      
      <div className={cn(
        "fixed md:static inset-y-0 left-0 w-64 bg-arc-surface border-r border-arc-border z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-arc-border bg-arc-surface">
          <Cpu className="w-6 h-6 text-arc-orange mr-3" />
          <span className="font-mono text-lg tracking-wider font-semibold text-white">ARC.OS</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] text-arc-muted font-mono uppercase tracking-widest mb-4 px-2">Menu</div>
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setIsOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all group rounded-md mb-1",
                  isActive 
                    ? "text-arc-orange bg-arc-orange/10 border-l-2 border-arc-orange" 
                    : "text-arc-muted hover:text-arc-text hover:bg-arc-surface-hover border-l-2 border-transparent"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={cn("w-5 h-5", isActive ? "text-arc-orange" : "text-arc-muted group-hover:text-arc-text")} />
                  <span>{tab.label}</span>
                </div>
                <span className="text-[10px] bg-arc-surface border border-arc-border px-1.5 py-0.5 rounded text-arc-muted font-mono hidden group-hover:block transition-all opacity-50 shadow-inner group-hover:opacity-100">{idx + 1}</span>
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-arc-border bg-arc-surface-hover/30">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded bg-arc-orange/10 border border-arc-orange/30 flex items-center justify-center font-mono text-[10px] text-arc-orange font-bold">
              LV7
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[9px] font-mono text-arc-muted uppercase mb-1">
                <span>Orchestrator Rank</span>
                <span>92%</span>
              </div>
              <div className="h-1 w-full bg-arc-border rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '92%' }}
                  transition={{ duration: 1.5, delay: 1 }}
                  className="h-full bg-arc-orange shadow-[0_0_5px_rgba(255,83,0,0.5)]" 
                />
              </div>
            </div>
          </div>
          <p className="text-[9px] font-mono text-arc-muted leading-tight opacity-50 uppercase tracking-tighter">Next Milestone: $10k Net Revenue</p>
        </div>
      </div>
    </>
  );
}
