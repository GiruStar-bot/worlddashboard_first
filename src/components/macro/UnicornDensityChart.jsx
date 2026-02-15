import React, { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import DashboardCard from './DashboardCard';

const CLUSTER_COLORS = {
  'USA': '#3b82f6',
  'UK': '#6366f1',
  'Germany': '#8b5cf6',
  'Israel': '#a78bfa',
  'China': '#f43f5e',
  'India': '#10b981',
  'Japan': '#06b6d4',
  'Singapore': '#14b8a6',
  'Indonesia': '#22d3ee',
  'Brazil': '#f59e0b',
  'Nigeria': '#84cc16',
  'Kenya': '#a3e635',
};

const CustomScatterTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-xl p-3 shadow-2xl min-w-[180px]">
      <div className="border-b border-white/10 pb-1.5 mb-2">
        <p className="text-[11px] font-semibold text-slate-200 font-['Inter']">{d.region}</p>
        <p className="text-[9px] text-slate-500">{d.country}</p>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-[10px] text-slate-400">Unicorns</span>
          <span className="text-[11px] text-slate-100 font-['JetBrains_Mono',monospace]">{d.count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-slate-400">Total Valuation</span>
          <span className="text-[11px] text-slate-100 font-['JetBrains_Mono',monospace]">${d.total_valuation}B</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-slate-400">Avg Valuation</span>
          <span className="text-[11px] text-slate-100 font-['JetBrains_Mono',monospace]">${d.avg_valuation}B</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-slate-400">YoY Growth</span>
          <span className={`text-[11px] font-['JetBrains_Mono',monospace] ${d.growth_rate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {d.growth_rate >= 0 ? '+' : ''}{d.growth_rate}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default function UnicornDensityChart({ data }) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((d, i) => ({ ...d, index: i }));
  }, [data]);

  if (!data) return null;

  return (
    <DashboardCard title="Global Unicorn Density" subtitle="Tech hub comparison: count vs total valuation" source="CB Insights 2025">
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="count"
            name="Unicorn Count"
            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            label={{ value: 'Unicorn Count', position: 'insideBottom', offset: -5, style: { fontSize: 9, fill: '#64748b', fontFamily: 'Inter' } }}
          />
          <YAxis
            dataKey="total_valuation"
            name="Total Valuation ($B)"
            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Valuation ($B)', position: 'insideTopLeft', offset: 10, style: { fontSize: 9, fill: '#64748b', fontFamily: 'Inter' } }}
          />
          <ZAxis dataKey="avg_valuation" range={[40, 400]} name="Avg Valuation" />
          <Tooltip content={<CustomScatterTooltip />} />
          <Scatter data={chartData} name="Tech Hubs">
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={CLUSTER_COLORS[entry.country] || '#64748b'}
                fillOpacity={0.75}
                stroke={CLUSTER_COLORS[entry.country] || '#64748b'}
                strokeWidth={1}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
}
