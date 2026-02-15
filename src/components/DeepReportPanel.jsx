import React from 'react';
import { X, FileText, Scale, Pickaxe, ShieldAlert, TrendingUp } from 'lucide-react';

const DeepReportPanel = ({ report, onClose }) => {
  if (!report) return null;

  const { meta, key_takeaways, analysis } = report;
  const displayName = meta.country_name_ja || meta.country_name_en;

  return (
    <div className="flex flex-col h-full bg-[#0f172a]/80 backdrop-blur-xl border-r border-l border-white/[0.06] shadow-2xl overflow-hidden animate-in slide-in-from-right duration-700 font-['Inter']">
      {/* ヘッダー */}
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-b from-white/[0.04] to-transparent shrink-0">
        <div className="space-y-1">
          <div className="text-xs text-amber-400 animate-pulse tracking-[0.25em] font-semibold uppercase font-mono flex items-center gap-2">
            <FileText size={12} /> DEEP_DIVE_INTEL
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight leading-snug uppercase">
            {displayName} <span className="text-slate-500 text-sm">REPORT</span>
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors duration-300"
        >
          <X size={20} />
        </button>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6 custom-scrollbar">

        {/* Executive Summary */}
        <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <Scale size={40} className="text-amber-500" />
          </div>
          <h3 className="text-xs text-amber-400 font-bold uppercase tracking-wide mb-3 font-mono">
            Executive Summary
          </h3>
          <ul className="space-y-3">
            {key_takeaways.map((item, idx) => (
              <li key={idx} className="text-sm text-slate-200 leading-relaxed pl-4 relative border-l border-amber-500/30">
                <span className="absolute left-0 top-1.5 w-1 h-1 bg-amber-500 rounded-full -ml-[2.5px]" />
                {item.claim}
              </li>
            ))}
          </ul>
        </div>

        {/* Resource Endowment */}
        {analysis.resource_endowment && (
          <div className="space-y-3">
            <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wide pl-2 flex items-center gap-2">
              <Pickaxe size={12} /> Resource Endowment
            </h3>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {analysis.resource_endowment.summary}
              </p>
              <div className="grid gap-2">
                {analysis.resource_endowment.notable_resources.map((res, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-white/5 border border-white/5">
                    <span className="text-cyan-400 font-bold uppercase shrink-0">{res.name}</span>
                    <span className="text-slate-400 border-l border-white/10 pl-2">{res.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Political Stability */}
        {analysis.political_stability && (
          <div className="space-y-3">
            <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wide pl-2 flex items-center gap-2">
              <ShieldAlert size={12} /> Political Stability
            </h3>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {analysis.political_stability.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.political_stability.key_actors.map((actor, i) => (
                  <span key={i} className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-300 uppercase">
                    {actor.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Economic Structure */}
        {analysis.economic_structure && (
          <div className="space-y-3">
            <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wide pl-2 flex items-center gap-2">
              <TrendingUp size={12} /> Economic Structure
            </h3>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                {analysis.economic_structure.summary}
              </p>
            </div>
          </div>
        )}

        {/* フッター */}
        <div className="text-xs text-slate-500 font-mono text-center pt-4 uppercase">
          Source Confidence: {report.meta.confidence.overall} | Updated: {new Date(report.meta.generated_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default DeepReportPanel;
