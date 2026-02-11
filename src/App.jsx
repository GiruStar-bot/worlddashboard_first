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

// --- 常数・マッピングデータ ---
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
const PIE_COLOURS = ['#06b6d4', '#8b5cf6', '#ef4444', '#facc15', '#22c55e', '#e879f9'];
const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";
const DEFAULT_FEED = "https://feeds.bbci.co.uk/news/world/rss.xml";

const ISO_MAP = {
  "004": "AFG", "008": "ALB", "010": "ATA", "012": "DZA", "016": "ASM", "020": "AND", "024": "AGO", 
  "028": "ATG", "031": "AZE", "032": "ARG", "036": "AUS", "040": "AUT", "044": "BHS", "048": "BHR", 
  "050": "BGD", "051": "ARM", "052": "BRB", "056": "BEL", "060": "BMU", "064": "BTN", "068": "BOL", 
  "070": "BIH", "072": "BWA", "074": "BVT", "076": "BRA", "084": "BLZ", "086": "IOT", "090": "SLB", 
  "092": "VGB", "096": "BRN", "100": "BGR", "104": "MMR", "108": "BDI", "112": "BLR", "116": "KHM", 
  "120": "CMR", "124": "CAN", "132": "CPV", "136": "CYP", "140": "CAF", "144": "LKA", "148": "TCD", 
  "152": "CHL", "156": "CHN", "158": "TWN", "162": "CXR", "166": "CCK", "170": "COL", "174": "COM", 
  "175": "MYT", "178": "COG", "180": "COD", "184": "COK", "188": "CRI", "191": "HRV", "192": "CUB", 
  "196": "CYP", "203": "CZE", "204": "BEN", "208": "DNK", "212": "DMA", "214": "DOM", "218": "ECU", 
  "222": "SLV", "226": "GNQ", "231": "ETH", "232": "ERI", "233": "EST", "234": "FRO", "238": "FLK", 
  "239": "SGS", "242": "FJI", "246": "FIN", "248": "ALA", "250": "FRA", "254": "GUF", "258": "PYF", 
  "260": "ATF", "262": "DJI", "266": "GAB", "268": "GEO", "270": "GMB", "275": "PSE", "276": "DEU", 
  "288": "GHA", "292": "GIB", "296": "KIR", "300": "GRC", "304": "GRL", "308": "GRD", "312": "GLP", 
  "316": "GUM", "320": "GTM", "324": "GIN", "328": "GUY", "332": "HTI", "334": "HMD", "336": "VAT", 
  "340": "HND", "344": "HKG", "348": "HUN", "352": "ISL", "356": "IND", "360": "IDN", "364": "IRN", 
  "368": "IRQ", "372": "IRL", "376": "ISR", "380": "ITA", "384": "CIV", "388": "JAM", "392": "JPN", 
  "398": "KAZ", "400": "JOR", "404": "KEN", "408": "PRK", "410": "KOR", "414": "KWT", "417": "KGZ", 
  "418": "LAO", "422": "LBN", "426": "LSO", "428": "LVA", "430": "LBR", "434": "LBY", "438": "LIE", 
  "440": "LTU", "442": "LUX", "446": "MAC", "450": "MDG", "454": "MWI", "458": "MYS", "462": "MDV", 
  "466": "MLI", "470": "MLT", "474": "MTQ", "478": "MRT", "480": "MUS", "484": "MEX", "492": "MCO", 
  "496": "MNG", "498": "MDA", "499": "MNE", "500": "MSR", "504": "MAR", "508": "MOZ", "512": "OMN", 
  "516": "NAM", "520": "NRU", "524": "NPL", "528": "NLD", "531": "CUW", "533": "ABW", "534": "SXM", 
  "535": "BES", "540": "NCL", "548": "VUT", "554": "NZL", "558": "NIC", "562": "NER", "566": "NGA", 
  "570": "NIU", "574": "NFK", "578": "NOR", "580": "MNP", "581": "UMI", "583": "FSM", "584": "MHL", 
  "585": "PLW", "586": "PAK", "591": "PAN", "598": "PNG", "600": "PRY", "604": "PER", "608": "PHL", 
  "612": "PCN", "616": "POL", "620": "PRT", "624": "GNB", "626": "TLS", "630": "PRI", "634": "QAT", 
  "638": "REU", "642": "ROU", "643": "RUS", "646": "RWA", "652": "BLM", "654": "SHN", "659": "KNA", 
  "660": "AIA", "662": "LCA", "663": "MAF", "666": "SPM", "670": "VCT", "674": "SMR", "678": "STP", 
  "682": "SAU", "686": "SEN", "688": "SRB", "690": "SYC", "694": "SLE", "702": "SGP", "703": "SVK", 
  "704": "VNM", "705": "SVN", "706": "SOM", "710": "ZAF", "716": "ZWE", "724": "ESP", "728": "SSD", 
  "729": "SDN", "732": "ESH", "740": "SUR", "744": "SJM", "748": "SWZ", "752": "SWE", "756": "CHE", 
  "760": "SYR", "762": "TJK", "764": "THA", "768": "TGO", "772": "TKL", "776": "TON", "780": "TTO", 
  "784": "ARE", "788": "TUN", "792": "TUR", "795": "TKM", "796": "TCA", "798": "TUV", "800": "UGA", 
  "804": "UKR", "807": "MKD", "818": "EGY", "826": "GBR", "834": "TZA", "840": "USA", "850": "VIR", 
  "854": "BFA", "858": "URY", "860": "UZB", "862": "VEN", "876": "WLF", "882": "WSM", "887": "YEM", 
  "894": "ZMB"
};

