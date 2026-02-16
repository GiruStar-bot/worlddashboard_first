// 定数・設定値

// UI形状は従来の world-atlas countries-110m と同一。Kosovo のみ id=983 を補完したローカルコピー。
export const GEO_URL = 'countries-110m-kosovo-id.json';
export const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";

export const REPORT_FILES = [
  "reports_africa.json",
  "reports_asia.json",
  "reports_europe.json",
  "reports_americas.json",
  "reports_oceania.json",
];

export const NEWS_SOURCES = [
  { id: 'bbc', name: 'BBC WORLD', url: 'http://feeds.bbci.co.uk/news/world/rss.xml',               color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20'    },
  { id: 'nyt', name: 'NYT WORLD', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',   color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
  { id: 'un',  name: 'UN NEWS',   url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
];

// countries-110m-kosovo-id.json には基本的に ISO_A3 / ADM0_A3 が含まれる。
// 例外的に id ベースで補正が必要なものだけをここで管理する。
export const GEO_ID_ISO_EXCEPTIONS = {
  '983': 'XKX',
  '548': 'VUT',
};

// 地図名ベースの補正（id が無い地物や海外領土の主権国寄せ）。
export const GEO_NAME_ISO_EXCEPTIONS = {
  'N. Cyprus': 'CYP',
  'New Caledonia': 'NCL',
};
