import { NextRequest } from 'next/server';

// Mock data for demonstration
const mockTradeData: Record<string, Array<{ timestamp: string; price: number; volume: number; symbol: string }>> = {
  BTC: [
    { timestamp: '2024-01-01T10:00:00Z', price: 45000, volume: 2.5, symbol: 'BTC' },
    { timestamp: '2024-01-01T10:01:00Z', price: 45100, volume: 1.8, symbol: 'BTC' },
    { timestamp: '2024-01-01T10:02:00Z', price: 44950, volume: 3.2, symbol: 'BTC' },
    { timestamp: '2024-01-01T10:03:00Z', price: 45200, volume: 2.1, symbol: 'BTC' },
    { timestamp: '2024-01-01T10:04:00Z', price: 45300, volume: 1.5, symbol: 'BTC' },
  ],
  ETH: [
    { timestamp: '2024-01-01T10:00:00Z', price: 2500, volume: 15.2, symbol: 'ETH' },
    { timestamp: '2024-01-01T10:01:00Z', price: 2510, volume: 12.8, symbol: 'ETH' },
    { timestamp: '2024-01-01T10:02:00Z', price: 2495, volume: 18.3, symbol: 'ETH' },
    { timestamp: '2024-01-01T10:03:00Z', price: 2520, volume: 14.7, symbol: 'ETH' },
    { timestamp: '2024-01-01T10:04:00Z', price: 2530, volume: 11.9, symbol: 'ETH' },
  ],
  SOL: [
    { timestamp: '2024-01-01T10:00:00Z', price: 95, volume: 2500, symbol: 'SOL' },
    { timestamp: '2024-01-01T10:01:00Z', price: 96, volume: 2200, symbol: 'SOL' },
    { timestamp: '2024-01-01T10:02:00Z', price: 94.5, volume: 2800, symbol: 'SOL' },
    { timestamp: '2024-01-01T10:03:00Z', price: 97, volume: 2100, symbol: 'SOL' },
    { timestamp: '2024-01-01T10:04:00Z', price: 98, volume: 1900, symbol: 'SOL' },
  ],
  DOGE: [
    { timestamp: '2024-01-01T10:00:00Z', price: 0.08, volume: 500000, symbol: 'DOGE' },
    { timestamp: '2024-01-01T10:01:00Z', price: 0.081, volume: 450000, symbol: 'DOGE' },
    { timestamp: '2024-01-01T10:02:00Z', price: 0.079, volume: 520000, symbol: 'DOGE' },
    { timestamp: '2024-01-01T10:03:00Z', price: 0.082, volume: 480000, symbol: 'DOGE' },
    { timestamp: '2024-01-01T10:04:00Z', price: 0.083, volume: 420000, symbol: 'DOGE' },
  ],
  AVAX: [
    { timestamp: '2024-01-01T10:00:00Z', price: 35, volume: 15000, symbol: 'AVAX' },
    { timestamp: '2024-01-01T10:01:00Z', price: 35.5, volume: 12000, symbol: 'AVAX' },
    { timestamp: '2024-01-01T10:02:00Z', price: 34.8, volume: 18000, symbol: 'AVAX' },
    { timestamp: '2024-01-01T10:03:00Z', price: 36, volume: 14000, symbol: 'AVAX' },
    { timestamp: '2024-01-01T10:04:00Z', price: 36.5, volume: 11000, symbol: 'AVAX' },
  ],
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'BTC';

  let encoder = new TextEncoder();
  let interval: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial historical data
      const historicalData = mockTradeData[symbol] || mockTradeData.BTC;
      historicalData.forEach(trade => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(trade)}\n\n`));
      });

      // Simulate real-time updates
      interval = setInterval(() => {
        const lastPrice = historicalData[historicalData.length - 1].price;
        const newPrice = lastPrice * (1 + (Math.random() - 0.5) * 0.002); // ±0.1% change
        const newTrade = {
          timestamp: new Date().toISOString(),
          price: parseFloat(newPrice.toFixed(2)),
          volume: parseFloat((Math.random() * 10).toFixed(2)),
          symbol: symbol
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(newTrade)}\n\n`));
      }, 3000);
    },
    cancel() {
      if (interval) {
        clearInterval(interval);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}