import React, { useEffect, useState, useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, CartesianGrid,
  XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer
} from 'recharts';
import { 
  Globe, ChevronUp, ChevronDown, Activity, Maximize, Minimize, 
  X, Users, AlertTriangle, Newspaper, ExternalLink, RefreshCw, AlertCircle 
} from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

// --- 設定・データソース ---
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
const PIE_COLOURS = ['#06b6d4', '#8b5cf6', '#ef4444', '#facc15', '#22c55e', '#e879f9'];
const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";
// GoogleアラートのRSS URLをここに設定してください（現在はBBC World Newsを設定）
const DEFAULT_FEED = "https://www.google.com/alerts/feeds/08185291032701299485/6950656386178969119";

// 地図ID（Numeric）を国コード（ISO3）に紐付けるマッピング
const ISO_MAP = {
  "004": "AFG", "008": "ALB", "012": "DZA", "024": "AGO", "031": "AZE", "032": "ARG", "036": "AUS", "040": "AUT", "050": "BGD", "051": "ARM", "056": "BEL", "068": "BOL", "070": "BIH", "072": "BWA", "076": "BRA", "096": "BRN", "100": "BGR", "104": "MMR", "108": "BDI", "112": "BLR", "116": "KHM", "120": "CMR", "124": "CAN", "140": "CAF", "148": "TCD", "152": "CHL", "156": "CHN", "170": "COL", "178": "COG", "180": "COD", "188": "CRI", "191": "HRV", "192": "CUB", "196": "CYP", "203": "CZE", "208": "DNK", "214": "DOM", "218": "ECU", "222": "SLV", "226": "GNQ", "231": "ETH", "232": "ERI", "233": "EST", "242": "FJI", "246": "FIN", "250": "FRA", "266": "GAB", "268": "GEO", "270": "GMB", "276": "DEU", "288": "GHA", "300": "GRC", "320": "GTM", "324": "GIN", "328": "GUY", "332": "HTI", "340": "HND", "348": "HUN", "352": "ISL", "356": "IND", "360": "IDN", "364": "IRN", "368": "IRQ", "372": "IRL", "376": "ISR", "380": "ITA", "384": "CIV", "388": "JAM", "392": "JPN", "398": "KAZ", "400": "JOR", "404": "KEN", "408": "PRK", "410": "KOR", "414": "KWT", "417": "KGZ", "418": "LAO", "422": "LBN", "426": "LSO", "428": "LVA", "430": "LBR", "434": "LBY", "440": "LTU", "442": "LUX", "450": "MDG", "454": "MWI", "458": "MYS", "462": "MDV", "466": "MLI", "470": "MLT", "478": "MRT", "480": "MUS", "484": "MEX", "496": "MNG", "498": "MDA", "499": "MNE", "504": "MAR", "508": "MOZ", "512": "OMN", "516": "NAM", "524": "NPL", "528": "NLD", "554": "NZL", "558": "NIC", "562": "NER", "566": "NGA", "578": "NOR", "586": "PAK", "591": "PAN", "598": "PNG", "600": "PRY", "604": "PER", "608": "PHL", "616": "POL", "620": "PRT", "634": "QAT", "642": "ROU", "643": "RUS", "646": "RWA", "682": "SAU", "686": "SEN", "688": "SRB", "694": "SLE", "702": "SGP", "703": "SVK", "704": "VNM", "705": "SVN", "710": "ZAF", "716": "ZWE", "724": "ESP", "728": "SSD", "729": "SDN", "740": "SUR", "748": "SWZ", "752": "SWE", "756": "CHE", "760": "SYR", "762": "TJK", "764": "THA", "768": "TGO", "772": "TKL", "776": "TON", "780": "TTO", "784": "ARE", "788": "TUN", "792": "TUR", "795": "TKM", "800": "UGA", "804": "UKR", "807": "MKD", "818": "EGY", "826": "GBR", "834": "TZA", "840": "USA", "858": "URY", "860": "UZB", "862": "VEN", "882": "WSM", "887": "YEM", "894": "ZMB"
};

