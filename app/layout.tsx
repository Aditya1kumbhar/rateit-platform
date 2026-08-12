import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'RateIT — Trusted Reviews for Pune',
  description: 'Verified reviews for coaching classes, PGs, hostels, and local services in Pune. Check-in verified. No fake reviews.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}

        {/* Footer with legal links — required for IT Act Section 79 safe harbour */}
        <footer className="border-t border-gray-100 bg-gray-50 mt-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                © {new Date().getFullYear()} RateIT — Trusted Reviews for Pune
              </div>
              <nav className="flex flex-wrap items-center gap-4 text-sm">
                <Link href="/terms" className="text-gray-500 hover:text-gray-800 transition-colors">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="text-gray-500 hover:text-gray-800 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/moderation-policy" className="text-gray-500 hover:text-gray-800 transition-colors">
                  Moderation Policy
                </Link>
                <Link href="/grievance" className="text-gray-500 hover:text-gray-800 transition-colors">
                  Grievance Officer
                </Link>
              </nav>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
