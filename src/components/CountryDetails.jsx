import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer
} from 'recharts';
import { X, Users, Activity, TrendingUp, AlertTriangle, FileText } from 'lucide-react';

const Metric = ({ label, value, icon: Icon, valueColor = "text-slate-100" }) => (
  <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg flex flex-col gap-1">
    <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1.5">
      {Icon && <Icon size={10} />}
      {label}
    </div>
    <div className={`text-base font-semibold font-mono ${valueColor}`}>
      {value}
    </div>
  </div>
);

const CountryDetails = ({ country, onClose, onShowReport, hasReport }) => {
  if (!country) return null;

  const { master, canonical, ui_view } = country;

  const radarData = [
    { subject: 'Economy',    score: ui_view?.scores?.economy_score   || 0 },
    { subject: 'Stability',  score: ui_view?.scores?.stability_score  || 0 },
    { subject: 'Resilience', score: 100 - (canonical?.risk?.fsi_total?.value || 50) },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f172a]/95 backdrop-blur-xl border-l border-white/[0.06] shadow-2xl font-sans">
      
      {/* ヘッダー: シンプルに */}
      <div className="h-16 px-6 border-b border-white/[0.06] flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-100 leading-none">
            {master.name}
          </h2>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            ISO: {master.iso3}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 p-1.5 rounded-full hover:bg-white/[0.05] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

        {/* キャッチフレーズ（タイプライター廃止、静的表示） */}
        {country.ui_view?.headline && (
          <div className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-slate-600 pl-4">
            "{country.ui_view.headline}"
          </div>
        )}

        {/* Deep Dive Action */}
        {hasReport && (
          <button
            onClick={onShowReport}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider"
          >
            <FileText size={14} />
            View Intelligence Report
          </button>
        )}

        {/* Key Metrics */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Population"   value={canonical?.society?.population?.value?.toLocaleString() || "-"} icon={Users} />
            <Metric label="GDP (Nominal)" value={`$${((canonical?.economy?.gdp_nominal?.value || 0) / 1e9).toFixed(1)}B`} icon={Activity} valueColor="text-emerald-400" />
            <Metric label="GDP Growth"    value={`${(canonical?.economy?.gdp_growth?.value || 0)}%`} icon={TrendingUp} valueColor={canonical?.economy?.gdp_growth?.value >= 0 ? "text-emerald-400" : "text-rose-400"} />
            <Metric label="FSI Risk (R)"  value={canonical?.risk?.fsi_total?.value?.toFixed(1) || "-"} icon={AlertTriangle} valueColor="text-rose-400" />
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Structural Balance</h3>
          <div className="h-64 border border-white/[0.06] rounded-lg bg-white/[0.01] p-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Score" dataKey="score" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CountryDetails;
