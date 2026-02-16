import React from 'react';
import { X, FileText } from 'lucide-react';

const DeepReportPanel = ({ report, onClose }) => {
  if (!report) return null;

  const { meta, key_takeaways, analysis } = report;
  const displayName = meta.country_name_ja || meta.country_name_en;
  const takeaways = Array.isArray(key_takeaways) ? key_takeaways : [];
  const reportAnalysis = analysis || {};

  return (
    <div className="flex flex-col h-full bg-[#0f172a]/95 backdrop-blur-xl border-l border-white/[0.06] shadow-2xl animate-in slide-in-from-right duration-500 font-sans">
      
      {/* ヘッダー */}
      <div className="h-16 px-6 border-b border-white/[0.06] flex justify-between items-center shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-500/10 rounded text-amber-500">
            <FileText size={16} />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Intelligence Report</div>
            <h2 className="text-sm font-bold text-slate-100 uppercase">
              {displayName}
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 p-1.5 rounded-full hover:bg-white/[0.05] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

        {/* Executive Summary */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-white/[0.06] pb-2">
            Executive Summary
          </h3>
          <div className="space-y-3">
            {takeaways.map((item, idx) => (
              <div key={idx} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                <span className="text-amber-500 font-bold mt-0.5">•</span>
                <span>{item.claim}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sections Loop */}
        {[
          { key: 'resource_endowment', title: 'Resource Endowment' },
          { key: 'political_stability', title: 'Political Stability' },
          { key: 'economic_structure', title: 'Economic Structure' }
        ].map(section => {
          const content = reportAnalysis[section.key];
          if (!content) return null;

          return (
            <section key={section.key}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-white/[0.06] pb-2">
                {section.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {content.summary}
              </p>
              
              {/* Additional Tags/Items specific to sections */}
              {content.notable_resources && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {content.notable_resources.map((res, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded bg-white/[0.05] border border-white/[0.05] text-slate-300">
                      {res.name}
                    </span>
                  ))}
                </div>
              )}
              {content.key_actors && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {content.key_actors.map((actor, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded bg-white/[0.05] border border-white/[0.05] text-slate-300">
                      {actor.name}
                    </span>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {/* Footer */}
        <div className="pt-6 border-t border-white/[0.06] text-[10px] text-slate-600 flex justify-between">
          <span>Confidence: {report.meta.confidence.overall}</span>
          <span>Gen: {new Date(report.meta.generated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default DeepReportPanel;
