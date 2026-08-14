import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Synora — Enterprise Intelligence Reimagined',
  description: 'Premium AI-powered analytics platform for enterprise data intelligence',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
