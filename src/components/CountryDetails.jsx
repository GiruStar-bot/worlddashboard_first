import React, { useEffect, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from 'recharts';
import { X, Activity, Users, Globe, AlertTriangle } from 'lucide-react';

/*
 * CountryDetails Component
 * UPDATED: Enhanced tooltip visibility for the Radar chart.
 */

function Metric({ label, value, icon: Icon, color = "text-primary" }) {
  return (
    <div className="p-3 bg-slate-800/50 border border-white/5 rounded flex flex-col items-start hover:border-primary/30 transition-colors group">
      <div className="flex items-center gap-2 mb-1 w-full">
        {Icon && <Icon size={12} className="text-slate-500 group-hover:text-white transition-colors" />}
        <span className="text-[10px] text-slate-400 uppercase tracking-wider truncate">{label}</span>
      </div>
      <span className={`font-mono text-base ${color} whitespace-nowrap text-glow`}>
        {value}
      </span>
    </div>
  );
}

export default function CountryDetails({ country, onClose }) {
  const [headline, setHeadline] = useState('');

  useEffect(() => {
    if (!country) {
      setHeadline('');
      return;
    }
    const text = country.ui_view?.headline || '';
    let i = 0;
    setHeadline('');
    const timer = setInterval(() => {
      i++;
      setHeadline(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, 15);
    return () => clearInterval(timer);
  }, [country]);

  if (!country) return null;

  // Radar chart data
  const scores = country.ui_view?.scores || {};
  const radarData = [
    { subject: 'Economy', score: scores.economy_score ?? 0 },
    { subject: 'Stability', score: scores.stability_score ?? 0 },
    { subject: 'Resilience', score: 100 - (country.canonical?.risk?.fsi_total?.value || 50) },
  ];

  // Extract metrics safely
  const population = country.canonical?.society?.population?.value ?? 0;
  const gdpNominal = country.canonical?.economy?.gdp_nominal?.value ?? 0;
  const perCapita = population ? gdpNominal / population : 0;
  const riskValue = country.canonical?.risk?.fsi_total?.value ?? 0;
  const regimeType = country.canonical?.politics?.regime_type || "N/A";
  const gdpGrowth = country.canonical?.economy?.gdp_growth?.value;

  return (
    <div className="flex flex-col h-full relative">
      {/* Header with Close Button */}
      <div className="p-5 border-b border-white/10 flex justify-between items-start bg-slate-900/50">
        <div>
          <div className="text-[10px] text-primary mb-1 tracking-widest animate-pulse">TARGET ACQUIRED</div>
          <h2 className="text-xl font-bold text-white leading-tight">
            {country.master?.name}
          </h2>
          <div className="text-xs font-mono text-slate-500 mt-1 flex items-center gap-2">
            <span className="bg-slate-800 px-1 rounded">{country.master?.iso3}</span>
            <span>{regimeType}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
        
        {/* Animated Headline */}
        <div className="min-h-[4rem] p-3 rounded bg-primary/5 border-l-2 border-primary backdrop-blur-sm">
          <p className="font-mono text-xs text-slate-300 leading-relaxed">
            {headline}<span className="animate-pulse text-primary">_</span>
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Metric 
            label="Population" 
            value={population.toLocaleString()} 
            icon={Users}
            color="text-blue-400"
          />
          <Metric 
            label="GDP (Nominal)" 
            value={`$${(gdpNominal / 1e9).toFixed(1)}B`} 
            icon={Activity}
            color="text-emerald-400"
          />
          <Metric 
            label="GDP Growth" 
            value={gdpGrowth !== undefined ? `${gdpGrowth > 0 ? '+' : ''}${gdpGrowth}%` : "N/A"} 
            icon={Activity}
            color={gdpGrowth < 0 ? "text-red-400" : "text-emerald-400"}
          />
          <Metric 
            label="Risk Index (FSI)" 
            value={riskValue ? riskValue.toFixed(1) : "N/A"} 
            icon={AlertTriangle}
            color={riskValue > 80 ? "text-red-500" : (riskValue > 60 ? "text-yellow-400" : "text-primary")}
          />
        </div>

        {/* Radar Chart */}
        <div className="h-48 relative border border-white/5 rounded bg-slate-800/30 p-2">
          <div className="absolute top-2 left-3 flex items-center gap-1">
             <Globe size={10} className="text-slate-500"/>
             <h3 className="text-[10px] text-slate-500 uppercase tracking-wider">Parameter Analysis</h3>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="55%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar name="Score" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
              <ChartTooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: '11px' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <h3 className="text-[10px] text-slate-500 uppercase tracking-wider">Classification Tags</h3>
          <div className="flex flex-wrap gap-2">
            {country.ui_view?.tags?.map((tag) => (
              <span key={tag} className="px-2 py-1 rounded text-[10px] uppercase tracking-wider border border-white/10 text-slate-300 bg-slate-800 hover:border-primary/50 transition-colors cursor-default">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
