'use client';

interface SymbolInfo {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
}

interface TokenSelectorProps {
  symbols: SymbolInfo[];
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

export default function TokenSelector({ symbols, selectedSymbol, onSymbolChange }: TokenSelectorProps) {
  const selectedSymbolInfo = symbols.find(s => s.symbol === selectedSymbol);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Select Token</h2>
          <p className="text-sm text-gray-600">Choose a cryptocurrency to monitor</p>
        </div>
        
        <div className="flex items-center gap-4">
          {selectedSymbolInfo && (
            <div className="hidden sm:block text-right">
              <p className="text-sm text-gray-600">Current Price</p>
              <p className="text-lg font-bold text-gray-900">
                ${selectedSymbolInfo.currentPrice.toLocaleString()}
              </p>
              <p className={`text-sm font-medium ${
                selectedSymbolInfo.change24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedSymbolInfo.change24h >= 0 ? '↗' : '↘'} {Math.abs(selectedSymbolInfo.change24h)}%
              </p>
            </div>
          )}
          
          <select
            value={selectedSymbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            className="block w-full sm:w-48 px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
          >
            {symbols.map((symbolInfo) => (
              <option key={symbolInfo.symbol} value={symbolInfo.symbol}>
                {symbolInfo.name} ({symbolInfo.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}