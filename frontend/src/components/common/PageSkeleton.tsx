import React from 'react';

export const MetricSkeleton: React.FC = () => {
  return (
    <div className="card-glass p-6 animate-pulse">
      <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-slate-800 rounded w-2/3 mb-3"></div>
      <div className="h-3 bg-slate-800 rounded w-1/2"></div>
    </div>
  );
};

export const PageSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="h-7 bg-slate-800 rounded w-1/4"></div>
        <div className="h-9 bg-slate-800 rounded w-32"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
      <div className="card-glass p-6 h-64 flex items-center justify-center">
        <div className="h-10 bg-slate-800 rounded w-1/2"></div>
      </div>
    </div>
  );
};
