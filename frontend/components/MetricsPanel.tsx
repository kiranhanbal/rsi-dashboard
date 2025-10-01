'use client';

import { TradeData, RSIData } from '../app/types';

interface MetricsPanelProps {
  tradeData: TradeData[];
  rsiData: RSIData[];
  symbol: string;
}

export default function MetricsPanel({ tradeData, rsiData, symbol }: MetricsPanelProps) {
  const currentTrade = tradeData.length > 0 ? tradeData[tradeData.length - 1] : null;
  const currentRSI = rsiData.length > 0 ? rsiData[rsiData.length - 1] : null;

  const priceChange = tradeData.length >= 2 
    ? currentTrade!.price - tradeData[tradeData.length - 2].price
    : 0;

  const priceChangePercent = tradeData.length >= 2 && tradeData[tradeData.length - 2].price !== 0
    ? (priceChange / tradeData[tradeData.length - 2].price) * 100
    : 0;

  const getRSIStatus = (rsi: number) => {
    if (rsi > 70) return { color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', status: 'Overbought' };
    if (rsi < 30) return { color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', status: 'Oversold' };
    return { color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', status: 'Neutral' };
  };

  const rsiStatus = currentRSI ? getRSIStatus(currentRSI.rsi) : getRSIStatus(50);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Current Price */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Current Price</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {currentTrade ? `$${currentTrade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
            </p>
          </div>
          <div className={`text-right ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <p className="text-sm font-medium">
              {priceChange >= 0 ? '↗' : '↘'} {Math.abs(priceChange).toFixed(2)}
            </p>
            <p className="text-sm">
              {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* RSI Value */}
      <div className={`bg-white rounded-xl shadow-lg p-6 border ${rsiStatus.borderColor}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">RSI (14)</p>
            <p className={`text-2xl font-bold mt-1 ${rsiStatus.color}`}>
              {currentRSI ? currentRSI.rsi.toFixed(2) : '--'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${rsiStatus.bgColor} ${rsiStatus.color}`}>
            {rsiStatus.status}
          </div>
        </div>
      </div>

      {/* Volume */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <p className="text-sm font-medium text-gray-600">24h Volume</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {currentTrade ? `${currentTrade.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '--'}
        </p>
        <p className="text-sm text-gray-600 mt-1">{symbol}</p>
      </div>

      {/* Signal */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <p className="text-sm font-medium text-gray-600">Trading Signal</p>
        <p className={`text-lg font-bold mt-1 ${
          currentRSI ? 
            currentRSI.rsi > 70 ? 'text-red-600' :
            currentRSI.rsi < 30 ? 'text-green-600' :
            'text-yellow-600'
          : 'text-gray-600'
        }`}>
          {currentRSI ? 
            currentRSI.rsi > 70 ? 'SELL' :
            currentRSI.rsi < 30 ? 'BUY' :
            'HOLD'
          : '--'
          }
        </p>
        <p className="text-sm text-gray-600 mt-1">Based on RSI</p>
      </div>
    </div>
  );
}