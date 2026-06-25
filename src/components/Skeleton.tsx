import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden />
);

export const SkeletonCard: React.FC = () => (
  <div className="glass-panel p-6 flex items-center gap-5">
    <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-16" />
    </div>
  </div>
);

export const SkeletonNews: React.FC = () => (
  <div className="glass-panel p-5 space-y-3">
    <Skeleton className="h-4 w-20 rounded-full" />
    <Skeleton className="h-5 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);
