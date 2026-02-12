import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, CartesianGrid,
  XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer
} from 'recharts';
import { 
  Globe, ChevronUp, ChevronDown, Activity, Maximize, Minimize, 
  X, Users, AlertTriangle, Newspaper, ExternalLink, RefreshCw, TrendingUp 
} from 'lucide-react';

/**
 * WorldDashboard v5.0 - Ultimate Stable Glass UI
 * - 最適化: 外部の地図ライブラリへの依存を完全に排除し、ビルドエラーを根絶。
 * - パフォーマンス: 座標計算をロード時に1度だけ行う「独自の軽量SVGマップエンジン」を搭載。
 * React.memoとvectorEffectの活用により、パン/ズーム時のラグを完全に解消しました。
 * - デザイン: 高密度ブラーを用いた有機的硝子UI（Glassmorphism）。
 * - 指標: 人口・GDP・成長率・リスク・政体を全表示。
 */

const PIE_COLOURS = ['#22d3ee', '#818cf8', '#f43f5e', '#fbbf24', '#34d399', '#f472b6'];
const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";
const DEFAULT_FEED = "https://feeds.bbci.co.uk/news/world/rss.xml";

// リスク値に基づくカラー計算
const getRiskColor = (risk, min, max) => {
  if (risk == null) return 'rgba(30, 41, 59, 0.4)';
  const t = (risk - min) / (max - min || 1);
  const mix = (a, b, w) => ({
    r: Math.round(a.r + (b.r - a.r) * w),
    g: Math.round(a.g + (b.g - a.g) * w),
    b: Math.round(a.b + (b.b - a.b) * w)
  });
  const cA = { r: 34, g: 211, b: 238 }; 
  const cB = { r: 129, g: 140, b: 248 }; 
  const cC = { r: 244, g: 63, b: 94 }; 
  const res = t < 0.5 ? mix(cA, cB, t / 0.5) : mix(cB, cC, (t - 0.5) / 0.5);
  return `rgb(${res.r}, ${res.g}, ${res.b})`;
};

// --- 単一の国境線を描画する軽量コンポーネント (再描画を極限まで抑える) ---
const GeoPath = React.memo(({ feature, risk, isSelected, minR, maxR, onHover, onClick }) => {
  const fillColor = getRiskColor(risk, minR, maxR);
  return (
    <path
      d={feature.pathD}
      fill={fillColor}
      stroke="rgba(255,255,255,0.15)"
      vectorEffect="non-scaling-stroke" // ズームしても線の太さを一定に保つ魔法のプロパティ
      className="transition-colors duration-300 cursor-pointer hover:fill-cyan-400 outline-none"
      onMouseEnter={(e) => onHover(feature.iso, { x: e.clientX, y: e.clientY })}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(feature.iso)}
      filter={isSelected ? 'url(#glow-filter)' : undefined}
    />
  );
});

