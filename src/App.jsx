import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, CartesianGrid,
  XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer
} from 'recharts';
import { 
  Globe, ChevronUp, ChevronDown, Activity, Maximize, Minimize, 
  X, Users, AlertTriangle, Newspaper, ExternalLink, RefreshCw, TrendingUp,
  BarChart2
} from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

/**
 * WorldDashboard v5.4 - Panel UI Optimization
 * - 改善: 国詳細パネルのヘッダーをスリム化し、長い国名も省略されずに表示されるように修正。
 * - 改善: ステータスカードとチャートの余白を調整し、一度に見える情報量を増加（視認性の向上）。
 */

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

// --- Color Utility Functions ---
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function mixColours(a, b, t) {
  return rgbToHex({
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  });
}

const COLOUR_LOW = hexToRgb('#06b6d4');  // Cyan
const COLOUR_MID = hexToRgb('#8b5cf6');  // Purple
const COLOUR_HIGH = hexToRgb('#ef4444'); // Red

// ==========================================
// 1. WorldMap Component
// ==========================================
const WorldMap = React.memo(({ data, onCountryClick, onHover, selectedIso }) => {
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

  const [minRisk, maxRisk] = useMemo(() => {
    const values = Object.values(riskByIso).filter((v) => v != null);
    if (!values.length) return [0, 120];
    return [Math.min(...values), Math.max(...values)];
  }, [riskByIso]);

  const getColour = useCallback((risk) => {
    if (risk == null) return '#1e293b';
    const t = (risk - minRisk) / (maxRisk - minRisk || 1);
    if (t < 0.5) return mixColours(COLOUR_LOW, COLOUR_MID, t / 0.5);
    return mixColours(COLOUR_MID, COLOUR_HIGH, (t - 0.5) / 0.5);
  }, [minRisk, maxRisk]);

  const geoStyle = useMemo(() => ({
    default: { outline: 'none', transition: 'fill 0.3s ease' },
    hover: { fill: '#22d3ee', cursor: 'pointer', outline: 'none' },
    pressed: { fill: '#8b5cf6', outline: 'none' },
  }), []);

  return (
    <div className="w-full h-full bg-slate-950">
      <ComposableMap projectionConfig={{ scale: 220 }} className="w-full h-full outline-none">
        <ZoomableGroup center={[10, 20]} zoom={1.7} minZoom={1} maxZoom={8} translateExtent={[[-400, -200], [1200, 800]]}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isoAlpha3 = ISO_MAP[geo.id];
                const iso = isoAlpha3 || geo.id;
                const risk = riskByIso[iso];
                const fill = getColour(risk);
                const isSelected = iso === selectedIso;
                
                return (
                  <Geography
                    key={geo.rsmKey} geography={geo} fill={fill} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} style={geoStyle}
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
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </ComposableMap>
    </div>
  );
});

// ==========================================
// 2. CountryDetails Component (右パネル)
// ==========================================
// 改善: Metricカードもスリム化して情報密度を上げる
const Metric = ({ label, value, icon: Icon, color = "text-cyan-400" }) => (
  <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:bg-white/[0.08] hover:border-cyan-500/30 transition-all duration-300 flex flex-col items-start group shadow-lg">
    <div className="text-[9px] text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase font-semibold tracking-wider group-hover:text-slate-200">
      {Icon && <Icon size={12} className="opacity-70 group-hover:opacity-100 transition-opacity" />} {label}
    </div>
    <div className={`font-mono ${color} text-lg md:text-xl leading-tight w-full font-bold tracking-tight text-shadow-sm`}>{value}</div>
  </div>
);

