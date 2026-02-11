import React, { useEffect, useState, useMemo } from 'react';
import WorldMap from './components/WorldMap.jsx';
import CountryDetails from './components/CountryDetails.jsx';
import GlobalAnalytics from './components/GlobalAnalytics.jsx';
import { Globe, AlertTriangle } from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [selectedIso, setSelectedIso] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    fetch('worlddash_global_master.json')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Failed to load data', err));
  }, []);

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

  // Handlers
  const handleCountryClick = (iso3) => {
    setSelectedIso((prev) => (prev === iso3 ? null : iso3));
  };

  const handleHover = (iso3, pos) => {
    if (iso3 && pos) {
      const country = countryByIso3[iso3];
      const name = country?.master?.name || iso3;
      const risk = country?.canonical?.risk?.fsi_total?.value;
      setHoverInfo({ x: pos.x, y: pos.y, name, risk });
    } else {
      setHoverInfo(null);
    }
  };

  if (!data) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-primary font-mono animate-pulse gap-4">
        <Globe size={48} className="animate-spin-slow" />
        <div className="text-xl tracking-widest">INITIALIZING WORLDDASH SYSTEM...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 relative font-sans">
      {/* CSS Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none scanline-effect z-50 opacity-10"></div>

      {/* Header */}
      <header className="h-14 border-b border-white/10 bg-slate-900/90 flex items-center px-6 justify-between shrink-0 z-40 backdrop-blur-sm shadow-lg">
        <div className="flex items-center gap-3">
          <Globe className="text-primary animate-pulse" size={20} />
          <h1 className="text-lg font-bold tracking-widest text-slate-100 font-mono">
            WORLD<span className="text-primary text-glow">DASH</span> <span className="text-[10px] text-slate-500 ml-1">v2.0</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            LIVE
          </div>
          <div className="hidden sm:block">COUNTRIES: {data.meta?.stats?.total_countries || 0}</div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <main className={`flex-1 relative transition-all duration-500 ease-out ${selectedCountry ? 'mr-96' : ''}`}>
          <div className="absolute inset-0">
            <WorldMap 
              data={data} 
              onCountryClick={handleCountryClick} 
              onHover={handleHover} 
              selectedIso={selectedIso} 
            />
          </div>
          
          {/* Bottom Analytics */}
          <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none p-4 flex flex-col justify-end z-20">
             <div className="pointer-events-auto w-full max-w-5xl mx-auto h-full">
               <GlobalAnalytics data={data} />
             </div>
          </div>

          {/* Hover Tooltip */}
          {hoverInfo && (
            <div className="fixed pointer-events-none z-50 px-3 py-2 bg-slate-900/95 border border-primary/30 text-slate-100 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-none" style={{ left: hoverInfo.x + 20, top: hoverInfo.y + 20 }}>
              <div className="text-primary font-bold mb-1">{hoverInfo.name}</div>
              {hoverInfo.risk && (
                <div className="flex items-center gap-1">
                  <AlertTriangle size={10} className={hoverInfo.risk > 80 ? "text-red-500" : "text-emerald-500"} />
                  FSI: {hoverInfo.risk}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className={`fixed top-14 bottom-0 right-0 w-96 bg-slate-900/95 border-l border-primary/20 transform transition-transform duration-500 z-30 ${selectedCountry ? 'translate-x-0' : 'translate-x-full'}`}>
          <CountryDetails country={selectedCountry} onClose={() => setSelectedIso(null)} />
        </aside>
      </div>
    </div>
  );
}
