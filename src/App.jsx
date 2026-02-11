import React, { useEffect, useState, useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, CartesianGrid,
  XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer
} from 'recharts';
import { 
  Globe, ChevronUp, ChevronDown, Activity, Maximize, Minimize, 
  X, Users, AlertTriangle, Newspaper, ExternalLink, RefreshCw, AlertCircle, TrendingUp 
} from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

/**
 * WorldDashboard v2.4 - Organic Glass UI Edition
 * * 修正点:
 * 1. ライブラリ参照の安定化（標準インポートへの復帰）
 * 2. 有機的なグラスモーフィズムデザインへの刷新
 * 3. 各国ステータスの全指標（FSI, 成長率等）の復活
 * 4. 地図の移動制限（上下ロック、左右拡張）の最適化
 */

// --- 設定・データソース ---
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
const PIE_COLOURS = ['#22d3ee', '#818cf8', '#f43f5e', '#fbbf24', '#34d399', '#f472b6'];
const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";
const DEFAULT_FEED = "https://feeds.bbci.co.uk/news/world/rss.xml";

const ISO_MAP = {
  "004": "AFG", "008": "ALB", "012": "DZA", "024": "AGO", "031": "AZE", "032": "ARG", "036": "AUS", "040": "AUT", "050": "BGD", "051": "ARM", "056": "BEL", "068": "BOL", "070": "BIH", "072": "BWA", "076": "BRA", "096": "BRN", "100": "BGR", "104": "MMR", "108": "BDI", "112": "BLR", "116": "KHM", "120": "CMR", "124": "CAN", "140": "CAF", "148": "TCD", "152": "CHL", "156": "CHN", "170": "COL", "178": "COG", "180": "COD", "188": "CRI", "191": "HRV", "192": "CUB", "196": "CYP", "203": "CZE", "208": "DNK", "214": "DOM", "218": "ECU", "222": "SLV", "226": "GNQ", "231": "ETH", "232": "ERI", "233": "EST", "242": "FJI", "246": "FIN", "250": "FRA", "266": "GAB", "268": "GEO", "270": "GMB", "276": "DEU", "288": "GHA", "300": "GRC", "320": "GTM", "324": "GIN", "328": "GUY", "332": "HTI", "340": "HND", "348": "HUN", "352": "ISL", "356": "IND", "360": "IDN", "364": "IRN", "368": "IRQ", "372": "IRL", "376": "ISR", "380": "ITA", "384": "CIV", "388": "JAM", "392": "JPN", "398": "KAZ", "400": "JOR", "404": "KEN", "408": "PRK", "410": "KOR", "414": "KWT", "417": "KGZ", "418": "LAO", "422": "LBN", "426": "LSO", "428": "LVA", "430": "LBR", "434": "LBY", "440": "LTU", "442": "LUX", "450": "MDG", "454": "MWI", "458": "MYS", "462": "MDV", "466": "MLI", "470": "MLT", "478": "MRT", "480": "MUS", "484": "MEX", "492": "MCO", "496": "MNG", "498": "MDA", "499": "MNE", "504": "MAR", "508": "MOZ", "512": "OMN", "516": "NAM", "520": "NRU", "524": "NPL", "528": "NLD", "554": "NZL", "558": "NIC", "562": "NER", "566": "NGA", "578": "NOR", "586": "PAK", "591": "PAN", "598": "PNG", "600": "PRY", "604": "PER", "608": "PHL", "616": "POL", "620": "PRT", "634": "QAT", "642": "ROU", "643": "RUS", "646": "RWA", "682": "SAU", "686": "SEN", "688": "SRB", "694": "SLE", "702": "SGP", "703": "SVK", "704": "VNM", "705": "SVN", "710": "ZAF", "716": "ZWE", "724": "ESP", "728": "SSD", "729": "SDN", "740": "SUR", "748": "SWZ", "752": "SWE", "756": "CHE", "760": "SYR", "762": "TJK", "764": "THA", "768": "TGO", "772": "TKL", "776": "TON", "780": "TTO", "784": "ARE", "788": "TUN", "792": "TUR", "795": "TKM", "800": "UGA", "804": "UKR", "807": "MKD", "818": "EGY", "826": "GBR", "834": "TZA", "840": "USA", "858": "URY", "860": "UZB", "862": "VEN", "882": "WSM", "887": "YEM", "894": "ZMB"
};

