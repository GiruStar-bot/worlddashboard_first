import React, { useEffect, useRef } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer
} from 'recharts';
import { X, Users, Activity, TrendingUp, AlertTriangle, Database } from 'lucide-react';

// メトリクス表示用サブコンポーネント
const Metric = ({ label, value, icon: Icon, color = "text-cyan-400" }) => (
  <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:bg-white/[0.08] hover:border-cyan-500/30 transition-all duration-300 flex flex-col items-start group shadow-lg">
    <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase font-semibold tracking-wide group-hover:text-slate-200">
      {Icon && <Icon size={12} className="opacity-70 group-hover:opacity-100 transition-opacity" />}
      {label}
    </div>
    <div className={`font-mono ${color} text-lg md:text-xl leading-tight w-full font-bold tracking-tight text-shadow-sm`}>
      {value}
    </div>
  </div>
);

const CountryDetails = ({ country, onClose, onShowReport, hasReport }) => {
  const headlineRef = useRef(null);

  // タイプライターアニメーション
  useEffect(() => {
    if (!country || !headlineRef.current) return;
    const text = country.ui_view?.headline || '';
    let i = 0;
    headlineRef.current.innerHTML = '';
    const timer = setInterval(() => {
      i++;
      headlineRef.current.innerHTML =
        text.slice(0, i) + '<span class="animate-pulse text-cyan-400 font-bold ml-1">_</span>';
      if (i >= text.length) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [country]);

  if (!country) return null;

  const { master, canonical, ui_view } = country;

  const radarData = [
    { subject: 'Economy',    score: ui_view?.scores?.economy_score   || 0 },
    { subject: 'Stability',  score: ui_view?.scores?.stability_score  || 0 },
    { subject: 'Resilience', score: 100 - (canonical?.risk?.fsi_total?.value || 50) },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-[40px] border-l border-white/10 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* ヘッダー */}
      <div className="p-6 border-b border-white/5 flex justify-between items-start bg-gradient-to-b from-white/[0.04] to-transparent shrink-0">
        <div className="space-y-1.5 flex-1 pr-4">
          <div className="text-xs text-cyan-400 animate-pulse tracking-[0.3em] font-semibold uppercase font-mono">
            TARGET_ACQUIRED
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight leading-tight uppercase break-words">
            {master.name}
          </h2>
          <div className="flex flex-wrap gap-2 pt-1 font-mono">
            <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2.5 py-0.5 rounded-full border border-cyan-500/20 uppercase font-semibold tracking-wide">
              {master.iso3}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors duration-300 shrink-0"
        >
          <X size={20} />
        </button>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6 custom-scrollbar">

        {/* Deep Dive Reportボタン */}
        {hasReport && (
          <button
            onClick={onShowReport}
            className="w-full py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 group shadow-lg"
          >
            <Database size={16} className="group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-bold tracking-wide uppercase">Open Deep Dive Report</span>
          </button>
        )}

        {/* ヘッドライン（タイプライター） */}
        <div
          ref={headlineRef}
          className="p-4 rounded-2xl bg-cyan-500/[0.03] border border-cyan-500/10 font-sans text-sm text-slate-300 leading-relaxed min-h-[3.5rem]"
        />

        {/* メトリクスグリッド */}
        <div className="grid grid-cols-2 gap-4">
          <Metric label="Population"   value={canonical?.society?.population?.value?.toLocaleString() || 0}                         icon={Users}          color="text-blue-400"    />
          <Metric label="GDP (Nominal)" value={`$${((canonical?.economy?.gdp_nominal?.value || 0) / 1e9).toFixed(1)}B`}              icon={Activity}       color="text-emerald-400" />
          <Metric label="GDP Growth"    value={`${(canonical?.economy?.gdp_growth?.value || 0)}%`}                                    icon={TrendingUp}     color="text-emerald-400" />
          <Metric label="Risk Index"    value={canonical?.risk?.fsi_total?.value?.toFixed(1) || "N/A"}                               icon={AlertTriangle}  color="text-rose-400"    />
        </div>

        {/* レーダーチャート */}
        <div className="space-y-3">
          <h3 className="text-xs text-slate-400 uppercase tracking-wide font-mono font-semibold">
            Neural_Parameter_Map
          </h3>
          <div className="h-56 border border-white/5 rounded-2xl bg-slate-800/20 p-2 shadow-lg">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10, fontWeight: '500' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Status" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} dot={{ r: 3, fill: '#06b6d4' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryDetails;