// --- ヘルパー関数: カラーミックス ---
const getRiskColor = (risk, min, max) => {
  if (risk == null) return '#1e293b';
  const t = (risk - min) / (max - min || 1);
  const colA = { r: 6, g: 182, b: 212 }; // Cyan
  const colB = { r: 139, g: 92, b: 246 }; // Purple
  const colC = { r: 239, g: 68, b: 68 }; // Red
  const mix = (a, b, weight) => ({
    r: Math.round(a.r + (b.r - a.r) * weight),
    g: Math.round(a.g + (b.g - a.g) * weight),
    b: Math.round(a.b + (b.b - a.b) * weight)
  });
  const res = t < 0.5 ? mix(colA, colB, t / 0.5) : mix(colB, colC, (t - 0.5) / 0.5);
  return `rgb(${res.r}, ${res.g}, ${res.b})`;
};

// --- コンポーネント: 世界地図 ---
const WorldMap = ({ data, onCountryClick, onHover, selectedIso }) => {
  const riskByIso = useMemo(() => {
    const map = {};
    if (data?.regions) {
      Object.values(data.regions).forEach(reg => reg.forEach(c => map[c.master.iso3] = c.canonical?.risk?.fsi_total?.value));
    }
    return map;
  }, [data]);

  const [minR, maxR] = useMemo(() => {
    const vals = Object.values(riskByIso).filter(v => v != null);
    return vals.length ? [Math.min(...vals), Math.max(...vals)] : [0, 120];
  }, [riskByIso]);

  return (
    <div className="w-full h-full bg-slate-950">
      <ComposableMap projectionConfig={{ scale: 220 }} className="w-full h-full">
        <ZoomableGroup 
          center={[0, 0]} 
          zoom={1} 
          minZoom={1} 
          maxZoom={8} 
          // 移動制限を大幅に緩和：アラスカやロシア東端まで移動可能
          translateExtent={[[-500, -300], [1300, 900]]}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) => geographies.map(geo => {
              const iso = ISO_MAP[geo.id] || geo.id;
              const risk = riskByIso[iso];
              const isSelected = iso === selectedIso;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getRiskColor(risk, minR, maxR)}
                  stroke="#334155"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none', transition: 'fill 0.3s ease' },
                    hover: { fill: '#f472b6', cursor: 'pointer', outline: 'none' },
                    pressed: { fill: '#ec4899', outline: 'none' },
                  }}
                  onMouseEnter={(e) => onHover(iso, { x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onCountryClick(iso)}
                  filter={isSelected ? 'url(#glow-filter)' : undefined}
                />
              );
            })}
          </Geographies>
        </ZoomableGroup>
        <defs>
          <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </ComposableMap>
    </div>
  );
};

