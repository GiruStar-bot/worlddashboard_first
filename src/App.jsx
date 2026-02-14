import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Globe, ChevronUp, Activity, Maximize, Minimize, BarChart2 } from 'lucide-react';

// コンポーネント
import WorldMap        from './components/WorldMap';
import CountryDetails  from './components/CountryDetails';
import DeepReportPanel from './components/DeepReportPanel';
import AnalyticsPanel  from './components/AnalyticsPanel';
import GlobalStreamPanel from './components/GlobalStreamPanel';

// 定数
import { REPORT_FILES } from './constants/isoMap';

/**
 * WorldDashboard v6.3 - Global Intelligence Nexus
 * App.jsx はレイアウト・状態管理・データ取得のみを担当します。
 * 各UIパネルは src/components/ 配下に分割されています。
 */
export default function App() {
  // ── State ───────────────────────────────────────────────
  const [data,                  setData]                  = useState(null);
  const [reports,               setReports]               = useState({});
  const [selectedIso,           setSelectedIso]           = useState(null);
  const [hoverInfo,             setHoverInfo]             = useState(null);
  const [isStreamPanelOpen,     setIsStreamPanelOpen]     = useState(false);
  const [isAnalyticsPanelOpen,  setIsAnalyticsPanelOpen]  = useState(false);
  const [isReportOpen,          setIsReportOpen]          = useState(false);
  const [isFullscreen,          setIsFullscreen]          = useState(false);
  const [activeLayer,           setActiveLayer]           = useState("fsi");
  const [chinaInfluenceData,    setChinaInfluenceData]    = useState(null);
  const [isLayerMenuOpen,       setIsLayerMenuOpen]       = useState(false);
  const layerMenuRef = useRef(null);
  const layerMenuButtonRef = useRef(null);
  const firstLayerItemRef = useRef(null);
  const wasLayerMenuOpenRef = useRef(false);

  // ── データ取得 ────────────────────────────────────────────
  useEffect(() => {
    const baseUrl = window.location.hostname.includes('github.io')
      ? "/worlddashboard_2/"
      : "/";

    // マスタデータ
    const loadMaster = fetch(`${baseUrl}worlddash_global_master.json`)
      .then(res => res.json())
      .catch(e => { console.error("Master data load failed", e); return null; });

    // 中国影響力インデックス
    const loadChinaInfluence = fetch(`${baseUrl}china_influence_index.json`)
      .then(res => res.json())
      .catch(e => { console.warn("China influence data load failed", e); return null; });

    // 分割レポートファイル（並列取得・エラー時は空配列）
    const loadReports = Promise.all(
      REPORT_FILES.map(filename =>
        fetch(`${baseUrl}${filename}`)
          .then(res => {
            if (!res.ok) throw new Error(`${filename} not found`);
            return res.json();
          })
          .catch(err => { console.warn(`Failed to load ${filename}`, err); return []; })
      )
    ).then(results => {
      const merged = {};
      results.flat().forEach(r => {
        if (r?.meta?.country_iso3) merged[r.meta.country_iso3] = r;
      });
      return merged;
    });

    Promise.all([loadMaster, loadReports, loadChinaInfluence]).then(([masterData, mergedReports, chinaData]) => {
      if (masterData) setData(masterData);
      setReports(mergedReports);
      if (chinaData) setChinaInfluenceData(chinaData);
    });
  }, []);

  // ── フルスクリーン ─────────────────────────────────────────
  const toggleFs = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  useEffect(() => {
    const cb = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', cb);
    return () => document.removeEventListener('fullscreenchange', cb);
  }, []);

  useEffect(() => {
    if (!isLayerMenuOpen) return;
    const handleOutside = (e) => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target)) setIsLayerMenuOpen(false);
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsLayerMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isLayerMenuOpen]);

  useEffect(() => {
    if (isLayerMenuOpen) firstLayerItemRef.current?.focus();
    else if (wasLayerMenuOpenRef.current) layerMenuButtonRef.current?.focus();
    wasLayerMenuOpenRef.current = isLayerMenuOpen;
  }, [isLayerMenuOpen]);

  // ── イベントハンドラ ──────────────────────────────────────
  const handleHover = useCallback((iso, pos) => {
    setHoverInfo(iso ? { iso3: iso, ...pos } : null);
  }, []);

  const handleCountryClick = useCallback((iso) => {
    setSelectedIso(prev => prev === iso ? null : iso);
    setIsReportOpen(false);
  }, []);

  // ── ローディング画面 ──────────────────────────────────────
  if (!data) return (
    <div className="h-screen flex flex-col items-center justify-center text-cyan-400 animate-pulse font-mono bg-slate-950 tracking-[1em]">
      <Globe size={60} className="mb-10 opacity-30 animate-spin-slow" />
      CONNECTING_NEXUS_v6.3
    </div>
  );

  const allCountries    = data?.regions ? Object.values(data.regions).flat() : [];
  const selectedCountry = allCountries.find(c => c.master.iso3 === selectedIso) || null;
  const selectedReport  = selectedIso ? reports[selectedIso] : null;

  // ── レンダリング ──────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 relative font-sans text-slate-200">
      {/* オーバーレイエフェクト */}
      <div className="absolute inset-0 pointer-events-none z-[999] opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      <div className="absolute inset-0 pointer-events-none z-[998] opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%)] bg-[length:100%_4px]" />

      {/* ═══ ヘッダー ══════════════════════════════════════════ */}
      <header className="absolute top-0 left-0 right-0 h-20 flex items-center px-8 justify-between z-[110] bg-slate-950/70 backdrop-blur-[40px] border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] font-mono">
        {/* ロゴ */}
        <div className="flex items-center gap-6">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Globe className="text-cyan-400 animate-pulse" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-[0.3em] text-white flex items-center gap-2 uppercase tracking-tighter">
              WORLD<span className="text-cyan-400 opacity-90">DASH</span>
            </h1>
            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-[0.5em] mt-0.5 opacity-70">
              Global_Intelligence_Nexus_v6.3
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block" ref={layerMenuRef}>
            <button
              ref={layerMenuButtonRef}
              onClick={() => setIsLayerMenuOpen(prev => !prev)}
              aria-expanded={isLayerMenuOpen}
              aria-haspopup="menu"
              className="px-4 py-1.5 rounded-full uppercase text-[10px] font-semibold tracking-[0.2em] border transition-all duration-300 active:scale-95 bg-white/[0.04] border-white/10 text-slate-400 hover:text-cyan-400 hover:bg-white/[0.08]"
            >
              Layers
            </button>
            {isLayerMenuOpen && (
              <div role="menu" aria-label="Layers" className="absolute top-full mt-2 min-w-[14rem] rounded-xl border border-white/15 bg-slate-950/95 backdrop-blur-[20px] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
                <button
                  ref={firstLayerItemRef}
                  role="menuitemradio"
                  aria-checked={activeLayer === "fsi"}
                  onClick={() => { setActiveLayer("fsi"); setIsLayerMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg uppercase text-[10px] font-semibold tracking-[0.2em] border transition-all duration-300 active:scale-95
                    ${activeLayer === "fsi"
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                      : "bg-white/[0.04] border-white/10 text-slate-400 hover:text-cyan-400 hover:bg-white/[0.08]"}`}
                >
                  Geopolitical Risk
                </button>
                <button
                  role="menuitemradio"
                  aria-checked={activeLayer === "china"}
                  onClick={() => { setActiveLayer("china"); setIsLayerMenuOpen(false); }}
                  className={`w-full text-left mt-2 px-3 py-2 rounded-lg uppercase text-[10px] font-semibold tracking-[0.2em] border transition-all duration-300 active:scale-95
                    ${activeLayer === "china"
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                      : "bg-white/[0.04] border-white/10 text-slate-400 hover:text-amber-400 hover:bg-white/[0.08]"}`}
                >
                  China Influence
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsAnalyticsPanelOpen(!isAnalyticsPanelOpen)}
            className={`transition-all flex items-center gap-2 border px-5 py-2 rounded-full text-[10px] font-semibold shadow-lg active:scale-95 duration-300 uppercase tracking-[0.2em]
              ${isAnalyticsPanelOpen
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-cyan-400 hover:bg-white/[0.08]'}`}
          >
            <BarChart2 size={14} />
            {isAnalyticsPanelOpen ? 'CLOSE_ANALYTICS' : 'OPEN_ANALYTICS'}
          </button>
          <button
            onClick={toggleFs}
            className="text-slate-400 hover:text-cyan-400 transition-all flex items-center gap-2 border border-white/10 px-5 py-2 rounded-full bg-white/[0.04] text-[10px] font-semibold shadow-lg active:scale-95 duration-300 uppercase tracking-[0.2em]"
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            {isFullscreen ? 'EXIT_LINK' : 'FULL_DEEP'}
          </button>
        </div>
      </header>

      {/* ═══ メインコンテンツ ══════════════════════════════════ */}
      <main className="flex-1 relative">

        {/* 世界地図 */}
        <div className="absolute inset-0 z-10">
          <WorldMap
            data={data}
            activeLayer={activeLayer}
            chinaInfluenceData={chinaInfluenceData}
            onCountryClick={handleCountryClick}
            onHover={handleHover}
            selectedIso={selectedIso}
          />
        </div>

        {/* ホバーツールチップ */}
        {hoverInfo && (
          <div
            className="fixed z-[120] px-5 py-3 bg-slate-900/90 backdrop-blur-[20px] border border-white/20 text-slate-100 font-mono pointer-events-none shadow-[0_0_20px_rgba(0,0,0,0.8)] rounded-xl animate-in fade-in zoom-in-95 duration-200"
            style={{ left: hoverInfo.x + 20, top: hoverInfo.y + 20 }}
          >
            <div className="font-semibold text-cyan-400 text-sm border-b border-white/10 mb-2 pb-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              {allCountries.find(c => c.master.iso3 === hoverInfo.iso3)?.master.name || hoverInfo.iso3}
            </div>
            <div className="opacity-60 text-[9px] tracking-[0.4em] flex justify-between gap-8 font-medium">
              <span>NODE</span>
              <span className="text-white">{hoverInfo.iso3}</span>
            </div>
          </div>
        )}

        {/* 左パネル: Analytics */}
        <AnalyticsPanel
          data={data}
          isOpen={isAnalyticsPanelOpen}
          onClose={() => setIsAnalyticsPanelOpen(false)}
          onSelectCountry={handleCountryClick}
          selectedIso={selectedIso}
        />

        {/* 中央パネル: Deep Dive Report */}
        {selectedReport && isReportOpen && (
          <aside className="absolute top-20 bottom-12 right-[24rem] md:right-[28rem] w-[26rem] md:w-[32rem] z-[89]">
            <DeepReportPanel
              report={selectedReport}
              onClose={() => setIsReportOpen(false)}
            />
          </aside>
        )}

        {/* 右パネル: 国別詳細 */}
        <aside className={`absolute top-20 bottom-12 right-0 w-[24rem] md:w-[28rem] transform transition-all duration-700 z-[90] ${selectedIso ? 'translate-x-0' : 'translate-x-full'}`}>
          <CountryDetails
            country={selectedCountry}
            onClose={() => setSelectedIso(null)}
            onShowReport={() => setIsReportOpen(!isReportOpen)}
            hasReport={!!selectedReport}
          />
        </aside>

        {/* ═══ フッター: グローバルストリーム ══════════════════════ */}
        <footer className={`absolute bottom-0 left-0 right-0 z-[100] transition-all duration-700 flex flex-col overflow-hidden shrink-0
          ${isStreamPanelOpen
            ? 'h-[calc(100vh-7rem)] rounded-t-[3rem] bg-slate-950/80 backdrop-blur-[40px] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.8)]'
            : 'h-12 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-[8px] border-t border-white/20 hover:bg-white/[0.08]'}`}
        >
          <button
            onClick={() => setIsStreamPanelOpen(!isStreamPanelOpen)}
            className={`h-12 w-full flex items-center justify-center gap-4 text-[10px] font-semibold tracking-[0.8em] transition-all shrink-0 pointer-events-auto uppercase font-mono
              ${isStreamPanelOpen
                ? 'text-cyan-400/60 hover:text-cyan-400 border-b border-white/5'
                : 'text-cyan-400/80 hover:text-cyan-300'}`}
          >
            <Activity size={14} className={isStreamPanelOpen ? 'animate-pulse text-cyan-400' : 'opacity-70'} />
            {isStreamPanelOpen ? 'CLOSE_GLOBAL_STREAM' : 'OPEN_GLOBAL_STREAM'}
            <ChevronUp size={18} className={`mb-0.5 transition-transform duration-500 ${isStreamPanelOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex-1 overflow-hidden p-6 md:p-12 overflow-y-auto custom-scrollbar">
            <GlobalStreamPanel isExpanded={isStreamPanelOpen} />
          </div>
        </footer>
      </main>

      {/* グローバルスタイル */}
      <style>{`
        .text-shadow-glow { text-shadow: 0 0 10px rgba(34, 211, 238, 0.5); }
        .text-shadow-sm   { text-shadow: 0 0 6px rgba(255, 255, 255, 0.2); }
        .custom-scrollbar::-webkit-scrollbar       { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.5); }
        .animate-spin-slow { animation: spin 20s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        body { background-color: #020617; }
        * { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
