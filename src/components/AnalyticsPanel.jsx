import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Globe, ChevronUp, Activity, Maximize, Minimize, BarChart2, TrendingUp, Layers } from 'lucide-react';

// コンポーネント
import WorldMap        from './components/WorldMap';
import CountryDetails  from './components/CountryDetails';
import DeepReportPanel from './components/DeepReportPanel';
import AnalyticsPanel  from './components/AnalyticsPanel';
import GlobalStreamPanel from './components/GlobalStreamPanel';
import MacroStatsOverlay from './components/MacroStatsOverlay';
import { REPORT_FILES } from './constants/isoMap';

export default function App() {
  // ... (Stateとデータ取得ロジックは変更なしのため省略。既存のまま維持) ...
  // ※ ここではUIに関わる render 部分のみ書き換えます
  
  // (中略: State定義とuseEffect群)
  const [data, setData] = useState(null);
  const [isAnalyticsPanelOpen, setIsAnalyticsPanelOpen] = useState(false);
  const [isMacroOverlayOpen, setIsMacroOverlayOpen] = useState(false);
  // ... 他のStateも既存通り

  // ... (データ取得ロジック省略) ...

  // Loading Screen: 演出を控えめに
  if (!data) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400 font-sans">
      <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin mb-4" />
      <span className="text-sm font-medium tracking-widest uppercase">System Initializing...</span>
    </div>
  );

  const allCountries = data?.regions ? Object.values(data.regions).flat() : [];
  const selectedCountry = allCountries.find(c => c.master.iso3 === selectedIso) || null;
  const selectedReport  = selectedIso ? reports[selectedIso] : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#020617] relative font-sans text-slate-200">
      
      {/* 削除: ノイズテクスチャ、スキャンライン、グラデーションオーバーレイ */}
      
      {/* ═══ ヘッダー: マットデザイン ══════════════════════════════════ */}
      <header className="absolute top-0 left-0 right-0 h-16 flex items-center px-6 justify-between z-[110] bg-[#0f172a]/90 backdrop-blur-md border-b border-white/[0.06]">
        {/* ロゴエリア: シンプルかつ堅牢に */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 bg-white/[0.05] rounded-md border border-white/10 text-slate-200">
            <Globe size={18} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 tracking-wide font-['Inter']">
              WORLD DASHBOARD
            </h1>
            <div className="text-[10px] text-slate-500 font-medium">
              Global Intelligence Nexus v6.3
            </div>
          </div>
        </div>

        {/* コントロール群: 派手な光彩を削除し、実用的なボタンスタイルへ */}
        <div className="flex items-center gap-3">
          {/* Layer Menu */}
          <div className="relative hidden md:block" ref={layerMenuRef}>
            <button
              ref={layerMenuButtonRef}
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              className={`btn-base ${isLayerMenuOpen ? 'bg-white/[0.08] text-slate-100' : ''}`}
            >
              <Layers size={14} />
              <span>Layers</span>
            </button>
            
            {isLayerMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 py-1 rounded-lg border border-white/[0.06] bg-[#0f172a] shadow-xl text-xs z-[120]">
                {[
                  { id: 'fsi', label: 'Geopolitical Risk' },
                  { id: 'us', label: 'US Influence' },
                  { id: 'china', label: 'China Influence' },
                  { id: 'resources', label: 'Natural Resources' }
                ].map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => { setActiveLayer(layer.id); setIsLayerMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-white/[0.04] transition-colors
                      ${activeLayer === layer.id ? 'text-white font-semibold bg-white/[0.04] border-l-2 border-slate-400' : 'text-slate-400 border-l-2 border-transparent'}`}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          {/* Macro Analytics Button */}
          <button
            onClick={() => setIsMacroOverlayOpen(true)}
            className="btn-base hover:bg-slate-700/50 hover:text-white hover:border-slate-500/30"
          >
            <TrendingUp size={14} />
            <span>MACRO</span>
          </button>

          {/* Analytics Panel Toggle */}
          <button
            onClick={() => setIsAnalyticsPanelOpen(!isAnalyticsPanelOpen)}
            className={`btn-base ${isAnalyticsPanelOpen ? 'bg-white/[0.08] text-slate-100' : ''}`}
          >
            <BarChart2 size={14} />
            <span>ANALYTICS</span>
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFs} className="btn-base w-9 px-0">
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </header>

      {/* ═══ メインコンテンツ ══════════════════════════════════ */}
      <main className="flex-1 relative">
        
        {/* Map Container */}
        <div className="absolute inset-0 z-10 bg-[#020617]">
          <WorldMap
            data={data}
            activeLayer={activeLayer}
            chinaInfluenceData={chinaInfluenceData}
            resourcesData={resourcesData}
            usInfluenceData={usInfluenceData}
            onCountryClick={handleCountryClick}
            onHover={handleHover}
            selectedIso={selectedIso}
            // Mapコンポーネント側でも色味の彩度を落とす調整が必要な場合があります
          />
        </div>

        {/* ツールチップ: シンプルなカード形式に変更 */}
        {hoverInfo && (
          <div
            className="fixed z-[120] px-4 py-3 bg-[#0f172a]/95 backdrop-blur-sm border border-white/10 text-slate-200 shadow-xl rounded-lg pointer-events-none"
            style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
          >
            <div className="text-xs font-bold text-slate-100 mb-1 flex items-center gap-2">
               {allCountries.find(c => c.master.iso3 === hoverInfo.iso3)?.master.name}
               <span className="font-normal text-slate-500 font-mono text-[10px]">{hoverInfo.iso3}</span>
            </div>
            {/* スコア表示など */}
            <div className="text-[10px] text-slate-400">
               Click to view details
            </div>
          </div>
        )}

        {/* 各パネルコンポーネント */}
        <AnalyticsPanel
          data={data}
          isOpen={isAnalyticsPanelOpen}
          onClose={() => setIsAnalyticsPanelOpen(false)}
          onSelectCountry={handleCountryClick}
          selectedIso={selectedIso}
        />

        {selectedReport && isReportOpen && (
          <aside className="absolute top-20 bottom-12 right-[24rem] md:right-[28rem] w-[26rem] z-[89]">
            <DeepReportPanel report={selectedReport} onClose={() => setIsReportOpen(false)} />
          </aside>
        )}

        <aside className={`absolute top-16 bottom-0 right-0 w-[24rem] md:w-[26rem] transform transition-transform duration-300 z-[90] ${selectedIso ? 'translate-x-0' : 'translate-x-full'}`}>
          <CountryDetails
            country={selectedCountry}
            onClose={() => setSelectedIso(null)}
            onShowReport={() => setIsReportOpen(!isReportOpen)}
            hasReport={!!selectedReport}
          />
        </aside>

        {/* フッター (Global Stream): シンプル化 */}
        <footer className={`absolute bottom-0 left-0 right-0 z-[100] transition-all duration-500 flex flex-col
          ${isStreamPanelOpen
            ? 'h-[40vh] bg-[#0f172a] border-t border-white/[0.06] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]'
            : 'h-10 bg-[#0f172a]/80 border-t border-white/[0.06]'}`}
        >
          <button
            onClick={() => setIsStreamPanelOpen(!isStreamPanelOpen)}
            className="h-10 w-full flex items-center justify-center gap-2 text-[10px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] transition-colors uppercase tracking-widest"
          >
            <Activity size={12} />
            {isStreamPanelOpen ? 'Collapse Stream' : 'Live Intelligence Stream'}
            <ChevronUp size={14} className={`transition-transform duration-300 ${isStreamPanelOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <div className="flex-1 overflow-hidden relative">
             <GlobalStreamPanel isExpanded={isStreamPanelOpen} />
          </div>
        </footer>

      </main>

      <MacroStatsOverlay isOpen={isMacroOverlayOpen} onClose={() => setIsMacroOverlayOpen(false)} />
    </div>
  );
}
