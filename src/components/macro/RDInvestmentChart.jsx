import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import DashboardCard from './DashboardCard';
import CustomTooltip from './CustomTooltip';

const COUNTRIES = [
  { key: 'israel', name: 'Israel', color: '#a855f7' },
  { key: 'south_korea', name: 'South Korea', color: '#06b6d4' },
  { key: 'usa', name: 'USA', color: '#3b82f6' },
  { key: 'japan', name: 'Japan', color: '#f43f5e' },
  { key: 'china', name: 'China', color: '#f59e0b' },
  { key: 'eu', name: 'EU', color: '#10b981' },
  { key: 'india', name: 'India', color: '#84cc16' },
];

export default function RDInvestmentChart({ data }) {
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
    <DashboardCard title="R&D Investment Intensity" subtitle="Research spending as percentage of GDP" source="WIPO 2025">
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
            label={{ value: '% GDP', position: 'insideTopLeft', offset: 10, style: { fontSize: 9, fill: '#64748b' } }}
          />
          <Tooltip content={<CustomTooltip unitOverride="%" previousDataLookup={previousLookup} />} />
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: 'Inter' }}
            iconType="circle"
            iconSize={6}
          />
          {COUNTRIES.map(c => (
            <Line
              key={c.key}
              type="monotone"
              dataKey={c.key}
              name={c.name}
              stroke={c.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: c.color, strokeWidth: 2, fill: '#0f172a' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
}