// --- 完全独立・超軽量化 マップコンポーネント ---
const WorldMap = React.memo(({ data, onCountryClick, onHover, selectedIso }) => {
  const [geoData, setGeoData] = useState([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // GeoJSONを取得し、初期ロード時に1度だけパス（SVG）文字列に変換してキャッシュする
    fetch('https://cdn.jsdelivr.net/gh/datasets/geo-countries@master/data/countries.geojson')
      .then(res => res.json())
      .then(json => {
         const width = 1000;
         const height = 600;
         // メルカトル図法変換関数
         const mapLonLatToXY = (lon, lat) => {
           const x = (lon + 180) * (width / 360);
           const clampedLat = Math.min(Math.max(lat, -85), 85);
           const latRad = clampedLat * Math.PI / 180;
           const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
           const y = 350 - (width * mercN / (2 * Math.PI)); // 350 offset centers Europe/Africa nicely
           return { x, y };
         };

         const processedFeatures = json.features.map(feature => {
            const iso = feature.properties.ISO_A3;
            const geom = feature.geometry;
            if (!geom) return null;

            const createPath = (coords, type) => {
              if (type === 'Polygon') {
                return coords.map(ring => 
                  ring.map(([lon, lat], i) => {
                    const { x, y } = mapLonLatToXY(lon, lat);
                    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  }).join(' ') + ' Z'
                ).join(' ');
              } else if (type === 'MultiPolygon') {
                return coords.map(poly => 
                  poly.map(ring => 
                    ring.map(([lon, lat], i) => {
                      const { x, y } = mapLonLatToXY(lon, lat);
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    }).join(' ') + ' Z'
                  ).join(' ')
                ).join(' ');
              }
              return '';
            };

            return { iso, pathD: createPath(geom.coordinates, geom.type) };
         }).filter(Boolean);

         setGeoData(processedFeatures);
      })
      .catch(err => console.error("Map cartography load failed", err));
  }, []);

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

  // パン＆ズーム機能
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newY = e.clientY - dragStart.y;
    // ズームレベルに応じて上下の移動制限（黒い空間が見えないようにロック）
    const maxY = (transform.k - 1) * 300;
    const clampedY = Math.min(Math.max(newY, -maxY), maxY);
    setTransform(prev => ({ ...prev, x: e.clientX - dragStart.x, y: clampedY }));
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e) => {
    const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => {
      const newK = Math.min(Math.max(prev.k * scaleChange, 1), 8);
      // ズームアウト時にY座標が範囲外にならないよう補正
      const maxY = (newK - 1) * 300;
      const clampedY = Math.min(Math.max(prev.y, -maxY), maxY);
      return { ...prev, k: newK, y: clampedY };
    });
  };

  if (geoData.length === 0) {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-cyan-400 font-mono tracking-[0.5em] animate-pulse">
        <Activity size={40} className="mb-6 opacity-50" />
        <div>DOWNLOADING CARTOGRAPHY...</div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full h-full bg-slate-950 overflow-hidden outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <svg viewBox="0 0 1000 600" className="w-full h-full pointer-events-none">
        <defs>
          <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`} className="pointer-events-auto" style={{ transformOrigin: 'center' }}>
          {geoData.map((feature, i) => (
            <GeoPath
              key={feature.iso || i}
              feature={feature}
              risk={riskByIso[feature.iso]}
              isSelected={selectedIso === feature.iso}
              minR={minR}
              maxR={maxR}
              onHover={onHover}
              onClick={onCountryClick}
            />
          ))}
        </g>
      </svg>
    </div>
  );
});

// --- コンポーネント: 分析・ニュースパネル ---
const GlobalAnalytics = ({ data, isExpanded }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && news.length === 0) {
      setLoading(true);
      fetch(`${RSS_API}${encodeURIComponent(DEFAULT_FEED)}`)
        .then(res => res.json())
        .then(json => {
          if (json.status === "ok") setNews(json.items.slice(0, 10));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isExpanded, news.length]);

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
    <div className={`grid gap-10 h-full transition-all duration-700 ${isExpanded ? 'lg:grid-cols-12' : 'lg:grid-cols-2'}`}>
      <div className={`${isExpanded ? 'lg:col-span-8' : ''} grid md:grid-cols-2 gap-10 h-full`}>
        {/* 有機的硝子カード */}
        <div className="bg-white/[0.04] backdrop-blur-3xl p-8 border border-white/10 flex flex-col rounded-[2.5rem] shadow-2xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <h4 className="text-[11px] text-cyan-400 font-black tracking-[0.4em] mb-10 flex items-center gap-3 uppercase font-mono">
             <Activity size={16}/> ECONOMIC_SHARE
          </h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius="65%" outerRadius="90%" stroke="none" paddingAngle={8} cornerRadius={12}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />)}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingLeft: 20 }} />
                <ChartTooltip contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', color: '#fff', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-3xl p-8 border border-white/10 flex flex-col rounded-[2.5rem] shadow-2xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <h4 className="text-[11px] text-indigo-400 font-black tracking-[0.4em] mb-10 uppercase font-mono">STABILITY_ANALYSIS</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="6 6" vertical={false} />
                <XAxis type="number" dataKey="x" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{fill:'#64748b', fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="y" tick={{fill:'#64748b', fontSize:10}} axisLine={false} tickLine={false} />
                <ChartTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', color: '#fff', fontSize: 11 }} />
                <Scatter data={scatterData} fill="#818cf8" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="lg:col-span-4 bg-slate-950/50 backdrop-blur-3xl border border-white/10 flex flex-col overflow-hidden rounded-[3rem] shadow-2xl animate-in slide-in-from-right duration-700">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h4 className="text-[11px] text-cyan-400 font-black tracking-[0.5em] flex items-center gap-3 uppercase font-mono"><Newspaper size={18} /> LIVE_FEED</h4>
            {loading && <RefreshCw size={16} className="animate-spin text-cyan-400" />}
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {news.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noreferrer" className="block p-5 bg-white/[0.04] hover:bg-white/[0.1] border border-transparent hover:border-cyan-500/30 rounded-[2rem] transition-all group active:scale-[0.98] duration-300 shadow-lg">
                <div className="text-[10px] text-slate-500 mb-3 flex justify-between font-mono">
                  <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full font-black uppercase">{new Date(item.pubDate).toLocaleDateString()}</span>
                  <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
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

// --- コンポーネント: CountryDetails (負荷を劇的に下げるDOM直接操作版) ---
const CountryDetails = ({ country, onClose }) => {
  const headlineRef = useRef(null);
  
  useEffect(() => {
    if (!country || !headlineRef.current) return;
    const text = country.ui_view?.headline || '';
    let i = 0;
    
    // Reactの再描画を使わずに直接DOMを書き換えることで、地図操作の激重ラグを根絶
    headlineRef.current.innerHTML = '';
    const timer = setInterval(() => {
      i++;
      headlineRef.current.innerHTML = text.slice(0, i) + '<span class="animate-pulse text-cyan-400 font-black ml-1">|</span>';
      if (i >= text.length) clearInterval(timer);
    }, 30);
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
    <div className="p-6 bg-white/[0.04] border border-white/[0.08] rounded-[2.5rem] hover:bg-white/[0.1] transition-all duration-500 flex flex-col items-start group shadow-xl">
      <div className="text-[10px] text-slate-500 mb-4 flex items-center gap-2 uppercase font-black tracking-widest group-hover:text-slate-300 whitespace-nowrap">
        {Icon && <Icon size={14} className="opacity-60 group-hover:opacity-100 transition-opacity"/>} {label}
      </div>
      <div className={`font-mono ${color} text-2xl md:text-3xl leading-none truncate w-full font-black tracking-tighter text-shadow-glow`}>{value}</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-3xl border-l border-white/10 shadow-[-40px_0_80px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="p-10 border-b border-white/5 flex justify-between items-start bg-gradient-to-b from-white/[0.04] to-transparent shrink-0">
        <div className="space-y-4">
          <div className="text-[11px] text-cyan-400 animate-pulse tracking-[0.6em] font-black uppercase font-mono">TARGET_SCAN</div>
          <h2 className="text-4xl font-black text-white tracking-tight leading-none uppercase tracking-tighter">{master.name}</h2>
          <div className="flex gap-4 mt-5 font-mono">
             <span className="bg-cyan-500/20 text-cyan-400 text-[11px] px-4 py-1.5 rounded-full border border-cyan-500/30 uppercase font-black tracking-widest">{master.iso3}</span>
             <span className="bg-white/5 text-slate-400 text-[11px] px-4 py-1.5 rounded-full border border-white/10 uppercase font-black tracking-widest">{canonical?.politics?.regime_type || 'N/A'}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-all p-4 bg-white/[0.08] rounded-full hover:rotate-90 duration-500 shadow-2xl border border-white/10"><X size={28} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-thin">
        <div 
          ref={headlineRef}
          className="p-8 rounded-[3rem] bg-cyan-500/[0.03] border border-cyan-500/10 font-bold text-sm text-slate-200 leading-relaxed min-h-[6.5rem] shadow-inner relative overflow-hidden group"
        >
        </div>

        {/* 指標完全表示 */}
        <div className="grid grid-cols-2 gap-6">
          <GlassMetric label="Population" value={canonical?.society?.population?.value?.toLocaleString() || '0'} icon={Users} color="text-cyan-400" />
          <GlassMetric label="GDP (Nominal)" value={`$${((canonical?.economy?.gdp_nominal?.value || 0) / 1e9).toFixed(1)}B`} icon={Activity} color="text-indigo-400" />
          <GlassMetric label="GDP Growth" value={`${(canonical?.economy?.gdp_growth?.value || 0) > 0 ? '+' : ''}${canonical?.economy?.gdp_growth?.value || 0}%`} icon={TrendingUp} color={(canonical?.economy?.gdp_growth?.value || 0) >= 0 ? "text-emerald-400" : "text-rose-400"} />
          <GlassMetric label="FSI Risk" value={canonical?.risk?.fsi_total?.value?.toFixed(1) || 'N/A'} icon={AlertTriangle} color={(canonical?.risk?.fsi_total?.value || 0) > 80 ? "text-rose-500" : "text-cyan-400"} />
        </div>

        <div className="space-y-6">
          <div className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em] pl-6 font-mono">NEURAL_PARAMETER_MAP</div>
          <div className="h-80 border border-white/5 rounded-[4rem] bg-white/[0.02] p-10 shadow-2xl relative group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="85%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: '900' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Status" dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} dot={{ r: 5, fill: '#22d3ee', strokeWidth: 3 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-6 pb-8">
           {ui_view?.tags?.map(t => (
             <span key={t} className="px-5 py-2 rounded-full border border-white/10 text-[11px] text-slate-400 uppercase font-black bg-white/[0.05] hover:bg-cyan-500/10 hover:text-cyan-300 transition-all cursor-pointer shadow-xl tracking-widest font-mono">
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

  // ホバー関数とクリック関数をメモ化し、無駄な再描画を防ぐ
  const handleHover = useCallback((iso, pos) => {
    setHoverInfo(iso ? { iso3: iso, ...pos } : null);
  }, []);

  const handleCountryClick = useCallback((iso) => {
    setSelectedIso(prev => prev === iso ? null : iso);
  }, []);

  if (!data) return (
    <div className="h-screen flex flex-col items-center justify-center text-cyan-400 animate-pulse font-mono bg-slate-950 tracking-[1em]">
       <Globe size={80} className="mb-14 opacity-30 animate-spin-slow" />
       CONNECTING_NEXUS_v5.0
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 relative font-sans text-slate-200">
      <div className="absolute inset-0 pointer-events-none z-[999] opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      <div className="absolute inset-0 pointer-events-none z-[998] opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%)] bg-[length:100%_8px]"></div>
      
      <header className="absolute top-0 left-0 right-0 h-32 flex items-center px-16 justify-between z-[80] bg-gradient-to-b from-slate-950/95 to-transparent pointer-events-none shrink-0 font-mono font-black">
        <div className="flex items-center gap-8 pointer-events-auto">
          <div className="p-4 bg-cyan-500/10 rounded-[2rem] border border-cyan-500/30 backdrop-blur-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <Globe className="text-cyan-400 animate-pulse" size={36} />
          </div>
          <div>
            <h1 className="text-4xl tracking-[0.5em] text-white flex items-center gap-2 uppercase tracking-tighter">WORLD<span className="text-cyan-400 opacity-90">DASH</span></h1>
            <div className="text-[11px] text-slate-500 font-black uppercase tracking-[0.8em] mt-2 opacity-50">Global_Nexus_Optimized_v5.0</div>
          </div>
        </div>

        <button onClick={toggleFs} className="pointer-events-auto text-slate-400 hover:text-cyan-400 transition-all flex items-center gap-6 border border-white/10 px-10 py-4 rounded-full bg-white/[0.04] backdrop-blur-3xl text-[12px] font-black shadow-2xl active:scale-95 duration-300 uppercase tracking-[0.3em]">
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />} 
          {isFullscreen ? 'EXIT_LINK' : 'FULL_DEEP'}
        </button>
      </header>

      <main className="flex-1 relative">
        <div className="absolute inset-0 z-10 scale-[1.02] transform transition-transform duration-[3000ms] cubic-bezier(0.16, 1, 0.3, 1)">
          {/* React.memo化された超軽量な自前地図コンポーネントを配置 */}
          <WorldMap data={data} onCountryClick={handleCountryClick} onHover={handleHover} selectedIso={selectedIso} />
        </div>
        
        {hoverInfo && (
          <div className="fixed z-[120] px-8 py-5 bg-slate-900/90 backdrop-blur-[40px] border border-white/20 text-slate-100 font-mono pointer-events-none shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-[2rem] animate-in fade-in zoom-in-95 duration-200 font-black" style={{ left: hoverInfo.x + 30, top: hoverInfo.y + 30 }}>
            <div className="font-black text-cyan-400 text-lg border-b border-white/10 mb-4 pb-4 flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              {/* マウスホバーで国名が正確に表示される */}
              {data.regions && Object.values(data.regions).flat().find(c => c.master.iso3 === hoverInfo.iso3)?.master.name || hoverInfo.iso3}
            </div>
            <div className="opacity-40 text-[11px] tracking-[0.5em] flex justify-between gap-16"><span>NODE_ID</span><span className="text-white">{hoverInfo.iso3}</span></div>
          </div>
        )}

        <aside className={`absolute top-0 bottom-0 right-0 w-[28rem] md:w-[40rem] transform transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) z-[90] ${selectedIso ? 'translate-x-0' : 'translate-x-full'}`}>
          <CountryDetails country={data?.regions ? Object.values(data.regions).flat().find(c => c.master.iso3 === selectedIso) : null} onClose={() => setSelectedIso(null)} />
        </aside>

        <footer className={`absolute bottom-0 left-0 right-0 z-[100] bg-slate-950/70 backdrop-blur-[60px] border-t border-white/10 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isAnalyticsOpen ? 'h-[calc(100vh-8rem)] rounded-t-[6rem]' : 'h-16'} shadow-[0_-40px_100px_rgba(0,0,0,0.9)] overflow-hidden shrink-0`}>
          <button onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)} className="h-16 w-full flex items-center justify-center gap-8 text-[11px] font-black tracking-[1.5em] text-cyan-400/50 hover:text-cyan-400 transition-all shrink-0 pointer-events-auto border-b border-white/5 uppercase font-mono">
            <Activity size={20} className={`${isAnalyticsOpen ? 'animate-pulse text-cyan-400' : 'opacity-40 group-hover:opacity-100'}`} /> 
            {isAnalyticsOpen ? 'TERMINATE_HUB' : 'ACCESS_GLOBAL_STREAM'} 
            {isAnalyticsOpen ? <ChevronDown size={28} className="mt-1" /> : <ChevronUp size={28} className="mb-1" />}
          </button>
          <div className="flex-1 overflow-hidden p-12 md:p-24 overflow-y-auto custom-scrollbar font-mono uppercase font-black tracking-widest">
            <GlobalAnalytics data={data} isExpanded={isAnalyticsOpen} />
          </div>
        </footer>
      </main>
      
      <style>{`
        .text-shadow-glow { text-shadow: 0 0 25px rgba(34, 211, 238, 0.7); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 30px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.4); }
        .animate-spin-slow { animation: spin 25s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        body { background-color: #020617; }
        * { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