const CountryDetails = ({ country, onClose }) => {
  const headlineRef = useRef(null);

  useEffect(() => {
    if (!country || !headlineRef.current) return;
    const text = country.ui_view?.headline || '';
    let i = 0;
    headlineRef.current.innerHTML = '';
    const timer = setInterval(() => {
      i++;
      headlineRef.current.innerHTML = text.slice(0, i) + '<span class="animate-pulse text-cyan-400 font-bold ml-1">_</span>';
      if (i >= text.length) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [country]);

  if (!country) return null;

  const { master, canonical, ui_view } = country;
  const radarData = [
    { subject: 'Economy', score: ui_view?.scores?.economy_score || 0 },
    { subject: 'Stability', score: ui_view?.scores?.stability_score || 0 },
    { subject: 'Resilience', score: 100 - (canonical?.risk?.fsi_total?.value || 50) }
  ];

  const population = canonical?.society?.population?.value ?? 0;
  const gdpNominal = canonical?.economy?.gdp_nominal?.value ?? 0;
  const gdpGrowth = canonical?.economy?.gdp_growth?.value;
  const riskValue = canonical?.risk?.fsi_total?.value;

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-[40px] border-l border-white/10 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* 改善: ヘッダーのスリム化と国名省略の解除 */}
      <div className="p-6 border-b border-white/5 flex justify-between items-start bg-gradient-to-b from-white/[0.04] to-transparent shrink-0">
        <div className="space-y-1.5 flex-1 pr-4">
          <div className="text-[9px] text-cyan-400 animate-pulse tracking-[0.5em] font-semibold uppercase font-mono">TARGET_ACQUIRED</div>
          {/* truncateを外し、改行を許可。文字サイズも少しスマートに */}
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight leading-tight uppercase break-words">{master.name}</h2>
          <div className="flex flex-wrap gap-2 pt-1 font-mono">
             <span className="bg-cyan-500/10 text-cyan-400 text-[9px] px-2.5 py-0.5 rounded-full border border-cyan-500/20 uppercase font-semibold tracking-wider">{master.iso3}</span>
             <span className="bg-white/5 text-slate-400 text-[9px] px-2.5 py-0.5 rounded-full border border-white/10 uppercase font-semibold tracking-wider">{canonical?.politics?.regime_type || 'N/A'}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors duration-300 shrink-0"><X size={20} /></button>
      </div>
      
      {/* 改善: パディングを少し減らし、コンテンツ領域を拡大 */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6 custom-scrollbar">
        <div ref={headlineRef} className="p-4 rounded-2xl bg-cyan-500/[0.03] border border-cyan-500/10 font-sans text-xs text-slate-300 leading-relaxed min-h-[3.5rem]"></div>
        
        <div className="grid grid-cols-2 gap-4">
          <Metric label="Population" value={population.toLocaleString()} icon={Users} color="text-blue-400" />
          <Metric label="GDP (Nominal)" value={`$${(gdpNominal / 1e9).toFixed(1)}B`} icon={Activity} color="text-emerald-400" />
          <Metric label="GDP Growth" value={gdpGrowth !== undefined ? `${gdpGrowth > 0 ? '+' : ''}${gdpGrowth}%` : "N/A"} icon={TrendingUp} color={gdpGrowth < 0 ? "text-rose-400" : "text-emerald-400"} />
          <Metric label="Risk Index" value={riskValue ? riskValue.toFixed(1) : "N/A"} icon={AlertTriangle} color={riskValue > 80 ? "text-rose-500" : (riskValue > 60 ? "text-amber-400" : "text-cyan-400")} />
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Neural_Parameter_Map</h3>
          <div className="h-56 border border-white/5 rounded-2xl bg-slate-800/20 p-2 shadow-lg relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10, fontWeight: '500' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Status" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} dot={{ r: 3, fill: '#06b6d4' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="space-y-2 pb-4">
          <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Classification_Tags</h3>
          <div className="flex flex-wrap gap-2">
             {ui_view?.tags?.map(t => (
               <span key={t} className="px-2.5 py-1 rounded-full border border-white/10 text-[9px] text-slate-300 uppercase font-medium bg-slate-800/50 hover:border-cyan-500/40 transition-colors tracking-wide font-mono cursor-default">#{t}</span>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. GlobalAnalytics Component (下部パネル)
// ==========================================
const GlobalAnalytics = ({ data, isExpanded }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && news.length === 0) {
      setLoading(true);
      fetch(`${RSS_API}${encodeURIComponent(DEFAULT_FEED)}`)
        .then(res => res.json())
        .then(json => { if (json.status === "ok") setNews(json.items.slice(0, 10)); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [isExpanded, news.length]);

  const countries = useMemo(() => {
    const arr = [];
    if (data?.regions) Object.values(data.regions).forEach(reg => reg.forEach(c => arr.push(c)));
    return arr;
  }, [data]);

  const { pieData, scatterData } = useMemo(() => {
    let totalGDP = 0;
    countries.forEach(c => totalGDP += c.canonical?.economy?.gdp_nominal?.value || 0);
    const sorted = [...countries].sort((a, b) => (b.canonical?.economy?.gdp_nominal?.value || 0) - (a.canonical?.economy?.gdp_nominal?.value || 0));
    const top5 = sorted.slice(0, 5);
    const pie = top5.map(c => ({ name: c.master.name, value: c.canonical?.economy?.gdp_nominal?.value || 0 }));
    if (totalGDP - top5.reduce((s, c) => s + (c.canonical?.economy?.gdp_nominal?.value || 0), 0) > 0) {
      pie.push({ name: 'Others', value: totalGDP - top5.reduce((s, c) => s + (c.canonical?.economy?.gdp_nominal?.value || 0), 0) });
    }

    const scatter = countries.map(c => {
      const gdp = c.canonical?.economy?.gdp_nominal?.value || 0;
      const pop = c.canonical?.society?.population?.value || 1;
      return { name: c.master.name, x: gdp / pop, y: 100 - (c.canonical?.risk?.fsi_total?.value || 50) };
    }).filter(d => d.x < 150000 && d.x > 0);
    
    return { pieData: pie, scatterData: scatter };
  }, [countries]);

  return (
    <div className={`grid gap-8 h-full transition-all duration-700 ${isExpanded ? 'lg:grid-cols-12' : 'lg:grid-cols-2'}`}>
      <div className={`${isExpanded ? 'lg:col-span-8' : ''} grid md:grid-cols-2 gap-8 h-full`}>
        <div className="bg-white/[0.02] backdrop-blur-[30px] p-6 border border-white/10 flex flex-col rounded-3xl shadow-xl relative">
          <h4 className="text-[10px] text-cyan-400 font-semibold tracking-[0.3em] mb-4 flex items-center gap-2 uppercase font-mono"><Activity size={14}/> ECONOMIC_SHARE</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius="60%" outerRadius="85%" stroke="none" paddingAngle={4} cornerRadius={6}>{pieData.map((_, i) => <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />)}</Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 10, color: '#94a3b8', paddingLeft: 10 }} />
                <ChartTooltip contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-[30px] p-6 border border-white/10 flex flex-col rounded-3xl shadow-xl relative">
          <h4 className="text-[10px] text-indigo-400 font-semibold tracking-[0.3em] mb-4 uppercase font-mono">STABILITY_ANALYSIS</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis type="number" dataKey="x" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{fill:'#64748b', fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="y" tick={{fill:'#64748b', fontSize:10}} axisLine={false} tickLine={false} />
                <ChartTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: 11 }} />
                <Scatter data={scatterData} fill="#8b5cf6" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="lg:col-span-4 bg-slate-950/60 backdrop-blur-[40px] border border-white/10 flex flex-col overflow-hidden rounded-3xl shadow-2xl animate-in slide-in-from-right duration-700">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h4 className="text-[10px] text-cyan-400 font-semibold tracking-[0.4em] flex items-center gap-2 uppercase font-mono"><Newspaper size={16} /> LIVE_FEED</h4>
            {loading && <RefreshCw size={14} className="animate-spin text-cyan-400" />}
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {news.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noreferrer" className="block p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-transparent hover:border-cyan-500/30 rounded-2xl transition-all group active:scale-[0.98]">
                <div className="text-[9px] text-slate-500 mb-2 flex justify-between font-mono"><span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">{new Date(item.pubDate).toLocaleDateString()}</span><ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                <h5 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 leading-snug transition-colors">{item.title}</h5>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. RankingPanel Component (左側リーダーボード)
// ==========================================
const RankingPanel = ({ data, isOpen, onClose, onSelectCountry, selectedIso }) => {
  const [activeTab, setActiveTab] = useState('gdp');

  const countries = useMemo(() => {
    const arr = [];
    if (data?.regions) Object.values(data.regions).forEach(reg => reg.forEach(c => arr.push(c)));
    return arr;
  }, [data]);

  const rankings = useMemo(() => {
    const gdp = [...countries]
      .filter(c => c.canonical?.economy?.gdp_nominal?.value)
      .sort((a, b) => b.canonical.economy.gdp_nominal.value - a.canonical.economy.gdp_nominal.value);
    const risk = [...countries]
      .filter(c => c.canonical?.risk?.fsi_total?.value)
      .sort((a, b) => b.canonical.risk.fsi_total.value - a.canonical.risk.fsi_total.value);
      
    return { gdp, risk };
  }, [countries]);

  const currentData = rankings[activeTab];
  const maxVal = currentData.length > 0 
    ? (activeTab === 'gdp' ? currentData[0].canonical.economy.gdp_nominal.value : 120) 
    : 1;

  return (
    <div className={`absolute top-0 bottom-0 left-0 w-[22rem] md:w-[26rem] transform transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) z-[90] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-[40px] border-r border-white/10 shadow-[20px_0_60px_rgba(0,0,0,0.5)] overflow-hidden">
        
        <div className="p-8 border-b border-white/5 flex justify-between items-start bg-gradient-to-b from-white/[0.04] to-transparent shrink-0">
          <div className="space-y-2">
            <div className="text-[10px] text-emerald-400 animate-pulse tracking-[0.4em] font-semibold uppercase font-mono">GLOBAL_RANKING</div>
            <h2 className="text-3xl font-bold text-slate-100 tracking-tight leading-snug uppercase">LEADERBOARD</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 p-2.5 rounded-full transition-colors duration-300">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-white/5 bg-white/[0.02] shrink-0">
          <button 
            onClick={() => setActiveTab('gdp')}
            className={`flex-1 py-4 text-[10px] font-bold tracking-[0.2em] uppercase font-mono transition-colors ${activeTab === 'gdp' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/[0.05]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'}`}
          >
            GDP (Nominal)
          </button>
          <button 
            onClick={() => setActiveTab('risk')}
            className={`flex-1 py-4 text-[10px] font-bold tracking-[0.2em] uppercase font-mono transition-colors ${activeTab === 'risk' ? 'text-rose-400 border-b-2 border-rose-400 bg-white/[0.05]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'}`}
          >
            FSI Risk Index
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-3 custom-scrollbar">
          {currentData.map((c, i) => {
            const iso = c.master.iso3;
            const isSelected = iso === selectedIso;
            const val = activeTab === 'gdp' 
              ? `$${(c.canonical.economy.gdp_nominal.value / 1e9).toFixed(1)}B`
              : c.canonical.risk.fsi_total.value.toFixed(1);
            const numVal = activeTab === 'gdp' ? c.canonical.economy.gdp_nominal.value : c.canonical.risk.fsi_total.value;
            const pct = (numVal / maxVal) * 100;
            const colorClass = activeTab === 'gdp' ? 'bg-emerald-400' : 'bg-rose-400';
            const textColorClass = activeTab === 'gdp' ? 'text-emerald-400' : 'text-rose-400';

            return (
              <div 
                key={iso}
                onClick={() => onSelectCountry(iso)}
                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer group ${isSelected ? `bg-white/[0.1] border-${activeTab === 'gdp' ? 'emerald' : 'rose'}-500/50 shadow-lg` : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/20'}`}
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-slate-500 font-bold w-4 text-right shrink-0">{i + 1}.</span>
                    <span className={`text-xs font-bold uppercase tracking-wide transition-colors truncate max-w-[110px] sm:max-w-[130px] ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{c.master.name}</span>
                    <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.5 border border-white/10 rounded-full shrink-0">{iso}</span>
                  </div>
                  <span className={`font-mono text-sm font-bold shrink-0 ${textColorClass}`}>{val}</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${colorClass} opacity-80`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};


// ==========================================
// 5. Main App Component
// ==========================================
export default function App() {
  const [data, setData] = useState(null);
  const [selectedIso, setSelectedIso] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const baseUrl = window.location.hostname.includes('github.io') ? "/worlddashboard_2/" : "/";
    fetch(`${baseUrl}worlddash_global_master.json`)
      .then(res => res.json())
      .then(setData)
      .catch(e => console.error("Initial load failed", e));
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

  const handleHover = useCallback((iso, pos) => {
    setHoverInfo(iso ? { iso3: iso, ...pos } : null);
  }, []);

  const handleCountryClick = useCallback((iso) => {
    setSelectedIso(prev => prev === iso ? null : iso);
  }, []);

  if (!data) return (
    <div className="h-screen flex flex-col items-center justify-center text-cyan-400 animate-pulse font-mono bg-slate-950 tracking-[1em]">
       <Globe size={60} className="mb-10 opacity-30 animate-spin-slow" />
       CONNECTING_NEXUS_v5.4
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 relative font-sans text-slate-200">
      <div className="absolute inset-0 pointer-events-none z-[999] opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      <div className="absolute inset-0 pointer-events-none z-[998] opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%)] bg-[length:100%_4px]"></div>
      
      <header className="absolute top-0 left-0 right-0 h-20 flex items-center px-8 justify-between z-[110] bg-slate-950/70 backdrop-blur-[40px] border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] font-mono transition-all duration-500">
        <div className="flex items-center gap-6">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Globe className="text-cyan-400 animate-pulse" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-[0.3em] text-white flex items-center gap-2 uppercase tracking-tighter">
              WORLD<span className="text-cyan-400 opacity-90">DASH</span>
            </h1>
            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-[0.5em] mt-0.5 opacity-70">Global_Intelligence_Nexus_v5.4</div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center pointer-events-none">
          <div className="px-6 py-1.5 rounded-full bg-white/[0.02] border border-white/5 flex items-center gap-3 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.4em]">System_Standby / Space_for_Future_Intel</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsRankingOpen(!isRankingOpen)} 
            className={`transition-all flex items-center gap-2 border px-5 py-2 rounded-full text-[10px] font-semibold shadow-lg active:scale-95 duration-300 uppercase tracking-[0.2em] ${isRankingOpen ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-cyan-400 hover:bg-white/[0.08]'}`}
          >
            <BarChart2 size={14} />
            {isRankingOpen ? 'CLOSE_RANKING' : 'OPEN_RANKING'}
          </button>

          <button onClick={toggleFs} className="text-slate-400 hover:text-cyan-400 transition-all flex items-center gap-2 border border-white/10 px-5 py-2 rounded-full bg-white/[0.04] text-[10px] font-semibold shadow-lg active:scale-95 duration-300 uppercase tracking-[0.2em]">
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />} 
            {isFullscreen ? 'EXIT_LINK' : 'FULL_DEEP'}
          </button>
        </div>
      </header>

      <main className="flex-1 relative">
        <div className="absolute inset-0 z-10 scale-[1.02] transform transition-transform duration-[3000ms]">
          <WorldMap data={data} onCountryClick={handleCountryClick} onHover={handleHover} selectedIso={selectedIso} />
        </div>
        
        {hoverInfo && (
          <div className="fixed z-[120] px-5 py-3 bg-slate-900/90 backdrop-blur-[20px] border border-white/20 text-slate-100 font-mono pointer-events-none shadow-[0_0_20px_rgba(0,0,0,0.8)] rounded-xl animate-in fade-in zoom-in-95 duration-200" style={{ left: hoverInfo.x + 20, top: hoverInfo.y + 20 }}>
            <div className="font-semibold text-cyan-400 text-sm border-b border-white/10 mb-2 pb-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              {data.regions && Object.values(data.regions).flat().find(c => c.master.iso3 === hoverInfo.iso3)?.master.name || hoverInfo.iso3}
            </div>
            <div className="opacity-60 text-[9px] tracking-[0.4em] flex justify-between gap-8 font-medium"><span>NODE</span><span className="text-white">{hoverInfo.iso3}</span></div>
          </div>
        )}

        <div className={`absolute top-20 bottom-12 left-0 w-[22rem] md:w-[26rem] transform transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) z-[90] ${isRankingOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <RankingPanel data={data} isOpen={isRankingOpen} onClose={() => setIsRankingOpen(false)} onSelectCountry={handleCountryClick} selectedIso={selectedIso} />
        </div>

        <aside className={`absolute top-20 bottom-12 right-0 w-[24rem] md:w-[28rem] transform transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) z-[90] ${selectedIso ? 'translate-x-0' : 'translate-x-full'}`}>
          <CountryDetails country={data?.regions ? Object.values(data.regions).flat().find(c => c.master.iso3 === selectedIso) : null} onClose={() => setSelectedIso(null)} />
        </aside>

        <footer className={`absolute bottom-0 left-0 right-0 z-[100] transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col overflow-hidden shrink-0 ${isAnalyticsOpen ? 'h-[calc(100vh-7rem)] rounded-t-[3rem] bg-slate-950/80 backdrop-blur-[40px] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.8)]' : 'h-12 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-[8px] border-t border-white/20 hover:bg-white/[0.08]'}`}>
          <button onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)} className={`h-12 w-full flex items-center justify-center gap-4 text-[10px] font-semibold tracking-[0.8em] transition-all shrink-0 pointer-events-auto uppercase font-mono ${isAnalyticsOpen ? 'text-cyan-400/60 hover:text-cyan-400 border-b border-white/5' : 'text-cyan-400/80 hover:text-cyan-300'}`}>
            <Activity size={14} className={`${isAnalyticsOpen ? 'animate-pulse text-cyan-400' : 'opacity-70 group-hover:opacity-100'}`} /> 
            {isAnalyticsOpen ? 'TERMINATE_HUB' : 'ACCESS_GLOBAL_STREAM'} 
            {isAnalyticsOpen ? <ChevronDown size={18} className="mt-0.5" /> : <ChevronUp size={18} className="mb-0.5" />}
          </button>
          <div className="flex-1 overflow-hidden p-6 md:p-12 overflow-y-auto custom-scrollbar">
            <GlobalAnalytics data={data} isExpanded={isAnalyticsOpen} />
          </div>
        </footer>
      </main>
      
      <style>{`
        .text-shadow-glow { text-shadow: 0 0 10px rgba(34, 211, 238, 0.5); }
        .text-shadow-sm { text-shadow: 0 0 6px rgba(255, 255, 255, 0.2); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
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
