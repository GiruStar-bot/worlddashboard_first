import React, { useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import DashboardCard from './DashboardCard';
import CustomTooltip from './CustomTooltip';

export default function HydrogenGrowthChart({ data }) {
  const previousLookup = useMemo(() => {
    if (!data) return () => null;
    const byYear = {};
    data.forEach(d => { byYear[d.year] = d; });
    return (key, yearLabel) => {
      const prevYear = parseInt(yearLabel) - 1;
      return byYear[prevYear] ? byYear[prevYear][key] : null;
    };
  }, [data]);

  if (!data) return null;

  return (
    <DashboardCard title="Clean Hydrogen Growth" subtitle="Production volume vs cost reduction trajectory" source="IEA 2025">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-h2-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Mt', position: 'insideTopLeft', offset: 10, style: { fontSize: 9, fill: '#64748b' } }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 8]}
            label={{ value: '$/kg', position: 'insideTopRight', offset: 10, style: { fontSize: 9, fill: '#64748b' } }}
          />
          <Tooltip content={<CustomTooltip previousDataLookup={previousLookup} />} />
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: 'Inter' }}
            iconType="circle"
            iconSize={6}
          />
          <Bar
            yAxisId="left"
            dataKey="production_mt"
            name="Production (Mt)"
            fill="url(#grad-h2-bar)"
            radius={[4, 4, 0, 0]}
            barSize={24}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cost_per_kg"
            name="Cost ($/kg)"
            stroke="#f43f5e"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: '#f43f5e', strokeWidth: 2, fill: '#0f172a' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
}
