import React, { useState, useMemo } from 'react';
import { X, TrendingUp, AlertTriangle, Users, DollarSign, BarChart2 } from 'lucide-react';

const AnalyticsPanel = ({ data, isOpen, onClose, onSelectCountry, selectedIso }) => {
  const [activeTab, setActiveTab] = useState('gdp');

  // データ処理ロジックは既存と同じ
  const countries = useMemo(() => {
    const arr = [];
    if (data?.regions) Object.values(data.regions).forEach(reg => reg.forEach(c => arr.push(c)));
    return arr;
  }, [data]);

  const rankings = useMemo(() => {
    // ソートロジック (既存維持)
    const gdp    = [...countries].filter(c => c.canonical?.economy?.gdp_nominal?.value  != null).sort((a, b) => b.canonical.economy.gdp_nominal.value  - a.canonical.economy.gdp_nominal.value);
    const risk   = [...countries].filter(c => c.canonical?.risk?.fsi_total?.value       != null).sort((a, b) => b.canonical.risk.fsi_total.value        - a.canonical.risk.fsi_total.value);
    const growth = [...countries].filter(c => c.canonical?.economy?.gdp_growth?.value   != null).sort((a, b) => b.canonical.economy.gdp_growth.value    - a.canonical.economy.gdp_growth.value);
    const pop    = [...countries].filter(c => c.canonical?.society?.population?.value   != null).sort((a, b) => b.canonical.society.population.value    - a.canonical.society.population.value);
    return { gdp, risk, growth, pop };
  }, [countries]);

  const currentData = rankings[activeTab];
  
  // バーの最大値計算
  let maxVal = 1;
  if (currentData.length > 0) {
    if      (activeTab === 'gdp')    maxVal = currentData[0].canonical.economy.gdp_nominal.value;
    else if (activeTab === 'risk')   maxVal = 120;
    else if (activeTab === 'growth') maxVal = Math.max(...currentData.map(c => c.canonical.economy.gdp_growth.value));
    else if (activeTab === 'pop')    maxVal = currentData[0].canonical.society.population.value;
  }

  // タブ設定: アイコンを追加し、色味を落ち着かせる
  const tabs = [
    { key: 'gdp',    label: 'GDP',    icon: DollarSign,    color: 'bg-emerald-500', barColor: 'bg-emerald-500' },
    { key: 'risk',   label: 'Risk',   icon: AlertTriangle, color: 'bg-rose-500',    barColor: 'bg-rose-500' },
    { key: 'growth', label: 'Growth', icon: TrendingUp,    color: 'bg-blue-500',    barColor: 'bg-blue-500' },
    { key: 'pop',    label: 'Pop.',   icon: Users,         color: 'bg-amber-500',   barColor: 'bg-amber-500' },
  ];

  const activeTabConfig = tabs.find(t => t.key === activeTab);

  return (
    <div className={`absolute top-16 bottom-0 left-0 w-full sm:w-80 md:w-[24rem] transform transition-transform duration-300 z-[90] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full bg-[#0f172a]/95 backdrop-blur-xl border-r border-white/[0.06] shadow-2xl">

        {/* ヘッダー */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-white/[0.06] shrink-0">
          <h2 className="text-sm font-semibold text-slate-100 font-['Inter'] flex items-center gap-2">
            <BarChart2 size={16} className="text-slate-400" />
            Global Rankings
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* タブ切り替え: MacroStatsOverlay風のサイドバーではなく、上部タブ形式を採用（幅の都合） */}
        <div className="p-3 grid grid-cols-4 gap-1 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-center justify-center py-2 rounded-md transition-all duration-200 text-[10px] font-medium gap-1
                  ${isActive 
                    ? 'bg-white/[0.08] text-slate-100 shadow-sm border border-white/[0.04]' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'}`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'opacity-70'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* リスト表示 */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar space-y-1">
          {currentData.map((c, i) => {
            const iso = c.master.iso3;
            const isSelected = iso === selectedIso;
            
            // 値のフォーマット
            let valStr;
            const numVal = 
              activeTab === 'gdp' ? c.canonical.economy.gdp_nominal.value :
              activeTab === 'risk' ? c.canonical.risk.fsi_total.value :
              activeTab === 'growth' ? c.canonical.economy.gdp_growth.value :
              c.canonical.society.population.value;

            if (activeTab === 'gdp') valStr = `$${(numVal / 1e9).toFixed(1)}B`;
            else if (activeTab === 'risk') valStr = numVal.toFixed(1);
            else if (activeTab === 'growth') valStr = `${numVal > 0 ? '+' : ''}${numVal.toFixed(1)}%`;
            else valStr = (numVal / 1e6).toFixed(1) + 'M';

            // バーの長さ
            const pct = Math.max(0, Math.min(100, (numVal / maxVal) * 100));

            return (
              <div
                key={iso}
                onClick={() => onSelectCountry(iso)}
                className={`group relative px-3 py-2.5 rounded-md border cursor-pointer transition-all duration-200 flex flex-col gap-1.5
                  ${isSelected
                    ? 'bg-white/[0.08] border-white/10 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/[0.04]'
                  }`}
              >
                <div className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2.5">
                     <span className="text-slate-500 w-4 text-right font-mono text-[10px]">{i + 1}</span>
                     <span className={`font-medium ${isSelected ? 'text-slate-100' : 'text-slate-300 group-hover:text-slate-200'}`}>
                       {c.master.name}
                     </span>
                   </div>
                   <span className="font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
                     {valStr}
                   </span>
                </div>
                
                {/* バーグラフ: フラットなデザインに */}
                <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${activeTabConfig.barColor} opacity-80`} 
                    style={{ width: `${pct}%` }} 
                  />
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
