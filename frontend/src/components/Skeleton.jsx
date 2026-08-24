import React from 'react';

export default function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-4">
      <Skeleton className="w-1/3 h-4" />
      <Skeleton className="w-2/3 h-8" />
      <Skeleton className="w-1/2 h-3" />
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 flex justify-between items-center bg-white dark:bg-navy-900/50">
          <div className="space-y-2 flex-1">
            <Skeleton className="w-1/4 h-4" />
            <Skeleton className="w-1/2 h-3" />
          </div>
          <Skeleton className="w-16 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}