// --- コンポーネント: 分析・ライブフィード ---
const GlobalAnalytics = ({ data, isExpanded }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setLoading(true);
      fetch(`${RSS_API}${encodeURIComponent(DEFAULT_FEED)}`)
        .then(res => res.json())
        .then(json => {
          if (json.status === "ok") setNews(json.items.slice(0, 10));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isExpanded]);

  const countries = useMemo(() => {
    const arr = [];
    if (data?.regions) Object.values(data.regions).forEach(reg => reg.forEach(c => arr.push(c)));
    return arr;
  }, [data]);

  const { pieData, scatterData } = useMemo(() => {
    const sorted = [...countries].sort((a, b) => (b.canonical?.economy?.gdp_nominal?.value || 0) - (a.canonical?.economy?.gdp_nominal?.value || 0));
    const top = sorted.slice(0, 5).map(c => ({ name: c.master.name, value: c.canonical?.economy?.gdp_nominal?.value || 0 }));
    const scatter = countries.map(c => ({
      name: c.master.name,
      x: (c.canonical?.economy?.gdp_nominal?.value || 0) / (c.canonical?.society?.population?.value || 1),
      y: 100 - (c.canonical?.risk?.fsi_total?.value || 50)
    })).filter(d => d.x < 150000 && d.x > 0);
    return { pieData: top, scatterData: scatter };
  }, [countries]);

  return (
    <div className={`grid gap-6 h-full transition-all ${isExpanded ? 'lg:grid-cols-12' : 'lg:grid-cols-2'}`}>
      <div className={`${isExpanded ? 'lg:col-span-8' : ''} grid md:grid-cols-2 gap-4 h-full`}>
        <div className="bg-slate-900/60 backdrop-blur-md p-4 border border-primary/20 flex flex-col rounded-lg">
          <h4 className="text-[10px] text-primary font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={12}/> ECONOMIC DISTRIBUTION</h4>
          <div className="flex-1">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius="50%" outerRadius="80%" stroke="none" paddingAngle={5}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />)}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 10, color: '#e2e8f0' }} />
                <ChartTooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#fff', fontSize: 11 }} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md p-4 border border-primary/20 flex flex-col rounded-lg">
          <h4 className="text-[10px] text-primary font-bold uppercase tracking-widest mb-4">WEALTH VS STABILITY</h4>
          <div className="flex-1">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 10 }}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" dataKey="x" name="GDP/Cap" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{fill:'#64748b', fontSize:10}} />
                <YAxis type="number" dataKey="y" name="Stability" tick={{fill:'#64748b', fontSize:10}} />
                <ChartTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#fff', fontSize: 11 }} itemStyle={{ color: '#fff' }} />
                <Scatter data={scatterData} fill="#8b5cf6" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="lg:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-primary/30 flex flex-col overflow-hidden rounded-lg animate-in fade-in slide-in-from-right duration-500">
          <div className="p-4 border-b border-primary/20 flex justify-between items-center bg-primary/10">
            <h4 className="text-[10px] text-primary font-bold tracking-[0.2em] flex items-center gap-2"><Newspaper size={14} /> LIVE INTELLIGENCE FEED</h4>
            {loading && <RefreshCw size={14} className="animate-spin text-primary" />}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {news.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noreferrer" className="block p-3 bg-slate-900/60 border border-white/5 hover:border-primary/40 rounded transition-all group">
                <div className="text-[9px] text-slate-500 mb-1 flex justify-between"><span>{new Date(item.pubDate).toLocaleDateString()}</span><ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                <h5 className="text-xs font-bold text-slate-200 group-hover:text-primary leading-tight">{item.title}</h5>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- コンポーネント: 国詳細パネル ---
const CountryDetails = ({ country, onClose }) => {
  const [headline, setHeadline] = useState('');
  useEffect(() => {
    if (!country) return;
    const text = country.ui_view?.headline || '';
    let i = 0; setHeadline('');
    const timer = setInterval(() => { setHeadline(text.slice(0, ++i)); if (i >= text.length) clearInterval(timer); }, 15);
    return () => clearInterval(timer);
  }, [country]);
  if (!country) return null;
  const radarData = [
    { subject: 'ECON', score: country.ui_view?.scores?.economy_score || 0 },
    { subject: 'STAB', score: country.ui_view?.scores?.stability_score || 0 },
    { subject: 'RESI', score: 100 - (country.canonical?.risk?.fsi_total?.value || 50) }
  ];
  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-2xl border-l border-primary/30 shadow-2xl">
      <div className="p-5 border-b border-white/10 flex justify-between items-start">
        <div><div className="text-[10px] text-primary animate-pulse tracking-widest mb-1 font-mono uppercase">Target Acquired</div><h2 className="text-2xl font-bold text-white tracking-tight">{country.master.name}</h2><div className="text-xs font-mono text-slate-500 mt-1 uppercase">{country.master.iso3} | {country.canonical?.politics?.regime_type || 'N/A'}</div></div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-all p-1 bg-white/5 rounded-full"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
        <div className="p-4 rounded bg-primary/5 border-l-2 border-primary font-mono text-xs text-slate-300 leading-relaxed min-h-[5.5rem] shadow-inner">{headline}<span className="animate-pulse text-primary font-bold">|</span></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-800/60 border border-white/5 rounded-md"><div className="text-[9px] text-slate-500 mb-1 flex items-center gap-1"><Users size={10}/>POPULATION</div><div className="font-mono text-emerald-400 text-lg">{country.canonical?.society?.population?.value?.toLocaleString() || '0'}</div></div>
          <div className="p-3 bg-slate-800/60 border border-white/5 rounded-md"><div className="text-[9px] text-slate-500 mb-1 flex items-center gap-1"><Activity size={10}/>GDP (NOM)</div><div className="font-mono text-blue-400 text-lg">${((country.canonical?.economy?.gdp_nominal?.value || 0) / 1e9).toFixed(1)}B</div></div>
        </div>
        <div className="h-52 border border-white/10 rounded-lg bg-slate-950/40 p-3 shadow-xl"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}><PolarGrid stroke="#334155" /><PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 9 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} /><Radar dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.45} /></RadarChart></ResponsiveContainer></div>
        <div className="flex flex-wrap gap-2 pt-2">{country.ui_view?.tags?.map(t => <span key={t} className="px-2 py-0.5 rounded border border-white/10 text-[9px] text-slate-400 uppercase font-mono bg-white/5">{t}</span>)}</div>
      </div>
    </div>
  );
};

