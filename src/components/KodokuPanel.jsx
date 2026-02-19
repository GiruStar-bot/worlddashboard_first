import React, { useEffect, useState } from 'react';

const KODOKU_DATA_URL = 'https://girustar-bot.github.io/worlddashboard-data/public/data/kodoku_reports.json';

const KodokuPanel = ({ onRouteSelect }) => {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState('');

  useEffect(() => {
    fetch(KODOKU_DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setReport(data);
        if (data.routes?.length > 0) {
          setSelectedRouteId(data.routes[0].id);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const selectedRoute = report?.routes?.find((r) => r.route_id === selectedRouteId);

  const handleChange = (e) => {
    const routeId = e.target.value;
    setSelectedRouteId(routeId);
    onRouteSelect?.(routeId);
  };

  // Notify parent of initial selection
  useEffect(() => {
    if (selectedRouteId) {
      onRouteSelect?.(selectedRouteId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteId]);

  const getSurvivalColor = (rate) => {
    if (rate >= 90) return 'text-cyan-400';
    if (rate >= 70) return 'text-yellow-400';
    return 'text-red-500 animate-pulse';
  };

  return (
    <div className="w-[340px] max-h-[420px] overflow-y-auto bg-black/90 border border-red-900/50 rounded-sm shadow-[0_0_20px_rgba(127,29,29,0.4)] p-3 font-mono text-[11px]">
      {/* Header */}
      <div className="text-red-500 font-bold tracking-widest text-[10px] mb-2 border-b border-red-900/40 pb-1">
        [ KODOKU ENGINE ] — SUPPLY CHAIN SURVIVAL MODEL
      </div>

      {error && (
        <div className="text-red-400 text-[10px] py-2">
          DATA LINK FAILURE: {error}
        </div>
      )}

      {!report && !error && (
        <div className="text-slate-500 text-[10px] py-4 text-center animate-pulse">
          CONNECTING TO KODOKU ENGINE...
        </div>
      )}

      {report && (
        <>
          {/* Timestamp */}
          <div className="text-slate-600 text-[9px] mb-2">
            GENERATED: {report.generated_at || 'N/A'}
          </div>

          {/* Route selector */}
          <select
            value={selectedRouteId}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-[10px] px-2 py-1 rounded-sm mb-3 focus:outline-none focus:border-red-700 cursor-pointer"
          >
            {report.routes?.map((route) => (
              <option key={route.route_id} value={route.route_id}>
                {route.route_name}
              </option>
            ))}
          </select>

          {selectedRoute && (
            <div className="space-y-3">
              {/* Survival Rate */}
              <div>
                <div className="text-slate-500 text-[9px] tracking-wider mb-0.5">SURVIVAL RATE</div>
                <div className={`text-3xl font-black tracking-tight ${getSurvivalColor(selectedRoute.survival_rate)}`}>
                  {selectedRoute.survival_rate}%
                </div>
              </div>

              {/* Critical Node */}
              {selectedRoute.critical_node && (
                <div>
                  <div className="text-slate-500 text-[9px] tracking-wider mb-0.5">CRITICAL NODE</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-orange-400 font-bold text-xs">
                      {selectedRoute.critical_node.name}
                    </span>
                    <span className="text-red-400 text-[10px]">
                      BLOCKADE RISK: {selectedRoute.critical_node.blockade_risk}%
                    </span>
                  </div>
                </div>
              )}

              {/* Insight */}
              {selectedRoute.insight && (
                <div>
                  <div className="text-slate-500 text-[9px] tracking-wider mb-0.5">INSIGHT</div>
                  <p className="font-mono text-[10px] text-slate-300 leading-relaxed">
                    {selectedRoute.insight}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KodokuPanel;
