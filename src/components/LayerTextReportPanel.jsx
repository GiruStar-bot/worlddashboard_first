import React from 'react';
import { FileText } from 'lucide-react';

const LABELS = {
  military_power: 'Military Power',
  strategic_resources: 'Strategic Resources',
  industrial_tech: 'Industrial & Tech',
  financial_power: 'Financial Power',
  wielding_behavior: 'Wielding Behavior',
  bri_exposure: 'BRI Exposure',
  domestic_risks: 'Domestic Risks',
  logistics_exposure: 'Logistics Exposure',
};

const LAYER_CONFIG = {
  fsi: {
    title: 'Geopolitical Text Report',
    themeClasses: {
      header: 'bg-cyan-500/10',
      text: 'text-cyan-300',
    },
    keys: ['military_power', 'strategic_resources', 'industrial_tech', 'financial_power', 'wielding_behavior'],
  },
  china: {
    title: 'China Influence Text Report',
    themeClasses: {
      header: 'bg-amber-500/10',
      text: 'text-amber-300',
    },
    keys: ['bri_exposure', 'domestic_risks', 'logistics_exposure', 'industrial_tech', 'financial_power'],
  },
};

const LayerTextReportPanel = ({ activeLayer, countryName, report }) => {
  const config = LAYER_CONFIG[activeLayer] || LAYER_CONFIG.fsi;
  const values = report?.indicators || {};

  return (
    <aside className="absolute top-20 bottom-12 left-4 md:left-6 w-[22rem] z-[89]">
      <div className="h-full bg-slate-900/60 backdrop-blur-[40px] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
        <div className={`p-4 border-b border-white/10 ${config.themeClasses.header}`}>
          <div className={`text-[9px] uppercase tracking-[0.3em] font-mono font-semibold ${config.themeClasses.text} flex items-center gap-2`}>
            <FileText size={12} /> LAYER_REPORT
          </div>
          <h3 className="mt-2 text-sm font-semibold text-slate-100 uppercase tracking-wide">{config.title}</h3>
          <p className="mt-1 text-[10px] text-slate-400 uppercase tracking-[0.2em]">{countryName || 'No country selected'}</p>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-5.5rem)] custom-scrollbar">
          {report ? (
            <>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Score</div>
                <div className={`text-2xl font-bold ${config.themeClasses.text}`}>{Number(report.score).toFixed(1)}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Narrative</div>
                <p className="text-xs text-slate-300 leading-relaxed">{report.narrative}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Indicators</div>
                {config.keys.map((key) => (
                  <div key={key} className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>{LABELS[key] || key}</span>
                    <span className="font-mono text-slate-100">{values[key] ?? 'N/A'}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-xs text-slate-400 leading-relaxed">
              Select a country to view the active layer's textual geopolitical report.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default LayerTextReportPanel;
