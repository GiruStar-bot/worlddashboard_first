import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import DashboardCard from './DashboardCard';
import CustomTooltip from './CustomTooltip';

export default function FDIFlowChart({ data }) {
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
    <DashboardCard title="Foreign Direct Investment Flows" subtitle="Inflows (positive) vs outflows (negative) by bloc" source="IMF 2025" className="col-span-full">
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-fdi-north-in" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="grad-fdi-north-out" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="grad-fdi-south-in" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="grad-fdi-south-out" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.1} />
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
            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            label={{ value: '$B', position: 'insideTopLeft', offset: 10, style: { fontSize: 9, fill: '#64748b' } }}
          />
          <Tooltip content={<CustomTooltip unitOverride="$B" previousDataLookup={previousLookup} />} />
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: 'Inter' }}
            iconType="circle"
            iconSize={6}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <Bar dataKey="global_north_inflow" name="North Inflow" fill="url(#grad-fdi-north-in)" stackId="north" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="global_north_outflow" name="North Outflow" fill="url(#grad-fdi-north-out)" stackId="north" radius={[0, 0, 4, 4]} />
          <Bar dataKey="global_south_inflow" name="South Inflow" fill="url(#grad-fdi-south-in)" stackId="south" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="global_south_outflow" name="South Outflow" fill="url(#grad-fdi-south-out)" stackId="south" radius={[0, 0, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
}
