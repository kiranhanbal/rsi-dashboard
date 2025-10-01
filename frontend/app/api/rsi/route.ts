import { NextRequest } from 'next/server';

// Mock RSI data
const mockRSIData: Record<string, Array<{ timestamp: string; rsi: number; price: number; symbol: string; period: number }>> = {
  BTC: [
    { timestamp: '2024-01-01T10:00:00Z', rsi: 45.2, price: 45000, symbol: 'BTC', period: 14 },
    { timestamp: '2024-01-01T10:01:00Z', rsi: 47.8, price: 45100, symbol: 'BTC', period: 14 },
    { timestamp: '2024-01-01T10:02:00Z', rsi: 43.5, price: 44950, symbol: 'BTC', period: 14 },
    { timestamp: '2024-01-01T10:03:00Z', rsi: 49.1, price: 45200, symbol: 'BTC', period: 14 },
    { timestamp: '2024-01-01T10:04:00Z', rsi: 51.3, price: 45300, symbol: 'BTC', period: 14 },
  ],
  ETH: [
    { timestamp: '2024-01-01T10:00:00Z', rsi: 52.1, price: 2500, symbol: 'ETH', period: 14 },
    { timestamp: '2024-01-01T10:01:00Z', rsi: 54.3, price: 2510, symbol: 'ETH', period: 14 },
    { timestamp: '2024-01-01T10:02:00Z', rsi: 49.8, price: 2495, symbol: 'ETH', period: 14 },
    { timestamp: '2024-01-01T10:03:00Z', rsi: 56.7, price: 2520, symbol: 'ETH', period: 14 },
    { timestamp: '2024-01-01T10:04:00Z', rsi: 58.2, price: 2530, symbol: 'ETH', period: 14 },
  ],
  SOL: [
    { timestamp: '2024-01-01T10:00:00Z', rsi: 61.5, price: 95, symbol: 'SOL', period: 14 },
    { timestamp: '2024-01-01T10:01:00Z', rsi: 63.2, price: 96, symbol: 'SOL', period: 14 },
    { timestamp: '2024-01-01T10:02:00Z', rsi: 59.8, price: 94.5, symbol: 'SOL', period: 14 },
    { timestamp: '2024-01-01T10:03:00Z', rsi: 65.1, price: 97, symbol: 'SOL', period: 14 },
    { timestamp: '2024-01-01T10:04:00Z', rsi: 67.4, price: 98, symbol: 'SOL', period: 14 },
  ],
  DOGE: [
    { timestamp: '2024-01-01T10:00:00Z', rsi: 38.7, price: 0.08, symbol: 'DOGE', period: 14 },
    { timestamp: '2024-01-01T10:01:00Z', rsi: 41.2, price: 0.081, symbol: 'DOGE', period: 14 },
    { timestamp: '2024-01-01T10:02:00Z', rsi: 36.5, price: 0.079, symbol: 'DOGE', period: 14 },
    { timestamp: '2024-01-01T10:03:00Z', rsi: 43.8, price: 0.082, symbol: 'DOGE', period: 14 },
    { timestamp: '2024-01-01T10:04:00Z', rsi: 46.1, price: 0.083, symbol: 'DOGE', period: 14 },
  ],
  AVAX: [
    { timestamp: '2024-01-01T10:00:00Z', rsi: 55.3, price: 35, symbol: 'AVAX', period: 14 },
    { timestamp: '2024-01-01T10:01:00Z', rsi: 57.6, price: 35.5, symbol: 'AVAX', period: 14 },
    { timestamp: '2024-01-01T10:02:00Z', rsi: 53.2, price: 34.8, symbol: 'AVAX', period: 14 },
    { timestamp: '2024-01-01T10:03:00Z', rsi: 59.4, price: 36, symbol: 'AVAX', period: 14 },
    { timestamp: '2024-01-01T10:04:00Z', rsi: 62.1, price: 36.5, symbol: 'AVAX', period: 14 },
  ],
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'BTC';

  let encoder = new TextEncoder();
  let interval: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial historical RSI data
      const historicalRSI = mockRSIData[symbol] || mockRSIData.BTC;
      historicalRSI.forEach(rsiData => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(rsiData)}\n\n`));
      });

      // Simulate real-time RSI updates
      interval = setInterval(() => {
        const lastRSI = historicalRSI[historicalRSI.length - 1].rsi;
        const newRSI = Math.max(0, Math.min(100, lastRSI + (Math.random() - 0.5) * 4)); // RSI between 0-100
        
        const lastPrice = historicalRSI[historicalRSI.length - 1].price;
        const newPrice = lastPrice * (1 + (Math.random() - 0.5) * 0.002);

        const newRSIData = {
          timestamp: new Date().toISOString(),
          rsi: parseFloat(newRSI.toFixed(2)),
          price: parseFloat(newPrice.toFixed(2)),
          symbol: symbol,
          period: 14
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(newRSIData)}\n\n`));
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