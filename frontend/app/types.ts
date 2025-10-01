export interface TradeData {
  timestamp: string;
  price: number;
  volume: number;
  symbol: string;
}

export interface RSIData {
  timestamp: string;
  symbol: string;
  rsi: number;
  price: number;
  period: number;
}

export interface SymbolInfo {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
}