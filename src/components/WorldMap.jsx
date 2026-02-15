import React, { useMemo, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { GEO_URL, ISO_MAP } from '../constants/isoMap';
import { mixColours, COLOUR_LOW, COLOUR_MID, COLOUR_HIGH } from '../utils/colorUtils';
import { getChinaColour, getNaturalResourceColour } from '../utils/layerColorUtils';
import { getUSColour } from '../utils/usLayerUtils';

const WorldMap = React.memo(({ data, activeLayer, chinaInfluenceData, resourcesData, usInfluenceData, onCountryClick, onHover, selectedIso }) => {
  // ── データ処理 ───────────────────────────────────────────────
  const riskByIso = useMemo(() => {
    const map = {};
    if (data && data.regions) {
      Object.values(data.regions).forEach((region) => {
        region.forEach((entry) => {
          map[entry.master.iso3] = entry.canonical?.risk?.fsi_total?.value;
        });
      });
    }
    return map;
  }, [data]);

  const influenceByIso = useMemo(() => chinaInfluenceData?.countries || {}, [chinaInfluenceData]);
  const resourcesByIso = useMemo(() => resourcesData?.countries || {}, [resourcesData]);
  const usByIso = useMemo(() => usInfluenceData?.countries || {}, [usInfluenceData]);

  // FSI (Fragile States Index) の最小・最大値計算
  const [minR, maxR] = useMemo(() => {
    const values = Object.values(riskByIso).filter((v) => v != null);
    if (!values.length) return [0, 120];
    return [Math.min(...values), Math.max(...values)];
  }, [riskByIso]);

  // ── 色計算ロジック ───────────────────────────────────────────
  const getColour = useCallback((risk) => {
    if (risk == null) return '#1e293b'; // slate-800
    // FSIは通常 0-120 の範囲。データの実測値に合わせて正規化
    const t = (risk - minR) / (maxR - minR || 1);
    if (t < 0.5) return mixColours(COLOUR_LOW, COLOUR_MID, t / 0.5);
    return mixColours(COLOUR_MID, COLOUR_HIGH, (t - 0.5) / 0.5);
  }, [minR, maxR]);

  const geoStyle = useMemo(() => ({
    default: { outline: 'none', transition: 'all 0.2s ease' },
    hover:   { fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1.5, cursor: 'pointer', outline: 'none' },
    pressed: { fill: '#e2e8f0', outline: 'none' },
  }), []);

  // ── Legend (凡例) システム定義 ───────────────────────────────
  // 各レイヤーごとの「タイトル」「グラデーション定義」「数値メモリ」「アクセントカラー」を定義
  const legendConfig = useMemo(() => {
    switch (activeLayer) {
      case 'us':
        return {
          title: 'US Influence Sphere',
          subTitle: 'Diplomatic & Military Alignment (0-100)',
          // Dark Navy -> Blue -> Light Blue
          gradient: 'linear-gradient(to right, #0f172a, #1e40af, #3b82f6, #93c5fd)', 
          labels: ['0', '25', '50', '75', '100'],
          colorClass: 'text-blue-400'
        };
      case 'china':
        return {
          title: 'China Influence Sphere',
          subTitle: 'Economic & Political Alignment (0-100)',
          // Grey -> Yellow -> Red
          gradient: 'linear-gradient(to right, #6b7280, #fbbf24, #ef4444, #991b1b)',
          labels: ['0', '25', '50', '75', '100'],
          colorClass: 'text-amber-400'
        };
      case 'resources':
        return {
          title: 'Resource Strategy Index',
          subTitle: 'Critical Minerals & Energy (0-100)',
          // Slate -> Green -> Gold -> Bronze
          gradient: 'linear-gradient(to right, #475569, #50C878, #D4AF37, #CD7F32)',
          labels: ['0', '25', '50', '75', '100'],
          colorClass: 'text-emerald-400'
        };
      default: // fsi (Geopolitical Risk)
        return {
          title: 'Fragile States Index (FSI)',
          subTitle: 'Stability Score (0-120)',
          // Cyan (Low Risk) -> Purple -> Red (High Risk)
          gradient: 'linear-gradient(to right, #06b6d4, #8b5cf6, #ef4444)',
          labels: ['0', '30', '60', '90', '120'],
          colorClass: 'text-rose-400'
        };
    }
  }, [activeLayer]);

  // ── レンダリング ────────────────────────────────────────────
  return (
    <div className="w-full h-full bg-[#020617] relative">
      <ComposableMap projectionConfig={{ scale: 220 }} className="w-full h-full outline-none">
        <ZoomableGroup center={[10, 15]} zoom={1.5} minZoom={1} maxZoom={8} translateExtent={[[-500, -200], [1300, 800]]}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isoAlpha3 = ISO_MAP[geo.id];
                const iso = isoAlpha3 || geo.id;
                
                // アクティブレイヤーに応じた色決定
                let baseFill;
                if (activeLayer === 'us')        baseFill = getUSColour(usByIso[iso]?.score);
                else if (activeLayer === 'china') baseFill = getChinaColour(influenceByIso[iso]?.score);
                else if (activeLayer === 'resources') baseFill = getNaturalResourceColour(resourcesByIso[iso]?.score);
                else baseFill = getColour(riskByIso[iso]);

                const isSelected = iso === selectedIso;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={baseFill}
                    // 選択時は白枠、通常時は薄い透過線
                    stroke={isSelected ? "#fff" : "rgba(255,255,255,0.08)"}
                    strokeWidth={isSelected ? 1.5 : 0.5}
                    style={geoStyle}
                    onMouseEnter={(evt) => onHover(iso, { x: evt.clientX, y: evt.clientY })}
                    onMouseLeave={() => onHover(null)}
                    onClick={() => { if (isoAlpha3) onCountryClick(iso); }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend System (右下配置のメモリ) 
        - マットな背景と明確な数値基準を表示
      */}
      <div className="absolute bottom-8 right-8 z-20 font-sans select-none animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-[#0f172a]/90 backdrop-blur-md border border-white/[0.08] rounded-lg p-5 shadow-2xl min-w-[240px]">
          {/* ヘッダー情報 */}
          <div className="mb-3">
            <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${legendConfig.colorClass}`}>
              {legendConfig.title}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {legendConfig.subTitle}
            </div>
          </div>
          
          {/* グラデーションバーとメモリ線 */}
          <div className="h-2.5 w-full rounded-sm mb-2 relative border border-white/10 overflow-hidden" 
               style={{ background: legendConfig.gradient }}>
            {/* グリッドライン（5分割） */}
            <div className="absolute inset-0 flex justify-between px-[1px]">
              {[0, 1, 2, 3, 4].map(i => (
                 <div key={i} className="w-[1px] h-full bg-white/30 backdrop-invert" />
              ))}
            </div>
          </div>

          {/* 濃淡の意味 */}
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Low</span>
            <span>High</span>
          </div>

          {/* 数値ラベル */}
          <div className="flex justify-between text-[10px] text-slate-400 font-mono font-medium">
            {legendConfig.labels.map((label, i) => (
              <span key={i} className={i === 0 ? "text-left" : i === 4 ? "text-right" : "text-center"} style={{ width: '20px' }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

WorldMap.displayName = 'WorldMap';
export default WorldMap;
