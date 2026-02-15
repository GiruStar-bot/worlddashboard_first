import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

const AnalyticsPanel = ({ data, isOpen, onClose, onSelectCountry, selectedIso }) => {
  const [activeTab, setActiveTab] = useState('gdp');

  const countries = useMemo(() => {
    const arr = [];
    if (data?.regions) Object.values(data.regions).forEach(reg => reg.forEach(c => arr.push(c)));
    return arr;
  }, [data]);

  const rankings = useMemo(() => {
    const gdp    = [...countries].filter(c => c.canonical?.economy?.gdp_nominal?.value  != null).sort((a, b) => b.canonical.economy.gdp_nominal.value  - a.canonical.economy.gdp_nominal.value);
    const risk   = [...countries].filter(c => c.canonical?.risk?.fsi_total?.value       != null).sort((a, b) => b.canonical.risk.fsi_total.value        - a.canonical.risk.fsi_total.value);
    const growth = [...countries].filter(c => c.canonical?.economy?.gdp_growth?.value   != null).sort((a, b) => b.canonical.economy.gdp_growth.value    - a.canonical.economy.gdp_growth.value);
    const pop    = [...countries].filter(c => c.canonical?.society?.population?.value   != null).sort((a, b) => b.canonical.society.population.value    - a.canonical.society.population.value);
    return { gdp, risk, growth, pop };
  }, [countries]);

  const currentData = rankings[activeTab];

  let maxVal = 1;
  if (currentData.length > 0) {
    if      (activeTab === 'gdp')    maxVal = currentData[0].canonical.economy.gdp_nominal.value;
    else if (activeTab === 'risk')   maxVal = 120;
    else if (activeTab === 'growth') maxVal = currentData[0].canonical.economy.gdp_growth.value;
    else if (activeTab === 'pop')    maxVal = currentData[0].canonical.society.population.value;
  }

  const tabs = [
    { key: 'gdp',    label: 'GDP (Nominal)', activeColor: 'text-emerald-400', activeBorder: 'border-b-emerald-400/50' },
    { key: 'risk',   label: 'FSI Risk',      activeColor: 'text-rose-400',    activeBorder: 'border-b-rose-400/50'    },
    { key: 'growth', label: 'GDP Growth',    activeColor: 'text-blue-400',    activeBorder: 'border-b-blue-400/50'    },
    { key: 'pop',    label: 'Population',    activeColor: 'text-amber-400',   activeBorder: 'border-b-amber-400/50'   },
  ];

  return (
    <div className={`absolute top-20 bottom-12 left-0 w-[22rem] md:w-[26rem] transform transition-all duration-700 z-[90] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full bg-[#0f172a]/80 backdrop-blur-xl border-r border-white/[0.06] shadow-[20px_0_60px_rgba(0,0,0,0.5)] overflow-hidden font-['Inter']">

        {/* ヘッダー */}
        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-gradient-to-b from-white/[0.04] to-transparent shrink-0">
          <div className="space-y-1.5">
            <div className="text-xs text-emerald-400 animate-pulse tracking-[0.25em] font-semibold uppercase font-mono">
              GLOBAL_METRICS
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight leading-snug uppercase">ANALYTICS</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 p-2.5 rounded-full transition-colors duration-300">
            <X size={20} />
          </button>
        </div>

        {/* タブ */}
        <div className="grid grid-cols-2 bg-white/[0.02] shrink-0 border-b border-white/5">
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 text-xs font-bold tracking-[0.08em] uppercase font-mono transition-colors border-white/5
                ${i % 2 === 0 ? 'border-r' : ''}
                ${i < 2 ? 'border-b' : ''}
                ${activeTab === tab.key
                  ? `${tab.activeColor} ${tab.activeBorder} bg-white/[0.05]`
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ランキングリスト */}
        <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-3 custom-scrollbar">
          {currentData.map((c, i) => {
            const iso = c.master.iso3;
            const isSelected = iso === selectedIso;
            let valStr, numVal, colorClass, textColorClass, borderColor;

            if (activeTab === 'gdp') {
              numVal = c.canonical.economy.gdp_nominal.value;
              valStr = `$${(numVal / 1e9).toFixed(1)}B`;
              colorClass = 'bg-emerald-400'; textColorClass = 'text-emerald-400'; borderColor = 'border-emerald-500/50';
            } else if (activeTab === 'risk') {
              numVal = c.canonical.risk.fsi_total.value;
              valStr = numVal.toFixed(1);
              colorClass = 'bg-rose-400'; textColorClass = 'text-rose-400'; borderColor = 'border-rose-500/50';
            } else if (activeTab === 'growth') {
              numVal = c.canonical.economy.gdp_growth.value;
              valStr = `${numVal > 0 ? '+' : ''}${numVal.toFixed(1)}%`;
              colorClass = 'bg-blue-400'; textColorClass = 'text-blue-400'; borderColor = 'border-blue-500/50';
            } else if (activeTab === 'pop') {
              numVal = c.canonical.society.population.value;
              valStr = numVal.toLocaleString();
              colorClass = 'bg-amber-400'; textColorClass = 'text-amber-400'; borderColor = 'border-amber-500/50';
            }

            const pct = Math.max(0, (numVal / maxVal) * 100);

            return (
              <div
                key={iso}
                onClick={() => onSelectCountry(iso)}
                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer group
                  ${isSelected
                    ? `bg-white/[0.1] ${borderColor} shadow-lg`
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/20'
                  }`}
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-slate-400 font-bold w-5 text-right shrink-0">{i + 1}.</span>
                    <span className={`text-sm font-bold uppercase tracking-wide transition-colors truncate max-w-[120px] ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                      {c.master.name}
                    </span>
                    <span className="text-xs font-mono text-slate-400 px-1.5 py-0.5 border border-white/10 rounded-full shrink-0">
                      {iso}
                    </span>
                  </div>
                  <span className={`font-mono text-sm font-bold shrink-0 ${textColorClass}`}>{valStr}</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${colorClass} opacity-80 transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
