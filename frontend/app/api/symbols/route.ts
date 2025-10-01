import { NextResponse } from 'next/server';

export async function GET() {
  const symbols = [
    { symbol: 'BTC', name: 'Bitcoin', currentPrice: 45300, change24h: 2.34 },
    { symbol: 'ETH', name: 'Ethereum', currentPrice: 2530, change24h: 1.56 },
    { symbol: 'SOL', name: 'Solana', currentPrice: 98, change24h: 5.23 },
    { symbol: 'DOGE', name: 'Dogecoin', currentPrice: 0.083, change24h: -0.45 },
    { symbol: 'AVAX', name: 'Avalanche', currentPrice: 36.5, change24h: 3.12 },
  ];

  return NextResponse.json(symbols);
}