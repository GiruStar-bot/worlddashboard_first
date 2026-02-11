import React, { useEffect, useState, useMemo } from 'react';
import WorldMap from './components/WorldMap.jsx';
import CountryDetails from './components/CountryDetails.jsx';
import GlobalAnalytics from './components/GlobalAnalytics.jsx';

/*
 * Root component orchestrating the overall layout of the dashboard.
 */
export default function App() {
  const [data, setData] = useState(null);
  const [selectedIso, setSelectedIso] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null); // { iso3, x, y }

  // Load the dataset from the public folder.
  // We use import.meta.env.BASE_URL to ensure the path is correct
  // whether running locally ("/") or on GitHub Pages ("/worlddashboard_2/").
  useEffect(() => {
    // ★修正: リポジトリ名を含めた正しいパスでデータを取得
    fetch(`${import.meta.env.BASE_URL}worlddash_global_master.json`)
      .then((res) => {
        if (!res.ok) throw new Error("JSON not found");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => console.error('Failed to load data', err));
  }, []);

  // Flatten the nested regions structure into a list keyed by ISO3 code.
  const countryByIso3 = useMemo(() => {
    const map = {};
    if (!data) return map;
    Object.values(data.regions).forEach((region) => {
      region.forEach((entry) => {
        map[entry.master.iso3] = entry;
      });
    });
    return map;
  }, [data]);

  const selectedCountry = selectedIso ? countryByIso3[selectedIso] : null;

  const handleCountryClick = (iso3) => {
    setSelectedIso((prev) => (prev === iso3 ? null : iso3));
  };

  const handleHover = (iso3, position) => {
    if (!iso3) {
      setHoverInfo(null);
    } else {
      setHoverInfo({ iso3, x: position.x, y: position.y });
    }
  };

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center text-xl text-secondary animate-pulse">
        Loading System Data...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Map occupies the majority of horizontal space */}
        <div className="flex-1 relative overflow-hidden">
          <WorldMap
            data={data}
            onCountryClick={handleCountryClick}
            onHover={handleHover}
            selectedIso={selectedIso}
          />
          {/* Tooltip follows the cursor when hovering over a country */}
          {hoverInfo && (
            <div
              className="absolute pointer-events-none z-50 px-3 py-2 text-xs rounded bg-slate-800/80 backdrop-blur border border-white/10"
              style={{ left: hoverInfo.x + 10, top: hoverInfo.y + 10 }}
            >
              <div className="font-bold text-primary">
                {countryByIso3[hoverInfo.iso3]?.master?.name || hoverInfo.iso3}
              </div>
              {(() => {
                const country = countryByIso3[hoverInfo.iso3];
                if (!country) return null;
                const risk = country.canonical?.risk?.fsi_total?.value;
                return risk != null ? (
                  <div className="text-xs text-secondary">
                    FSI Risk: {risk.toFixed(1)}
                  </div>
                ) : (
                  <div className="text-xs text-secondary">Risk: N/A</div>
                );
              })()}
            </div>
          )}
        </div>
        {/* Sidebar with country details */}
        <div className="w-80 border-l border-slate-700 p-4 overflow-y-auto hidden lg:block bg-slate-900/90">
          <CountryDetails country={selectedCountry} />
        </div>
      </div>
      {/* Bottom analytics panel */}
      <div className="border-t border-slate-700 p-4 overflow-y-auto bg-slate-900/80">
        <GlobalAnalytics data={data} />
      </div>
    </div>
  );
}
