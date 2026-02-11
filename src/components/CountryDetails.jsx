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
import { X } from 'lucide-react';

/*
 * CountryDetails HUD - Displays detailed info for the selected country.
 */
function Metric({ label, value }) {
  return (
    <div className="p-2 bg-slate-800/50 border border-white/5 rounded flex flex-col items-start hover:border-primary/30 transition-colors">
      <span className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider">{label}</span>
      <span className="font-mono text-base text-primary whitespace-nowrap text-glow">
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
    }, 20);
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

  const population = country.canonical?.society?.population?.value ?? 0;
  const gdpNominal = country.canonical?.economy?.gdp_nominal?.value ?? 0;
  const perCapita = population ? gdpNominal / population : 0;

  return (
    <div className="flex flex-col h-full relative">
      {/* Header with Close Button */}
      <div className="p-5 border-b border-white/10 flex justify-between items-start bg-slate-900/50">
        <div>
          <div className="text-[10px] text-primary mb-1 tracking-widest animate-pulse">TARGET ACQUIRED</div>
          <h2 className="text-xl font-bold text-white leading-tight">
            {country.master?.name}
          </h2>
          <div className="text-xs font-mono text-slate-500 mt-1">{country.master?.iso3}</div>
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
        <div className="min-h-[3rem] p-3 rounded bg-primary/5 border-l-2 border-primary">
          <p className="font-mono text-xs text-slate-300 leading-relaxed">
            {headline}<span className="animate-pulse text-primary">_</span>
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Population" value={population.toLocaleString()} />
          <Metric label="GDP (Nominal)" value={`$${(gdpNominal / 1e9).toFixed(1)}B`} />
          <Metric label="GDP / Capita" value={`$${Math.round(perCapita).toLocaleString()}`} />
          <Metric label="Risk Index" value={country.canonical?.risk?.fsi_total?.value ?? "N/A"} />
        </div>

        {/* Radar Chart */}
        <div className="h-48 relative border border-white/5 rounded bg-slate-800/30 p-2">
          <h3 className="text-[10px] text-slate-500 uppercase tracking-wider absolute top-2 left-3">Parameter Analysis</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="55%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar name="Score" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
              <ChartTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {country.ui_view?.tags?.map((tag) => (
            <span key={tag} className="px-2 py-1 rounded text-[10px] uppercase tracking-wider border border-white/10 text-slate-300 bg-slate-800">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