// --- カラーユーティリティ ---
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
};
const rgbToHex = ({ r, g, b }) => '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
const mixColours = (a, b, t) => rgbToHex({
  r: a.r + (b.r - a.r) * t,
  g: a.g + (b.g - a.g) * t,
  b: a.b + (b.b - a.b) * t,
});

const COL_LOW = hexToRgb('#06b6d4');
const COL_MID = hexToRgb('#8b5cf6');
const COL_HIGH = hexToRgb('#ef4444');

// --- コンポーネント: WorldMap ---
function WorldMap({ data, onCountryClick, onHover, selectedIso }) {
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

  const getColour = (risk) => {
    if (risk == null) return '#1e293b';
    const t = (risk - minR) / (maxR - minR || 1);
    return t < 0.5 ? mixColours(COL_LOW, COL_MID, t / 0.5) : mixColours(COL_MID, COL_HIGH, (t - 0.5) / 0.5);
  };

  return (
    <div className="w-full h-full bg-slate-950">
      <ComposableMap projectionConfig={{ scale: 220 }} className="w-full h-full">
        <ZoomableGroup center={[0, 0]} zoom={1} minZoom={1} maxZoom={8} translateExtent={[[0, 0], [800, 600]]}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) => geographies.map(geo => {
              const iso = ISO_MAP[geo.id] || geo.id;
              const risk = riskByIso[iso];
              const isSelected = iso === selectedIso;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getColour(risk)}
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
                  filter={isSelected ? 'url(#glow)' : undefined}
                />
              );
            })}
          </Geographies>
        </ZoomableGroup>
        <defs><filter id="glow"><feGaussianBlur stdDeviation="3" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      </ComposableMap>
    </div>
  );
}

