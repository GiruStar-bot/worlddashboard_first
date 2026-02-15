import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { GEO_URL, ISO_MAP } from '../constants/isoMap';
import { COUNTRY_COORDINATES, DEFAULT_POSITION } from '../constants/countryCoordinates';
import { mixColours, COLOUR_LOW, COLOUR_MID, COLOUR_HIGH } from '../utils/colorUtils';
import { getChinaColour, getNaturalResourceColour } from '../utils/layerColorUtils';
import { getUSColour } from '../utils/usLayerUtils';

// Center mobile default view around the Europe/Africa midpoint (longitude, latitude)
const MOBILE_DEFAULT_POSITION = {
  coordinates: [10, 35],
  zoom: 2.2,
};
const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

const getDefaultPositionForViewport = (isMobileViewport) => (
  isMobileViewport ? MOBILE_DEFAULT_POSITION : DEFAULT_POSITION
);

const getInitialPosition = () => {
  if (typeof window === 'undefined') return DEFAULT_POSITION;
  return getDefaultPositionForViewport(window.matchMedia(MOBILE_MEDIA_QUERY).matches);
};

const WorldMap = React.memo(({ data, activeLayer, chinaInfluenceData, resourcesData, usInfluenceData, onCountryClick, onHover, selectedIso }) => {
  
  // ── マップ位置のState管理 (Smooth Zoom用) ─────────────────────
  const [position, setPosition] = useState(getInitialPosition);
  const animationRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return () => {};
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleViewportChange = (event) => {
      if (!selectedIso) {
        setPosition(getDefaultPositionForViewport(event.matches));
      }
    };
    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, [selectedIso]);

  // イージング関数 (Cubic Ease Out): 自然な減速感
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

  // 目標地点へアニメーション移動する関数
  const animateTo = useCallback((targetCoordinates, targetZoom) => {
    const startCoordinates = position.coordinates;
    const startZoom = position.zoom;
    const startTime = performance.now();
    const duration = 1500; // 1.5秒かけて移動（Google Earth風のゆったり感）

    // 既存のアニメーションがあればキャンセル
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeOutCubic(progress);

      // 座標とズームの補間計算
      const nextCoordinates = [
        startCoordinates[0] + (targetCoordinates[0] - startCoordinates[0]) * ease,
        startCoordinates[1] + (targetCoordinates[1] - startCoordinates[1]) * ease,
      ];
      const nextZoom = startZoom + (targetZoom - startZoom) * ease;

      setPosition({ coordinates: nextCoordinates, zoom: nextZoom });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [position]);

  // selectedIso が変更されたら、アニメーションを開始
  useEffect(() => {
    if (selectedIso && COUNTRY_COORDINATES[selectedIso]) {
      const target = COUNTRY_COORDINATES[selectedIso];
      // 瞬間移動(setPosition)ではなく、アニメーション関数を呼ぶ
      animateTo(target.coordinates, target.zoom);
    }
  }, [selectedIso, animateTo]);

  // 手動操作時の座標更新
  const handleMoveEnd = (newPosition) => {
    // ユーザーが手動操作したらアニメーションを強制停止（操作の競合を防ぐ）
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setPosition(newPosition);
  };

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

  const [minR, maxR] = useMemo(() => {
    const values = Object.values(riskByIso).filter((v) => v != null);
    if (!values.length) return [0, 120];
    return [Math.min(...values), Math.max(...values)];
  }, [riskByIso]);

  // ── 色計算ロジック ───────────────────────────────────────────
  const getColour = useCallback((risk) => {
    if (risk == null) return '#1e293b'; 
    const t = (risk - minR) / (maxR - minR || 1);
    if (t < 0.5) return mixColours(COLOUR_LOW, COLOUR_MID, t / 0.5);
    return mixColours(COLOUR_MID, COLOUR_HIGH, (t - 0.5) / 0.5);
  }, [minR, maxR]);

  const geoStyle = useMemo(() => ({
    default: { outline: 'none', transition: 'all 0.2s ease' },
    hover: { 
      stroke: '#ffffff',        
      strokeWidth: 2,           
      cursor: 'pointer', 
      outline: 'none',
      filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.7))',
      transition: 'all 0.1s ease'
    },
    pressed: { fill: '#e2e8f0', outline: 'none' },
  }), []);

  // ── Legend (凡例) システム定義 ───────────────────────────────
  const legendConfig = useMemo(() => {
    switch (activeLayer) {
      case 'us':
        return {
          title: 'US Influence Sphere',
          subTitle: 'Diplomatic & Military Alignment (0-100)',
          gradient: 'linear-gradient(to right, #0f172a, #1e40af, #3b82f6, #93c5fd)', 
          labels: ['0', '25', '50', '75', '100'],
          colorClass: 'text-blue-400'
        };
      case 'china':
        return {
          title: 'China Influence Sphere',
          subTitle: 'Economic & Political Alignment (0-100)',
          gradient: 'linear-gradient(to right, #6b7280, #fbbf24, #ef4444, #991b1b)',
          labels: ['0', '25', '50', '75', '100'],
          colorClass: 'text-amber-400'
        };
      case 'resources':
        return {
          title: 'Resource Strategy Index',
          subTitle: 'Critical Minerals & Energy (0-100)',
          gradient: 'linear-gradient(to right, #475569, #50C878, #D4AF37, #CD7F32)',
          labels: ['0', '25', '50', '75', '100'],
          colorClass: 'text-emerald-400'
        };
      default:
        return {
          title: 'Fragile States Index (FSI)',
          subTitle: 'Stability Score (0-120)',
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
        <ZoomableGroup 
          center={position.coordinates} 
          zoom={position.zoom} 
          minZoom={1} 
          maxZoom={8} 
          translateExtent={[[-500, -200], [1300, 800]]}
          onMoveEnd={handleMoveEnd}
          // アニメーション中のカクつきを防ぐため、移動中はtransitionを無効化するスタイル調整も可能だが、
          // Reactのレンダリングサイクルでの更新となるため、ここでは標準設定で実装
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isoAlpha3 = ISO_MAP[geo.id];
                const iso = isoAlpha3 || geo.id;
                
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

      {/* Legend System */}
      <div className="absolute bottom-4 right-8 z-20 font-sans select-none animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-[#0f172a]/90 backdrop-blur-md border border-white/[0.08] rounded-lg p-3 shadow-2xl min-w-[200px]">
          <div className="mb-2">
            <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${legendConfig.colorClass}`}>
              {legendConfig.title}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {legendConfig.subTitle}
            </div>
          </div>
          
          <div className="h-2 w-full rounded-sm mb-1.5 relative border border-white/10 overflow-hidden" 
               style={{ background: legendConfig.gradient }}>
            <div className="absolute inset-0 flex justify-between px-[1px]">
              {[0, 1, 2, 3, 4].map(i => (
                 <div key={i} className="w-[1px] h-full bg-white/30 backdrop-invert" />
              ))}
            </div>
          </div>

          <div className="flex justify-between text-[9px] text-slate-500 mb-1">
            <span>Low</span>
            <span>High</span>
          </div>

          <div className="flex justify-between text-[9px] text-slate-400 font-mono font-medium">
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