// --- カラーヘルパー ---
const getRiskColor = (risk, min, max) => {
  if (risk == null) return 'rgba(30, 41, 59, 0.4)';
  const t = (risk - min) / (max - min || 1);
  const mix = (a, b, w) => ({
    r: Math.round(a.r + (b.r - a.r) * w),
    g: Math.round(a.g + (b.g - a.g) * w),
    b: Math.round(a.b + (b.b - a.b) * w)
  });
  const cA = { r: 34, g: 211, b: 238 }; // Cyan
  const cB = { r: 167, g: 139, b: 250 }; // Purple
  const cC = { r: 244, g: 63, b: 94 }; // Rose/Red
  const res = t < 0.5 ? mix(cA, cB, t / 0.5) : mix(cB, cC, (t - 0.5) / 0.5);
  return `rgb(${res.r}, ${res.g}, ${res.b})`;
};

// --- コンポーネント: WorldMap ---
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
          center={[0, 0]} zoom={1} minZoom={1} maxZoom={8} 
          // 左右の制限を緩和し、上下は地図の高さに固定
          translateExtent={[[-500, 0], [1300, 600]]}
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
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none', transition: 'fill 0.4s ease' },
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
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </ComposableMap>
    </div>
  );
};

// --- コンポーネント: 分析パネル ---
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
    <div className={`grid gap-8 h-full transition-all duration-700 ${isExpanded ? 'lg:grid-cols-12' : 'lg:grid-cols-2'}`}>
      <div className={`${isExpanded ? 'lg:col-span-8' : ''} grid md:grid-cols-2 gap-8 h-full`}>
        {/* 有機的な硝子カードデザイン */}
        <div className="bg-white/[0.03] backdrop-blur-2xl p-8 border border-white/10 flex flex-col rounded-[2.5rem] shadow-2xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          <h4 className="text-[11px] text-cyan-400 font-black tracking-[0.4em] mb-8 flex items-center gap-3">
             <Activity size={16}/> ECONOMIC_DISTRIBUTION
          </h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius="65%" outerRadius="90%" stroke="none" paddingAngle={8} cornerRadius={12}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />)}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingLeft: 20 }} />
                <ChartTooltip contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', color: '#fff', fontSize: 11 }} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl p-8 border border-white/10 flex flex-col rounded-[2.5rem] shadow-2xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          <h4 className="text-[11px] text-indigo-400 font-black tracking-[0.4em] mb-8">WEALTH_VS_STABILITY</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="6 6" vertical={false} />
                <XAxis type="number" dataKey="x" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{fill:'#64748b', fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="y" tick={{fill:'#64748b', fontSize:10}} axisLine={false} tickLine={false} />
                <ChartTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', color: '#fff', fontSize: 11 }} />
                <Scatter data={scatterData} fill="#818cf8" fillOpacity={0.4} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-3xl border border-white/10 flex flex-col overflow-hidden rounded-[3rem] shadow-2xl animate-in slide-in-from-right duration-700">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h4 className="text-[11px] text-cyan-400 font-black tracking-[0.5em] flex items-center gap-3"><Newspaper size={18} /> LIVE_INTELLIGENCE</h4>
            {loading && <RefreshCw size={16} className="animate-spin text-cyan-400" />}
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {news.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noreferrer" className="block p-5 bg-white/[0.03] hover:bg-white/[0.08] border border-transparent hover:border-cyan-500/20 rounded-[2rem] transition-all group active:scale-[0.98] duration-300">
                <div className="text-[10px] text-slate-500 mb-3 flex justify-between font-mono">
                  <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full">{new Date(item.pubDate).toLocaleDateString()}</span>
                  <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h5 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 leading-snug transition-colors">{item.title}</h5>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- コンポーネント: CountryDetails ---
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
  const { master, canonical, ui_view } = country;
  const radarData = [
    { subject: 'ECON', score: ui_view?.scores?.economy_score || 0 },
    { subject: 'STAB', score: ui_view?.scores?.stability_score || 0 },
    { subject: 'RESI', score: 100 - (canonical?.risk?.fsi_total?.value || 50) }
  ];

  const GlassMetric = ({ label, value, icon: Icon, color = "text-cyan-400" }) => (
    <div className="p-5 bg-white/[0.03] border border-white/[0.05] rounded-[2rem] hover:bg-white/[0.08] hover:border-cyan-500/30 transition-all duration-500 flex flex-col items-start group shadow-lg">
      <div className="text-[10px] text-slate-500 mb-3 flex items-center gap-2 uppercase font-black tracking-widest group-hover:text-slate-300">
        {Icon && <Icon size={12} className="opacity-60 group-hover:opacity-100 transition-opacity"/>} {label}
      </div>
      <div className={`font-mono ${color} text-xl md:text-2xl leading-none truncate w-full font-black tracking-tighter text-shadow-glow`}>{value}</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/30 backdrop-blur-[50px] border-l border-white/10 shadow-[-30px_0_60px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="p-10 border-b border-white/5 flex justify-between items-start bg-gradient-to-b from-white/[0.04] to-transparent">
        <div className="space-y-3">
          <div className="text-[11px] text-cyan-400 animate-pulse tracking-[0.6em] font-black uppercase">TARGET_STATUS</div>
          <h2 className="text-4xl font-black text-white tracking-tight leading-none drop-shadow-2xl">{master.name}</h2>
          <div className="flex gap-3 mt-3">
             <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-3 py-1 rounded-full font-black border border-cyan-500/20 uppercase tracking-widest">{master.iso3}</span>
             <span className="bg-white/5 text-slate-400 text-[10px] px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest font-bold">{canonical?.politics?.regime_type || 'N/A'}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-all p-3 bg-white/[0.05] rounded-full hover:rotate-90 duration-500 shadow-2xl border border-white/10"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-thin">
        {/* 有機的な曲線を持つ要約カード */}
        <div className="p-8 rounded-[2.5rem] bg-cyan-500/[0.03] border border-cyan-500/10 font-bold text-sm text-slate-200 leading-relaxed shadow-inner relative overflow-hidden group">
          <div className="absolute top-[-50%] right-[-20%] w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
          {headline}<span className="animate-pulse text-cyan-400 font-black ml-1">|</span>
        </div>

        {/* 復活：地政学・経済全指標 */}
        <div className="grid grid-cols-2 gap-5">
          <GlassMetric label="Population" value={canonical?.society?.population?.value?.toLocaleString() || '0'} icon={Users} color="text-cyan-400" />
          <GlassMetric label="GDP (Nominal)" value={`$${((canonical?.economy?.gdp_nominal?.value || 0) / 1e9).toFixed(1)}B`} icon={Activity} color="text-indigo-400" />
          <GlassMetric label="GDP Growth" value={`${(canonical?.economy?.gdp_growth?.value || 0) > 0 ? '+' : ''}${canonical?.economy?.gdp_growth?.value || 0}%`} icon={TrendingUp} color={(canonical?.economy?.gdp_growth?.value || 0) >= 0 ? "text-emerald-400" : "text-rose-400"} />
          <GlassMetric label="FSI Risk" value={canonical?.risk?.fsi_total?.value?.toFixed(1) || 'N/A'} icon={AlertTriangle} color={(canonical?.risk?.fsi_total?.value || 0) > 80 ? "text-rose-500" : "text-cyan-400"} />
        </div>

        <div className="space-y-5">
          <div className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] pl-2">NEURAL_PARAMETER_MAP</div>
          <div className="h-72 border border-white/5 rounded-[3rem] bg-white/[0.02] p-8 shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="85%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: '900' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Status" dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} dot={{ r: 4, fill: '#22d3ee', strokeWidth: 2 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
           {ui_view?.tags?.map(t => (
             <span key={t} className="px-4 py-1.5 rounded-full border border-white/10 text-[10px] text-slate-400 uppercase font-black bg-white/[0.05] hover:bg-cyan-500/10 hover:border-cyan-500/40 hover:text-cyan-300 transition-all cursor-pointer shadow-lg">
               #{t}
             </span>
           ))}
        </div>
      </div>
    </div>
  );
};

// --- メインアプリ ---
export default function App() {
  const [data, setData] = useState(null);
  const [selectedIso, setSelectedIso] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetch("/worlddashboard_2/worlddash_global_master.json")
      .then(res => {
        if(!res.ok) throw new Error("Data not found");
        return res.json();
      })
      .then(setData)
      .catch(e => console.error("Initialization failed", e));
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

  if (!data) return (
    <div className="h-screen flex flex-col items-center justify-center text-cyan-400 animate-pulse font-mono bg-slate-950 tracking-[1em]">
       <Globe size={64} className="mb-10 opacity-30 animate-spin-slow" />
       CONNECTING_CORE_v2.4
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 relative font-sans text-slate-200">
      {/* 有機的な粒子背景レイヤー */}
      <div className="absolute inset-0 pointer-events-none z-[999] opacity-25 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      
      {/* 走査線レイヤー */}
      <div className="absolute inset-0 pointer-events-none z-[998] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_6px]"></div>
      
      {/* 光源演出 */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-24 flex items-center px-12 justify-between z-[80] bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
        <div className="flex items-center gap-5 pointer-events-auto">
          <div className="p-3 bg-cyan-500/10 rounded-3xl border border-cyan-500/20 backdrop-blur-3xl shadow-2xl">
            <Globe className="text-cyan-400 animate-pulse" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-[0.4em] font-mono text-white text-shadow-glow flex items-center gap-2">
               WORLD<span className="text-cyan-400 opacity-90">DASH</span>
            </h1>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mt-1">Global_Intelligence_Nexus</div>
          </div>
        </div>
        <button onClick={toggleFs} className="pointer-events-auto text-slate-400 hover:text-cyan-400 transition-all flex items-center gap-4 border border-white/5 px-8 py-3 rounded-full bg-white/[0.03] backdrop-blur-3xl text-[11px] font-black shadow-2xl group active:scale-95 duration-300">
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />} 
          <span className="group-hover:tracking-[0.3em] transition-all uppercase">{isFullscreen ? 'EXIT_LINK' : 'FULL_IMMERSE'}</span>
        </button>
      </header>

      <main className="flex-1 relative">
        {/* Map Layer */}
        <div className="absolute inset-0 z-10 scale-[1.03] transform transition-transform duration-[2000ms] cubic-bezier(0.16, 1, 0.3, 1)">
          <WorldMap data={data} onCountryClick={iso => setSelectedIso(prev => prev === iso ? null : iso)} onHover={(iso, pos) => setHoverInfo(iso ? { iso3: iso, ...pos } : null)} selectedIso={selectedIso} />
        </div>
        
        {/* 有機的なツールチップ */}
        {hoverInfo && (
          <div className="fixed z-[120] px-6 py-4 bg-slate-900/80 backdrop-blur-3xl border border-white/10 text-slate-100 font-mono pointer-events-none shadow-2xl rounded-[2rem] animate-in fade-in zoom-in-95 duration-300" style={{ left: hoverInfo.x + 25, top: hoverInfo.y + 25 }}>
            <div className="font-black text-cyan-400 text-base border-b border-white/5 mb-3 pb-3 flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              {countryByIso[hoverInfo.iso3]?.master?.name || hoverInfo.iso3}
            </div>
            <div className="opacity-40 text-[10px] tracking-[0.4em] font-black uppercase flex justify-between gap-12">
              <span>REF_ID</span>
              <span className="text-white">{hoverInfo.iso3}</span>
            </div>
          </div>
        )}

        {/* Slide HUD Side Panel */}
        <aside className={`absolute top-0 bottom-0 right-0 w-[26rem] md:w-[32rem] transform transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) z-[90] ${selectedIso ? 'translate-x-0' : 'translate-x-full'}`}>
          <CountryDetails country={countryByIso[selectedIso]} onClose={() => setSelectedIso(null)} />
        </aside>

        {/* Global Bottom Sheet Panel */}
        <footer className={`absolute bottom-0 left-0 right-0 z-[100] bg-slate-950/60 backdrop-blur-[60px] border-t border-white/10 transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isAnalyticsOpen ? 'h-[calc(100vh-6rem)] rounded-t-[5rem]' : 'h-14'} shadow-[0_-30px_80px_rgba(0,0,0,0.7)]`}>
          <button onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)} className="h-14 w-full flex items-center justify-center gap-6 text-[10px] font-black tracking-[1em] text-cyan-400/40 hover:text-cyan-400 hover:bg-white/[0.02] transition-all shrink-0 group pointer-events-auto">
            <Activity size={18} className={`${isAnalyticsOpen ? 'animate-pulse text-cyan-400' : 'opacity-30 group-hover:opacity-100'}`} /> 
            {isAnalyticsOpen ? 'CLOSE_HUB_INTERFACE' : 'OPEN_GLOBAL_INTELLIGENCE_STREAM'} 
            {isAnalyticsOpen ? <ChevronDown size={24} className="mt-1" /> : <ChevronUp size={24} className="mb-1" />}
          </button>
          <div className="flex-1 overflow-hidden p-10 md:p-16">
            <GlobalAnalytics data={data} isExpanded={isAnalyticsOpen} />
          </div>
        </footer>
      </main>
      
      <style>{`
        .text-shadow-glow { text-shadow: 0 0 20px rgba(34, 211, 238, 0.6); }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.2); }
        .animate-spin-slow { animation: spin 15s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        body { background-color: #020617; }
      `}</style>
    </div>
  );
}
