import React from 'react';
import { cn } from '../../lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden animate-pulse", className)}>
      <div className="h-40 bg-white/[0.02]" />
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 flex flex-col space-y-4 animate-pulse", className)}>
      <div className="h-4 w-32 bg-white/[0.05] rounded" />
      <div className="flex-1 w-full bg-white/[0.02] rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: { rows?: number, className?: string }) {
  return (
    <div className={cn("space-y-3 animate-pulse", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 w-full bg-white/[0.03] border border-white/[0.05] rounded shadow-sm" />
      ))}
    </div>
  );
}

export function SkeletonValue({ className }: { className?: string }) {
  return <div className={cn("h-8 w-24 bg-white/[0.05] rounded animate-pulse", className)} />;
}
