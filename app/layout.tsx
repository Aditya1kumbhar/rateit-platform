import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Link from 'next/link'
import { Toaster } from '@/components/ui/sonner'
import { Navbar } from '@/components/navbar'
import { LenisProvider } from '@/components/lenis-provider'
import { UIProvider } from '@/components/ui-provider'
import { ShieldCheck, MapPin } from 'lucide-react'
import './globals.css'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rateit.in'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'RateIT: Hyperlocal Verified Reviews for Pune',
  description: 'Verified reviews for coaching classes, PGs, hostels, cafes, and local spots across FC Road, Kothrud, Hinjewadi, and Viman Nagar. GPS and EXIF verified. Zero fake reviews.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="bg-canvas text-fg flex flex-col min-h-screen selection:bg-accent-link selection:text-white antialiased font-sans" suppressHydrationWarning>
        <LenisProvider>
          <UIProvider>
            {/* Universal Sticky Glass Header */}
            <Navbar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col w-full pb-28 md:pb-12">
              {children}
            </main>

            {/* Unified Safe Harbour Footer (IT Act 2021 Compliant) */}
            <footer className="border-t border-hairline bg-surface/90 backdrop-blur-md mt-auto mb-16 md:mb-0">
              <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-fg-subtle">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-accent-tint text-accent-link flex items-center justify-center font-semibold text-xs">
                      R
                    </div>
                    <span className="font-semibold text-fg">RateIT Pune</span>
                    <span className="text-fg-subtle">•</span>
                    <span>IT Act Section 79 Intermediary Safe Harbour</span>
                  </div>

                  <nav className="flex flex-wrap items-center justify-center gap-5 text-fg-subtle">
                    <Link href="/terms" className="hover:text-accent-link transition-colors">
                      Terms of Service
                    </Link>
                    <Link href="/privacy" className="hover:text-accent-link transition-colors">
                      Privacy & DPDP
                    </Link>
                    <Link href="/moderation-policy" className="hover:text-accent-link transition-colors">
                      Moderation Policy
                    </Link>
                    <Link href="/grievance" className="hover:text-accent-link transition-colors flex items-center gap-1 text-accent-link">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Grievance Officer
                    </Link>
                  </nav>
                </div>
              </div>
            </footer>

            {/* Sonner Toaster */}
            <Toaster
              theme="dark"
              position="top-center"
              richColors
              closeButton
              toastOptions={{
                className: 'border border-hairline bg-surface-2 text-fg shadow-2xl rounded-modal',
              }}
            />
          </UIProvider>
        </LenisProvider>
      </body>
    </html>
  )
}
