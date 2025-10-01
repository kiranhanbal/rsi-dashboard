'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { RSIData } from '../app/types';

interface RSIChartProps {
  data: RSIData[];
  symbol: string;
}

export default function RSIChart({ data, symbol }: RSIChartProps) {
  const chartData = data.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    rsi: item.rsi,
    price: item.price,
    fullTimestamp: item.timestamp,
  }));

  const currentRSI = data.length > 0 ? data[data.length - 1].rsi : 50;

  const getRSIStatus = (rsi: number) => {
    if (rsi > 70) return { color: '#ef4444', status: 'Overbought', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    if (rsi < 30) return { color: '#10b981', status: 'Oversold', bgColor: 'bg-green-100', textColor: 'text-green-800' };
    return { color: '#6b7280', status: 'Neutral', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  };

  const rsiStatus = getRSIStatus(currentRSI);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">RSI Indicator</h3>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-gray-900">{currentRSI.toFixed(2)}</p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${rsiStatus.bgColor} ${rsiStatus.textColor}`}>
              {rsiStatus.status}
            </span>
          </div>
          <p className="text-sm text-gray-600">14-period RSI</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [value.toFixed(2), 'RSI']}
            labelFormatter={(label) => `Time: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label="Overbought" />
          <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label="Oversold" />
          <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="1 1" opacity={0.5} />
          <Line 
            type="monotone" 
            dataKey="rsi" 
            stroke={rsiStatus.color}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, stroke: rsiStatus.color, strokeWidth: 2, fill: 'white' }}
            name="RSI"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-600">
        <div className="text-center">
          <div className="w-full h-1 bg-red-500 rounded mb-1"></div>
          <span>Overbought (&gt;70)</span>
        </div>
        <div className="text-center">
          <div className="w-full h-1 bg-gray-400 rounded mb-1"></div>
          <span>Neutral (30-70)</span>
        </div>
        <div className="text-center">
          <div className="w-full h-1 bg-green-500 rounded mb-1"></div>
          <span>Oversold (&lt;30)</span>
        </div>
      </div>
    </div>
  );
}