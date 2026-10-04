import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AutoCare · Workshop operations, simplified',
  description:
    'A modern vehicle service management platform for bookings, vehicles, customers, and workshop operations.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#101820',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}