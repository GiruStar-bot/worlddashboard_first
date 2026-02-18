import React from 'react';

// レイヤーごとのデータソース定義
const DATA_SOURCES = {
  fsi: {
    title: "Geopolitical Risk & Stability",
    providers: "Fragile States Index 2026 (FFP), ACLED Conflict Data",
    lastVerified: "2026-02"
  },
  china: {
    title: "China Influence Index v1.1",
    providers: "IMF IMTS, UN Comtrade, AidData, MFA China, AIIB",
    lastVerified: "2026-02"
  },
  us: {
    title: "US Influence Index v1.1",
    providers: "IMF, NATO, DoD, US Treasury (TIC), IEA, USGS",
    lastVerified: "2026-02"
  },
  resources: {
    title: "Global Resource Risk GNR-PRI",
    providers: "USGS (2025), Energy Institute (2024), World Bank, IEA",
    lastVerified: "2026-02"
  },
  default: {
    title: "Global Macroeconomic Data",
    providers: "IMF World Economic Outlook, World Bank WDI, UN Data, V-Dem",
    lastVerified: "2026-01"
  }
};

const DataSourceCredits = ({ activeLayer }) => {
  // activeLayerがnullまたは未定義の場合はdefaultを使用
  const currentKey = activeLayer && DATA_SOURCES[activeLayer] ? activeLayer : 'default';
  const data = DATA_SOURCES[currentKey];

  return (
    <div className="absolute bottom-2 left-2 z-20 pointer-events-none select-none">
      <div className="text-[10px] text-slate-500/60 font-mono leading-tight">
        <div className="font-semibold opacity-70">
          {data.title}
        </div>
        <div className="opacity-50">
          Sources: {data.providers}
        </div>
        <div className="opacity-40 text-[9px]">
          Verified: {data.lastVerified}
        </div>
      </div>
    </div>
  );
};

export default DataSourceCredits;
