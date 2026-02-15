import React, { useMemo, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { GEO_URL, ISO_MAP } from '../constants/isoMap';
import { mixColours, COLOUR_LOW, COLOUR_MID, COLOUR_HIGH } from '../utils/colorUtils';
import { getChinaColour, getNaturalResourceColour } from '../utils/layerColorUtils';
import { getUSColour } from '../utils/usLayerUtils';

const WorldMap = React.memo(({ data, activeLayer, chinaInfluenceData, resourcesData, usInfluenceData, onCountryClick, onHover, selectedIso }) => {
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

  const influenceByIso = useMemo(() => {
    return chinaInfluenceData?.countries || {};
  }, [chinaInfluenceData]);

  const resourcesByIso = useMemo(() => {
    return resourcesData?.countries || {};
  }, [resourcesData]);

  const usByIso = useMemo(() => {
    return usInfluenceData?.countries || {};
  }, [usInfluenceData]);

  const [minR, maxR] = useMemo(() => {
    const values = Object.values(riskByIso).filter((v) => v != null);
    if (!values.length) return [0, 120];
    return [Math.min(...values), Math.max(...values)];
  }, [riskByIso]);

  const getColour = useCallback((risk) => {
    if (risk == null) return '#1e293b';
    const t = (risk - minR) / (maxR - minR || 1);
    if (t < 0.5) return mixColours(COLOUR_LOW, COLOUR_MID, t / 0.5);
    return mixColours(COLOUR_MID, COLOUR_HIGH, (t - 0.5) / 0.5);
  }, [minR, maxR]);

  const geoStyle = useMemo(() => ({
    default: { outline: 'none', transition: 'fill 0.3s ease' },
    hover:   { fill: '#22d3ee', cursor: 'pointer', outline: 'none' },
    pressed: { fill: '#8b5cf6', outline: 'none' },
  }), []);

  return (
    <div className="w-full h-full bg-slate-950">
      <ComposableMap projectionConfig={{ scale: 220 }} className="w-full h-full outline-none">
        <ZoomableGroup center={[10, 15]} zoom={1.5} minZoom={1} maxZoom={8} translateExtent={[[-500, -200], [1300, 800]]}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isoAlpha3 = ISO_MAP[geo.id];
                const iso = isoAlpha3 || geo.id;
                const fill =
                  activeLayer === 'us'        ? getUSColour(usByIso[iso]?.score) :
                  activeLayer === 'resources' ? getNaturalResourceColour(resourcesByIso[iso]?.score) :
                  activeLayer === 'china'     ? getChinaColour(influenceByIso[iso]?.score) :
                  getColour(riskByIso[iso]);
                const isSelected = iso === selectedIso;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={0.5}
                    style={geoStyle}
                    onMouseEnter={(evt) => onHover(iso, { x: evt.clientX, y: evt.clientY })}
                    onMouseLeave={() => onHover(null)}
                    onClick={() => { if (isoAlpha3) onCountryClick(iso); }}
                    filter={isSelected ? 'url(#country-glow)' : undefined}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
        <defs>
          <filter id="country-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </ComposableMap>
      {/* LayerLegendMini – compass-area overlay */}
      <div className="absolute bottom-16 right-4 z-20 font-mono pointer-events-none select-none">
        <div className="bg-slate-900/80 backdrop-blur-[12px] border border-white/10 rounded-lg px-3 py-2 shadow-lg">
          <div className={`text-[9px] uppercase tracking-[0.2em] mb-1.5 font-semibold ${
            activeLayer === 'us' ? 'text-blue-400' :
            activeLayer === 'china' ? 'text-amber-400' :
            activeLayer === 'resources' ? 'text-emerald-400' :
            'text-cyan-400'
          }`}>
            {activeLayer === 'us' ? 'US Influence' :
             activeLayer === 'china' ? 'China Influence' :
             activeLayer === 'resources' ? 'Natural Resources' :
             'Geopolitical Risk'}
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-24 rounded-sm" style={{
              background: activeLayer === 'us'
                ? 'linear-gradient(to right, #0f172a, #2563eb, #dbeafe)'
                : activeLayer === 'china'
                ? 'linear-gradient(to right, #6b7280, #fbbf24, #dc2626)'
                : activeLayer === 'resources'
                ? 'linear-gradient(to right, #475569, #50C878, #D4AF37, #CD7F32)'
                : 'linear-gradient(to right, #06b6d4, #8b5cf6, #ef4444)'
            }} />
          </div>
          <div className="flex justify-between text-[8px] text-slate-500 mt-0.5 w-24">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
});

WorldMap.displayName = 'WorldMap';
export default WorldMap;
