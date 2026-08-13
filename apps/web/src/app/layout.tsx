import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Enterprise Intelligence Platform',
  description:
    'Unified analytics & AI assistant platform combining Backtesting, DataMart Analytics, and Retail Intelligence.',
  keywords: ['analytics', 'backtesting', 'retail intelligence', 'enterprise', 'AI'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
