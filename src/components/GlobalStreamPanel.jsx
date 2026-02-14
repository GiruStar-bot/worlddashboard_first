import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { RSS_API, NEWS_SOURCES } from '../constants/isoMap';

// 個別フィードカラム
const FeedColumn = ({ source, isExpanded }) => {
  const [news, setNews]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && news.length === 0) {
      setLoading(true);
      fetch(`${RSS_API}${encodeURIComponent(source.url)}`)
        .then(res => res.json())
        .then(json => {
          if (json.status === "ok") setNews(json.items.slice(0, 8));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isExpanded, news.length, source.url]);

  return (
    <div className="flex flex-col h-full bg-white/[0.02] border border-white/10 rounded-3xl shadow-xl overflow-hidden relative">
      {/* ヘッダー */}
      <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] z-10 shrink-0">
        <h4 className={`text-[10px] ${source.color} font-bold tracking-[0.3em] flex items-center gap-2 uppercase font-mono`}>
          <Newspaper size={14} /> {source.name}
        </h4>
        {loading && <RefreshCw size={12} className={`animate-spin ${source.color}`} />}
      </div>

      {/* ニュース一覧 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar z-10">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="block p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-transparent hover:border-white/10 rounded-2xl transition-all group active:scale-[0.98]"
          >
            <div className="text-[9px] text-slate-500 mb-2 flex justify-between font-mono items-center">
              <span className={`${source.bg} ${source.color} px-2 py-0.5 rounded-full font-bold border ${source.border}`}>
                {new Date(item.pubDate).toLocaleDateString()}
              </span>
              <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h5 className="text-xs font-medium text-slate-300 group-hover:text-white leading-snug transition-colors line-clamp-3">
              {item.title}
            </h5>
          </a>
        ))}
      </div>
    </div>
  );
};

// グローバルストリームパネル全体
const GlobalStreamPanel = ({ isExpanded }) => {
  return (
    <div className={`grid gap-6 h-full transition-all duration-700 w-full ${isExpanded ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 opacity-0'}`}>
      {NEWS_SOURCES.map((source) => (
        <FeedColumn key={source.id} source={source} isExpanded={isExpanded} />
      ))}
    </div>
  );
};

export default GlobalStreamPanel;
