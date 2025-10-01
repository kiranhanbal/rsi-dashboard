'use client';

import { useState, useEffect } from 'react';
import TokenSelector from '../components/TokenSelector';
import PriceChart from '../components/PriceChart';
import RSIChart from '../components/RSIChart';
import MetricsPanel from '../components/MetricsPanel';
import { TradeData, RSIData, SymbolInfo } from './types';

const DEFAULT_SYMBOLS: SymbolInfo[] = [
  { symbol: 'BTC', name: 'Bitcoin', currentPrice: 45300, change24h: 2.34 },
  { symbol: 'ETH', name: 'Ethereum', currentPrice: 2530, change24h: 1.56 },
  { symbol: 'SOL', name: 'Solana', currentPrice: 98, change24h: 5.23 },
  { symbol: 'DOGE', name: 'Dogecoin', currentPrice: 0.083, change24h: -0.45 },
  { symbol: 'AVAX', name: 'Avalanche', currentPrice: 36.5, change24h: 3.12 },
];

export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [rsiData, setRsiData] = useState<RSIData[]>([]);
  const [symbols, setSymbols] = useState<SymbolInfo[]>(DEFAULT_SYMBOLS);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch symbols data
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await fetch('/api/symbols');
        if (response.ok) {
          const data = await response.json();
          setSymbols(data);
        }
      } catch (err) {
        console.error('Error fetching symbols:', err);
      }
    };

    fetchSymbols();
  }, []);

  // Setup SSE connections for real-time data
  useEffect(() => {
    let tradeEventSource: EventSource | null = null;
    let rsiEventSource: EventSource | null = null;

    const connectToStreams = () => {
      try {
        // Clear previous data when symbol changes
        setTradeData([]);
        setRsiData([]);
        setLoading(true);

        // Setup trade data stream
        tradeEventSource = new EventSource(`/api/trades?symbol=${selectedSymbol}`);
        
        // Setup RSI data stream
        rsiEventSource = new EventSource(`/api/rsi?symbol=${selectedSymbol}`);

        tradeEventSource.onopen = () => {
          console.log('Trade SSE connected for', selectedSymbol);
          setIsConnected(true);
          setError(null);
          setLoading(false);
        };

        rsiEventSource.onopen = () => {
          console.log('RSI SSE connected for', selectedSymbol);
          setIsConnected(true);
          setError(null);
        };

        tradeEventSource.onmessage = (event) => {
          try {
            const newTrade: TradeData = JSON.parse(event.data);
            setTradeData(prev => {
              const updated = [...prev, newTrade];
              // Keep only last 100 data points for performance
              return updated.slice(-100);
            });
          } catch (parseError) {
            console.error('Error parsing trade data:', parseError);
          }
        };

        rsiEventSource.onmessage = (event) => {
          try {
            const newRSI: RSIData = JSON.parse(event.data);
            setRsiData(prev => {
              const updated = [...prev, newRSI];
              // Keep only last 100 data points for performance
              return updated.slice(-100);
            });
          } catch (parseError) {
            console.error('Error parsing RSI data:', parseError);
          }
        };

        tradeEventSource.onerror = (error) => {
          console.error('Trade SSE error:', error);
          setIsConnected(false);
          setError('Failed to connect to trade data stream');
          setLoading(false);
        };

        rsiEventSource.onerror = (error) => {
          console.error('RSI SSE error:', error);
          setIsConnected(false);
          setError('Failed to connect to RSI data stream');
        };

      } catch (err) {
        console.error('Error setting up SSE connections:', err);
        setError('Failed to establish data connections');
        setIsConnected(false);
        setLoading(false);
      }
    };

    connectToStreams();

    // Cleanup function
    return () => {
      if (tradeEventSource) {
        tradeEventSource.close();
      }
      if (rsiEventSource) {
        rsiEventSource.close();
      }
    };
  }, [selectedSymbol]);

  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
  };

  const filteredTradeData = tradeData.filter(trade => trade.symbol === selectedSymbol);
  const filteredRSIData = rsiData.filter(rsi => rsi.symbol === selectedSymbol);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cryptocurrency RSI Dashboard
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Real-time price monitoring and RSI analysis for major cryptocurrencies
          </p>
          
          {/* Connection Status */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <span className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {isConnected ? 'Live Data Connected' : 'Disconnected'}
            </div>
            
            {loading && (
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <span className="w-3 h-3 rounded-full mr-2 bg-blue-500 animate-pulse"></span>
                Loading Data...
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Connection Error
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Token Selector */}
        <div className="mb-8">
          <TokenSelector 
            symbols={symbols}
            selectedSymbol={selectedSymbol}
            onSymbolChange={handleSymbolChange}
          />
        </div>

        {/* Metrics Panel */}
        <div className="mb-8">
          <MetricsPanel 
            tradeData={filteredTradeData}
            rsiData={filteredRSIData}
            symbol={selectedSymbol}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Price Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <PriceChart 
              data={filteredTradeData} 
              symbol={selectedSymbol}
            />
          </div>

          {/* RSI Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <RSIChart 
              data={filteredRSIData} 
              symbol={selectedSymbol}
            />
          </div>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Trades */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Trades - {selectedSymbol}
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filteredTradeData.slice(-10).reverse().map((trade, index) => (
                <div 
                  key={`${trade.timestamp}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {trade.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">volume</p>
                  </div>
                </div>
              ))}
              {filteredTradeData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No trade data available</p>
                  <p className="text-sm mt-1">Waiting for data stream...</p>
                </div>
              )}
            </div>
          </div>

          {/* RSI History */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              RSI History - {selectedSymbol}
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filteredRSIData.slice(-10).reverse().map((rsi, index) => {
                const getRSIColor = (rsiValue: number) => {
                  if (rsiValue > 70) return 'text-red-600 bg-red-50';
                  if (rsiValue < 30) return 'text-green-600 bg-green-50';
                  return 'text-gray-600 bg-gray-50';
                };

                const getRSIIndicator = (rsiValue: number) => {
                  if (rsiValue > 70) return '🔴 Overbought';
                  if (rsiValue < 30) return '🟢 Oversold';
                  return '⚪ Neutral';
                };

                return (
                  <div 
                    key={`${rsi.timestamp}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${getRSIColor(rsi.rsi)}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg">
                        {rsi.rsi > 70 ? '🔴' : rsi.rsi < 30 ? '🟢' : '⚪'}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {rsi.rsi.toFixed(2)}
                        </p>
                        <p className="text-sm opacity-75">
                          {new Date(rsi.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {getRSIIndicator(rsi.rsi)}
                      </p>
                      <p className="text-xs opacity-75">
                        ${rsi.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {filteredRSIData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No RSI data available</p>
                  <p className="text-sm mt-1">Waiting for data stream...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            Real-time Cryptocurrency RSI Dashboard • Built with Next.js, TypeScript, and Recharts
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Data updates every 3 seconds • RSI calculated with 14-period window
          </p>
        </footer>
      </div>
    </div>
  );
}