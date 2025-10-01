import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cryptocurrency RSI Dashboard',
  description: 'Real-time price and RSI monitoring dashboard for cryptocurrencies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}