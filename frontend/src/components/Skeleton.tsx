import React from 'react';

// ─── Skeleton primitives ───────────────────────────────────────────
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// ─── Stat Card Skeleton ────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl">
      <div className="flex justify-between items-start mb-4">
        <SkeletonBlock className="h-10 w-10 rounded-xl" />
      </div>
      <SkeletonBlock className="h-3 w-20 mb-3" />
      <SkeletonBlock className="h-8 w-28 mb-2" />
      <SkeletonBlock className="h-2 w-36" />
    </div>
  );
}

// ─── Table Row Skeleton ────────────────────────────────────────────
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBlock className={`h-4 ${i === 0 ? 'w-8' : i === cols - 1 ? 'w-16' : 'w-24'}`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Dashboard Full Skeleton ───────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <SkeletonBlock className="h-10 w-28 rounded-lg" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl">
          <SkeletonBlock className="h-5 w-40 mb-2" />
          <SkeletonBlock className="h-3 w-56 mb-6" />
          <SkeletonBlock className="h-72 w-full rounded-xl" />
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl space-y-4">
          <SkeletonBlock className="h-5 w-36 mb-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── History Table Skeleton ────────────────────────────────────────
export function HistorySkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl">
        <div className="flex justify-between mb-6">
          <SkeletonBlock className="h-10 w-64 rounded-lg" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-10 w-24 rounded-lg" />
            <SkeletonBlock className="h-10 w-24 rounded-lg" />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {['ID','Date','Amount','Result','Risk','Confidence','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left">
                  <SkeletonBlock className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={7} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
