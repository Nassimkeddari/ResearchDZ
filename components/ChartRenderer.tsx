
import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface ChartConfig {
  type: 'bar' | 'line';
  title: string;
  data: ChartDataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

interface ChartRendererProps {
  config: string;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ config }) => {
  let parsedConfig: ChartConfig;
  
  try {
    parsedConfig = JSON.parse(config);
  } catch (e) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-medium">
        Error parsing visualization data.
      </div>
    );
  }

  const { type, title, data, xAxisLabel, yAxisLabel } = parsedConfig;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs">
          <p className="font-bold text-slate-800 mb-1">{label}</p>
          <p className="text-indigo-600 font-black">
            {yAxisLabel || 'Count'}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="my-6 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded">
          {type === 'bar' ? 'Frequency Distribution' : 'Trend Analysis'}
        </span>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#4f46e5" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartRenderer;
