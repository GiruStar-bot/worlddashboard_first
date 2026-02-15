import React from 'react';

const formatValue = (value, unit) => {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return value;
  if (Math.abs(num) >= 1000) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const DeltaIndicator = ({ current, previous }) => {
  if (previous === null || previous === undefined || current === null || current === undefined) return null;
  const delta = current - previous;
  const pct = previous !== 0 ? ((delta / Math.abs(previous)) * 100).toFixed(1) : '—';
  const isPositive = delta > 0;

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
      <span>{isPositive ? '\u25B2' : '\u25BC'}</span>
      <span>{pct}%</span>
    </span>
  );
};

export default function CustomTooltip({ active, payload, label, unitOverride, previousDataLookup }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-xl p-3 shadow-2xl min-w-[180px]">
      <div className="border-b border-white/10 pb-1.5 mb-2">
        <p className="text-[11px] font-semibold text-slate-300 font-['Inter']">{label}</p>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, idx) => {
          const prevVal = previousDataLookup ? previousDataLookup(entry.dataKey, label) : null;
          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-[10px] text-slate-400 font-['Inter'] capitalize">
                  {entry.name || entry.dataKey}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-100 font-['JetBrains_Mono',monospace] tabular-nums">
                  {formatValue(entry.value, unitOverride)}
                  {unitOverride ? <span className="text-slate-500 ml-0.5 text-[9px]">{unitOverride}</span> : null}
                </span>
                <DeltaIndicator current={entry.value} previous={prevVal} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
