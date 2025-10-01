'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { TradeData } from '../app/types';

interface PriceChartProps {
  data: TradeData[];
  symbol: string;
}

export default function PriceChart({ data, symbol }: PriceChartProps) {
  const chartData = data.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    price: item.price,
    volume: item.volume,
    fullTimestamp: item.timestamp,
  }));

  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(2)}`;
  };

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));
  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Price Movement</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{formatPrice(currentPrice)}</p>
          <p className="text-sm text-gray-600">
            Range: {formatPrice(minPrice)} - {formatPrice(maxPrice)}
          </p>
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
            tick={{ fontSize: 12 }}
            tickFormatter={formatPrice}
            domain={['dataMin - 10', 'dataMax + 10']}
          />
          <Tooltip 
            formatter={(value: number) => [formatPrice(value), 'Price']}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return `Time: ${label}`;
              }
              return label;
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
            name="Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}