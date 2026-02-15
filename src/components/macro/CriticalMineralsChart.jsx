import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import DashboardCard from './DashboardCard';
import CustomTooltip from './CustomTooltip';

const MINERALS = [
  { key: 'lithium', label: 'リチウム' },
  { key: 'cobalt', label: 'コバルト' },
  { key: 'rare_earths', label: 'レアアース' },
];

const CHINA_COLOR = '#f43f5e';
const DEFAULT_GRADIENT = ['#f59e0b', '#eab308'];

export default function CriticalMineralsChart({ data }) {
  const [activeMineral, setActiveMineral] = useState('rare_earths');

  if (!data) return null;

  const mineralData = data[activeMineral] || [];

  return (
    <DashboardCard title="重要鉱物供給の集中度" subtitle="世界シェア上位生産国（%）" source="USGS 2025">
      <div className="flex gap-1.5 mb-3">
        {MINERALS.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMineral(m.key)}
            className={`px-2.5 py-1 text-[10px] font-['Inter'] rounded-md border transition-all ${
              activeMineral === m.key
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={mineralData}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="grad-mineral-default" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={DEFAULT_GRADIENT[0]} stopOpacity={0.8} />
              <stop offset="100%" stopColor={DEFAULT_GRADIENT[1]} stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="grad-mineral-china" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={CHINA_COLOR} stopOpacity={0.9} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 'auto']}
            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="country"
            width={75}
            tick={{ fontSize: 10, fill: '#cbd5e1', fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          {/* UI改善: 白く光る背景(cursor)を削除し、透明に設定 
            これによりグラフの色の視認性を確保
          */}
          <Tooltip 
            cursor={{ fill: 'transparent' }} 
            content={<CustomTooltip unitOverride="%" />} 
          />
          {/* UI改善: activeBarを追加
            ホバー時にバー自体に白い枠線を表示し、選択状態を明確化
          */}
          <Bar 
            dataKey="share" 
            name="世界シェア" 
            radius={[0, 6, 6, 0]} 
            barSize={18}
            activeBar={{ stroke: '#ffffff', strokeWidth: 1, fillOpacity: 1 }}
          >
            {mineralData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.country === 'China' ? 'url(#grad-mineral-china)' : 'url(#grad-mineral-default)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
}