// --- コンポーネント: CountryDetails ---
function CountryDetails({ country, onClose }) {
  const [headline, setHeadline] = useState('');
  useEffect(() => {
    if (!country) return;
    const text = country.ui_view?.headline || '';
    let i = 0; setHeadline('');
    const timer = setInterval(() => {
      setHeadline(text.slice(0, ++i));
      if (i >= text.length) clearInterval(timer);
    }, 15);
    return () => clearInterval(timer);
  }, [country]);

  if (!country) return null;
  const { master, canonical, ui_view } = country;
  const radarData = [
    { subject: 'Econ', score: ui_view?.scores?.economy_score || 0 },
    { subject: 'Stab', score: ui_view?.scores?.stability_score || 0 },
    { subject: 'Resi', score: 100 - (canonical?.risk?.fsi_total?.value || 50) }
  ];

  const Metric = ({ label, value, icon: Icon, color = "text-primary" }) => (
    <div className="p-3 bg-slate-800/50 border border-white/5 rounded hover:border-primary/30 transition-all">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={12} className="text-slate-500" />}
        <span className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className={`font-mono text-base ${color} text-glow`}>{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/80 backdrop-blur-xl border-l border-primary/20">
      <div className="p-5 border-b border-white/10 flex justify-between items-start">
        <div>
          <div className="text-[10px] text-primary animate-pulse tracking-widest mb-1">TARGET ACQUIRED</div>
          <h2 className="text-xl font-bold text-white">{master.name}</h2>
          <div className="text-xs font-mono text-slate-500 mt-1">{master.iso3} | {canonical?.politics?.regime_type}</div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="p-3 rounded bg-primary/5 border-l-2 border-primary font-mono text-xs text-slate-300 leading-relaxed min-h-[4rem]">
          {headline}<span className="animate-pulse text-primary">_</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Pop" value={canonical?.society?.population?.value?.toLocaleString() || '0'} icon={Users} color="text-blue-400" />
          <Metric label="GDP" value={`$${((canonical?.economy?.gdp_nominal?.value || 0) / 1e9).toFixed(1)}B`} icon={Activity} color="text-emerald-400" />
          <Metric label="Growth" value={`${canonical?.economy?.gdp_growth?.value || 0}%`} icon={Activity} />
          <Metric label="Risk" value={canonical?.risk?.fsi_total?.value?.toFixed(1) || 'N/A'} icon={AlertTriangle} color="text-red-400" />
        </div>
        <div className="h-48 border border-white/5 rounded bg-slate-800/30 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#334155" /><PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar name="Stats" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// --- コンポーネント: GlobalAnalytics ---
function GlobalAnalytics({ data, isExpanded }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    setLoading(true);
    fetch(`${RSS_API}${encodeURIComponent(DEFAULT_FEED)}`)
      .then(res => res.json())
      .then(json => { if (json.status === "ok") setNews(json.items.slice(0, 10)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isExpanded]);

  const countries = useMemo(() => {
    const arr = [];
    if (data?.regions) Object.values(data.regions).forEach(reg => reg.forEach(c => arr.push(c)));
    return arr;
  }, [data]);

  const pieData = useMemo(() => {
    const sorted = [...countries].sort((a, b) => (b.canonical?.economy?.gdp_nominal?.value || 0) - (a.canonical?.economy?.gdp_nominal?.value || 0)).slice(0, 5);
    const top = sorted.map(c => ({ name: c.master.name, value: c.canonical?.economy?.gdp_nominal?.value || 0 }));
    return [...top, { name: 'Others', value: 1e12 }]; // Dummy others for visual
  }, [countries]);

  return (
    <div className={`grid gap-6 h-full transition-all ${isExpanded ? 'lg:grid-cols-12' : 'lg:grid-cols-2'}`}>
      <div className={`${isExpanded ? 'lg:col-span-8' : ''} grid md:grid-cols-2 gap-4 h-full`}>
        <div className="glassmorphic p-4 border border-primary/10 flex flex-col">
          <h4 className="text-[10px] text-primary font-bold uppercase tracking-widest mb-4">GDP Distribution</h4>
          <div className="flex-1"><ResponsiveContainer><PieChart>
            <Pie data={pieData} dataKey="value" innerRadius="50%" outerRadius="80%" stroke="none">
              {pieData.map((_, i) => <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />)}
            </Pie>
            <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 10, color: '#e2e8f0' }} />
            <ChartTooltip contentStyle={{ backgroundColor: '#020617', color: '#fff', fontSize: 11 }} />
          </PieChart></ResponsiveContainer></div>
        </div>
        <div className="glassmorphic p-4 border border-primary/10 flex flex-col">
          <h4 className="text-[10px] text-primary font-bold uppercase tracking-widest mb-4">Risk Scatter</h4>
          <div className="flex-1"><ResponsiveContainer><ScatterChart margin={{ top: 10, right: 10 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.2} />
            <XAxis type="number" dataKey="x" hide /><YAxis type="number" dataKey="y" hide />
            <Scatter data={[{ x: 10, y: 20 }, { x: 40, y: 80 }]} fill="#8b5cf6" />
          </ScatterChart></ResponsiveContainer></div>
        </div>
      </div>
      {isExpanded && (
        <div className="lg:col-span-4 glassmorphic border border-primary/20 bg-primary/5 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-primary/20 flex justify-between items-center bg-primary/10">
            <h4 className="text-[10px] text-primary font-bold tracking-[0.2em] flex items-center gap-2"><Newspaper size={14} /> LIVE INTEL</h4>
            {loading && <RefreshCw size={14} className="animate-spin text-primary" />}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {news.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noreferrer" className="block p-3 bg-slate-900/40 border border-white/5 hover:border-primary/40 rounded transition-all">
                <div className="text-[10px] text-slate-500 mb-1">{new Date(item.pubDate).toLocaleDateString()}</div>
                <h5 className="text-xs font-bold text-slate-200 group-hover:text-primary leading-tight">{item.title}</h5>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- メインコンポーネント: App ---
export default function App() {
  const [data, setData] = useState(null);
  const [selectedIso, setSelectedIso] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // 修正: import.meta.env が利用できない場合のためのフォールバック処理
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.BASE_URL : '/worlddashboard_2/';
    fetch(`${baseUrl}worlddash_global_master.json`)
      .then(res => res.json())
      .then(setData)
      .catch(e => console.error("Data load failed", e));
  }, []);

  const toggleFs = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
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

  if (!data) return (
    <div className="h-screen flex items-center justify-center text-primary animate-pulse font-mono bg-slate-950 tracking-[0.3em]">
      BOOTING INTELLIGENCE HUB...
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 relative font-sans text-slate-200">
      <div className="absolute inset-0 pointer-events-none scanline-effect z-50 opacity-10"></div>
      
      <header className="absolute top-0 left-0 right-0 h-14 flex items-center px-6 justify-between z-40 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Globe className="text-primary animate-pulse" size={20} />
          <h1 className="text-lg font-bold tracking-widest font-mono">WORLD<span className="text-primary">DASH</span></h1>
        </div>
        <div className="flex items-center gap-6 pointer-events-auto">
          <button onClick={toggleFs} className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2 border border-white/10 px-3 py-1 rounded bg-slate-900/50 text-[10px] font-bold">
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            {isFullscreen ? 'EXIT' : 'FULLSCREEN'}
          </button>
        </div>
      </header>

      <main className="flex-1 relative">
        <WorldMap data={data} onCountryClick={iso => setSelectedIso(prev => prev === iso ? null : iso)} onHover={(iso, pos) => setHoverInfo(iso ? { iso3: iso, ...pos } : null)} selectedIso={selectedIso} />
        
        {hoverInfo && (
          <div className="fixed z-50 px-3 py-2 text-[10px] bg-slate-900/95 backdrop-blur border border-primary/40 text-slate-100 font-mono pointer-events-none shadow-xl" style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}>
            <div className="font-bold text-primary border-b border-primary/20 mb-1 pb-1">{countryByIso[hoverInfo.iso3]?.master?.name || hoverInfo.iso3}</div>
            <div className="opacity-70 uppercase">ID: {hoverInfo.iso3}</div>
          </div>
        )}

        <aside className={`absolute top-14 bottom-0 right-0 w-80 md:w-96 transform transition-all duration-500 z-20 ${selectedIso ? 'translate-x-0' : 'translate-x-full'}`}>
          <CountryDetails country={countryByIso[selectedIso]} onClose={() => setSelectedIso(null)} />
        </aside>

        <footer className={`absolute bottom-0 left-0 right-0 z-[60] bg-slate-950/95 backdrop-blur-2xl border-t border-primary/30 transition-all duration-500 flex flex-col ${isAnalyticsOpen ? 'h-[calc(100vh-3.5rem)]' : 'h-10'}`}>
          <button onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)} className="h-10 w-full flex items-center justify-center gap-3 text-[10px] font-bold tracking-[0.3em] text-primary/70 hover:text-primary hover:bg-primary/5 transition-all shrink-0">
            <Activity size={14} className={isAnalyticsOpen ? 'animate-pulse' : ''} />
            {isAnalyticsOpen ? 'MINIMIZE SYSTEM INTEL' : 'OPEN GLOBAL INTELLIGENCE & LIVE FEED'}
            {isAnalyticsOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <div className="flex-1 overflow-hidden p-6">
            <GlobalAnalytics data={data} isExpanded={isAnalyticsOpen} />
          </div>
        </footer>
      </main>
    </div>
  );
}
