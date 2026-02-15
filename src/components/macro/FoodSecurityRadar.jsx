import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend, ResponsiveContainer, Tooltip
} from 'recharts';
import DashboardCard from './DashboardCard';

const AXES = [
  { key: 'grain_self_sufficiency', label: 'Grain Self-sufficiency' },
  { key: 'water_stress', label: 'Water Stress' },
  { key: 'fertilizer_dependence', label: 'Fertilizer Dep.' },
  { key: 'export_capacity', label: 'Export Capacity' },
  { key: 'arable_land_per_capita', label: 'Arable Land/Capita' },
  { key: 'storage_infrastructure', label: 'Storage Infra.' },
];

const REGION_COLORS = {
  'G7': { stroke: '#3b82f6', fill: '#3b82f6' },
  'BRICS': { stroke: '#f43f5e', fill: '#f43f5e' },
  'ASEAN': { stroke: '#10b981', fill: '#10b981' },
  'Sub-Saharan Africa': { stroke: '#f59e0b', fill: '#f59e0b' },
  'MENA': { stroke: '#a855f7', fill: '#a855f7' },
};

export default function FoodSecurityRadar({ data }) {
  if (!data || !data.regions) return null;

  const radarData = AXES.map(axis => {
    const point = { axis: axis.label };
    data.regions.forEach(region => {
      point[region.region] = region[axis.key];
    });
    return point;
  });

  return (
    <DashboardCard title="Food Security Index" subtitle="Regional comparison across key dimensions" source="FAO / IMF 2025">
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'Inter' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 8, fill: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              backdropFilter: 'blur(12px)',
            }}
            itemStyle={{ color: '#e2e8f0', padding: '1px 0' }}
            labelStyle={{ color: '#94a3b8', fontFamily: 'Inter', fontWeight: 600, fontSize: '11px' }}
          />
          {data.regions.map(region => {
            const colors = REGION_COLORS[region.region] || { stroke: '#64748b', fill: '#64748b' };
            return (
              <Radar
                key={region.region}
                name={region.region}
                dataKey={region.region}
                stroke={colors.stroke}
                fill={colors.fill}
                fillOpacity={0.1}
                strokeWidth={1.5}
              />
            );
          })}
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: 'Inter', paddingTop: 8 }}
            iconType="circle"
            iconSize={6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
}
