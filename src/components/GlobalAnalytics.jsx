import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
} from 'recharts';

const PIE_COLOURS = ['#06b6d4', '#8b5cf6', '#ef4444', '#facc15', '#22c55e', '#e879f9'];

export default function GlobalAnalytics({ data }) {
  const countries = useMemo(() => {
    const arr = [];
    if (data && data.regions) {
      Object.values(data.regions).forEach((region) => {
        region.forEach((entry) => arr.push(entry));
      });
    }
    return arr;
  }, [data]);

  const { pieData, scatterData, xDomain, yDomain } = useMemo(() => {
    let totalGDP = 0;
    countries.forEach((c) => { totalGDP += c.canonical?.economy?.gdp_nominal?.value ?? 0; });
    
    const sorted = [...countries].sort((a, b) => (
      (b.canonical?.economy?.gdp_nominal?.value ?? 0) - (a.canonical?.economy?.gdp_nominal?.value ?? 0)
    ));
    const top5 = sorted.slice(0, 5);
    const topGDP = top5.reduce((sum, c) => sum + (c.canonical?.economy?.gdp_nominal?.value ?? 0), 0);
    const pie = top5.map((c) => ({
      name: c.master.name,
      value: c.canonical?.economy?.gdp_nominal?.value ?? 0,
    }));
    if (totalGDP - topGDP > 0) pie.push({ name: 'Rest of World', value: totalGDP - topGDP });
    
    const scatter = [];
    countries.forEach((c) => {
      const gdp = c.canonical?.economy?.gdp_nominal?.value ?? 0;
      const pop = c.canonical?.society?.population?.value ?? 0;
      if (!gdp || !pop) return;
      const x = gdp / pop;
      let y = null;
      const vdem = c.canonical?.politics?.vdem_score;
      const fsi = c.canonical?.risk?.fsi_total?.value;
      if (vdem != null) y = vdem * 100;
      else if (fsi != null) y = 100 - fsi;
      
      if (y != null && x < 150000) scatter.push({ name: c.master.name, x, y });
    });
    
    const xVals = scatter.map(d => d.x);
    const yVals = scatter.map(d => d.y);
    return { 
      pieData: pie, 
      scatterData: scatter, 
      xDomain: xVals.length ? [Math.min(...xVals), Math.max(...xVals)] : [0, 100],
      yDomain: yVals.length ? [Math.min(...yVals), Math.max(...yVals)] : [0, 100]
    };
  }, [countries]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full pb-4">
      {/* GDP Share */}
      <div className="glassmorphic p-3 flex flex-col h-full border border-white/5 relative group">
        <div className="absolute top-0 left-0 w-0.5 h-full bg-primary/30 group-hover:bg-primary transition-colors"></div>
        <h4 className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 pl-2">Global GDP Distribution</h4>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius="40%"
                outerRadius="70%"
                paddingAngle={2}
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLOURS[index % PIE_COLOURS.length]} />
                ))}
              </Pie>
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
              />
              <ChartTooltip 
                formatter={(value) => `$${(value / 1e12).toFixed(1)}T`}
                contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', color: '#e2e8f0', fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scatter Chart */}
      <div className="glassmorphic p-3 flex flex-col h-full border border-white/5 relative group">
        <div className="absolute top-0 left-0 w-0.5 h-full bg-secondary/30 group-hover:bg-secondary transition-colors"></div>
        <h4 className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 pl-2">Wealth vs Stability</h4>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                type="number" dataKey="x" name="GDP/Capita" domain={xDomain} 
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false} axisLine={false}
              />
              <YAxis 
                type="number" dataKey="y" name="Stability" domain={yDomain} 
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false} axisLine={false}
              />
              <ChartTooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', color: '#e2e8f0', fontSize: '11px' }}
                formatter={(value, name, props) => [value.toFixed(1), props.dataKey === 'x' ? 'GDP/Cap ($)' : 'Stability Score']}
              />
              <Scatter name="Countries" data={scatterData} fill="#8b5cf6" fillOpacity={0.6} shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
