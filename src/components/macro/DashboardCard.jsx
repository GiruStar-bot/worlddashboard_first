import React from 'react';

export default function DashboardCard({ title, source, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-5 flex flex-col ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 font-['Inter'] tracking-wide">{title}</h3>
          {subtitle && (
            <p className="text-[10px] text-slate-500 font-['Inter'] mt-0.5">{subtitle}</p>
          )}
        </div>
        {source && (
          <span className="text-[9px] text-slate-600 font-['Inter'] bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.05] flex-shrink-0">
            {source}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
