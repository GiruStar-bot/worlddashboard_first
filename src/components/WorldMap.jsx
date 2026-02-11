import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

/*
 * WorldMap component renders an interactive map.
 * UPDATED: Switched to a TopoJSON source that uses ISO 3-letter codes (e.g., "JPN")
 * as IDs instead of numeric codes. This ensures correct mapping with our dataset.
 */

// This map source uses ISO Alpha-3 codes for IDs, matching our JSON keys.
const GEO_URL = 'https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json';

// Convert a hex colour to an RGB object.
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// Convert an RGB object back to a hex string.
function rgbToHex({ r, g, b }) {
  return (
    '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
  );
}

// Linearly interpolate between two colours.
function mixColours(a, b, t) {
  return rgbToHex({
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  });
}

// Risk colors: Low (Cyan) -> Mid (Purple) -> High (Red)
const COLOUR_LOW = hexToRgb('#06b6d4');
const COLOUR_MID = hexToRgb('#8b5cf6');
const COLOUR_HIGH = hexToRgb('#ef4444');

export default function WorldMap({ data, onCountryClick, onHover, selectedIso }) {
  // Build a lookup of FSI risk values keyed by ISO3 code.
  const riskByIso = useMemo(() => {
    const map = {};
    if (data && data.regions) {
      Object.values(data.regions).forEach((region) => {
        region.forEach((entry) => {
          const iso = entry.master.iso3;
          const risk = entry.canonical?.risk?.fsi_total?.value;
          map[iso] = risk;
        });
      });
    }
    return map;
  }, [data]);

  // Determine the range of risk values for color scaling.
  const [minRisk, maxRisk] = useMemo(() => {
    const values = Object.values(riskByIso).filter((v) => v != null);
    if (!values.length) return [0, 120];
    return [Math.min(...values), Math.max(...values)];
  }, [riskByIso]);

  const getColour = (risk) => {
    if (risk == null) return '#1e293b'; // Fallback for no data
    if (minRisk === maxRisk) return rgbToHex(COLOUR_LOW);
    
    // Calculate normalized position (0 to 1)
    const t = (risk - minRisk) / (maxRisk - minRisk);
    
    if (t < 0.5) {
      return mixColours(COLOUR_LOW, COLOUR_MID, t / 0.5);
    }
    return mixColours(COLOUR_MID, COLOUR_HIGH, (t - 0.5) / 0.5);
  };

  return (
    <div className="w-full h-full bg-slate-950">
      <ComposableMap projectionConfig={{ scale: 140 }} className="w-full h-full">
        <ZoomableGroup center={[0, 20]} zoom={1} maxZoom={8} minZoom={0.7}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // With this new map, geo.id is the ISO 3 code (e.g., "JPN")
                const iso = geo.id; 
                const risk = riskByIso[iso];
                const fill = getColour(risk);
                const isSelected = iso === selectedIso;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#334155"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none', transition: 'fill 0.3s' },
                      hover: { fill: '#f472b6', cursor: 'pointer', outline: 'none' },
                      pressed: { fill: '#ec4899', outline: 'none' },
                    }}
                    onMouseEnter={(evt) => {
                      const { clientX: x, clientY: y } = evt;
                      onHover(iso, { x, y });
                    }}
                    onMouseLeave={() => onHover(null)}
                    onClick={() => onCountryClick(iso)}
                    // Apply CSS filter for selected state glow
                    filter={isSelected ? 'url(#country-glow)' : undefined}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
        {/* SVG Filter for Glow Effect */}
        <defs>
          <filter id="country-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </ComposableMap>
    </div>
  );
}