// --- メインアプリコンポーネント ---
export default function App() {
  const [data, setData] = useState(null);
  const [selectedIso, setSelectedIso] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // 修正: 確実に正しいパスでデータを取得
    const baseUrl = "/worlddashboard_2/";
    fetch(`${baseUrl}worlddash_global_master.json`)
      .then(res => res.json())
      .then(setData)
      .catch(e => console.error("Initialize failed", e));
  }, []);

  const toggleFs = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  useEffect(() => {
    const cb = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', cb);
    return () => document.removeEventListener('fullscreenchange', cb);
  }, []);

  const countryByIso = useMemo(() => {
    const map = {};
    if (data?.regions) Object.values(data.regions).forEach(reg => reg.forEach(c => map[c.master.iso3] = c));
    return map;
  }, [data]);

  if (!data) return <div className="h-screen flex items-center justify-center text-primary animate-pulse font-mono bg-slate-950 tracking-[0.4em]">LOADING WORLD_DASH v2.3...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 relative font-sans text-slate-200">
      <div className="absolute inset-0 pointer-events-none z-[999] opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
      
      <header className="absolute top-0 left-0 right-0 h-14 flex items-center px-6 justify-between z-[80] bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none uppercase">
        <div className="flex items-center gap-3 pointer-events-auto"><Globe className="text-primary animate-pulse" size={20} /><h1 className="text-lg font-bold tracking-widest font-mono text-glow">WorldDash <span className="text-[10px] text-slate-500 font-normal">System_Active</span></h1></div>
        <button onClick={toggleFs} className="pointer-events-auto text-slate-400 hover:text-primary transition-all flex items-center gap-2 border border-white/10 px-3 py-1.5 rounded bg-slate-900/60 backdrop-blur-md text-[10px] font-bold shadow-lg uppercase">{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />} {isFullscreen ? 'Exit_Full' : 'Full_Visual'}</button>
      </header>

      <main className="flex-1 relative">
        <div className="absolute inset-0 z-10"><WorldMap data={data} onCountryClick={iso => setSelectedIso(prev => prev === iso ? null : iso)} onHover={(iso, pos) => setHoverInfo(iso ? { iso3: iso, ...pos } : null)} selectedIso={selectedIso} /></div>
        
        {hoverInfo && (
          <div className="fixed z-[120] px-3 py-2 text-[10px] bg-slate-900/95 backdrop-blur-xl border border-primary/50 text-slate-100 font-mono pointer-events-none shadow-2xl" style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}><div className="font-bold text-primary border-b border-primary/20 mb-1 pb-1">{countryByIso[hoverInfo.iso3]?.master?.name || hoverInfo.iso3}</div><div className="opacity-70 font-mono uppercase tracking-widest">ID_REF: {hoverInfo.iso3}</div></div>
        )}

        <aside className={`absolute top-0 bottom-0 right-0 w-80 md:w-96 transform transition-all duration-700 z-[90] ${selectedIso ? 'translate-x-0' : 'translate-x-full'} shadow-[-20px_0_30px_rgba(0,0,0,0.5)]`}><CountryDetails country={countryByIso[selectedIso]} onClose={() => setSelectedIso(null)} /></aside>

        {/* 分析・ニュースパネル：Z-INDEXを最前面[100]に固定 */}
        <footer className={`absolute bottom-0 left-0 right-0 z-[100] bg-slate-950/95 backdrop-blur-3xl border-t border-primary/30 transition-all duration-700 flex flex-col ${isAnalyticsOpen ? 'h-[calc(100vh-3.5rem)]' : 'h-10'} shadow-[0_-20px_50px_rgba(0,0,0,0.8)]`}>
          <button onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)} className="h-10 w-full flex items-center justify-center gap-3 text-[10px] font-bold tracking-[0.4em] text-primary/70 hover:text-primary hover:bg-primary/5 transition-all shrink-0 border-b border-white/5 pointer-events-auto">
            <Activity size={14} className={isAnalyticsOpen ? 'animate-pulse' : ''} /> 
            {isAnalyticsOpen ? 'MINIMIZE SYSTEM INTEL_HUB' : 'OPEN GLOBAL INTELLIGENCE & LIVE FEED'} 
            {isAnalyticsOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <div className="flex-1 overflow-hidden p-6 md:p-8"><GlobalAnalytics data={data} isExpanded={isAnalyticsOpen} /></div>
        </footer>
      </main>
    </div>
  );
}
