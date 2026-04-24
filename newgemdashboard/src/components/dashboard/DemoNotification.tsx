import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X, TriangleAlert, CircleCheck, CircleX } from 'lucide-react';
import { useDashboardStore, Notification } from '../../lib/store';
import { cn } from '../../lib/utils';

export function DemoNotification() {
  const { notifications, removeNotification } = useDashboardStore();

  return (
    <div className="fixed top-24 right-8 z-[200] flex flex-col space-y-4 pointer-events-none w-80">
      <AnimatePresence>
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} onRemove={removeNotification} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({ notification, onRemove }: { notification: Notification; onRemove: (id: string) => void }) {
  // Use more robust icon mapping with fallbacks for different Lucide versions
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return CheckCircle2 || CircleCheck || Info;
      case 'warning': return AlertTriangle || TriangleAlert || Info;
      case 'error': return AlertCircle || CircleX || Info;
      default: return Info;
    }
  };

  const Icon = getIcon();

  const colors = {
    success: "border-green-500/20 bg-green-500/5 text-green-400",
    info: "border-blue-500/20 bg-blue-500/5 text-blue-400",
    warning: "border-orange-500/20 bg-orange-500/5 text-orange-500",
    error: "border-red-500/20 bg-red-500/5 text-red-500"
  }[notification.type] || "border-blue-500/20 bg-blue-500/5 text-blue-400";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      className={cn(
        "pointer-events-auto glass-surface border p-4 rounded-2xl flex items-start space-x-4 shadow-2xl backdrop-blur-xl",
        colors
      )}
    >
      <div className="mt-0.5">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold font-mono uppercase tracking-widest leading-none mb-1">{notification.title}</h4>
        <p className="text-[10px] opacity-70 font-mono leading-tight">{notification.message}</p>
      </div>
      <button 
        onClick={() => onRemove(notification.id)}
        className="text-white/20 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
