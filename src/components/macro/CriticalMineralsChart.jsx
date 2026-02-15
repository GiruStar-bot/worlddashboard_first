import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Lithium', value: 85, color: '#3b82f6' }, // Blue
  { name: 'Cobalt', value: 65, color: '#8b5cf6' },  // Purple
  { name: 'Nickel', value: 45, color: '#10b981' },  // Emerald
  { name: 'Rare Earth', value: 92, color: '#f59e0b' }, // Amber
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-slate-700 p-2 rounded shadow-xl text-xs">
        <p className="font-bold text-slate-200 mb-1">{label}</p>
        <p className="text-slate-300">
          Dependency: <span className="font-mono text-white">{payload[0].value}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CriticalMineralsChart = () => {
  return (
    <div className="w-full h-full min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            width={70}
            axisLine={false}
            tickLine={false}
          />
          {/* 変更点: cursor={false} を設定してホバー時の背景発光を削除 */}
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CriticalMineralsChart;
