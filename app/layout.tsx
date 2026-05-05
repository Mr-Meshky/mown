import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { geist } from '@/lib/fonts/geist'
import { peyda } from '@/lib/fonts/peyda'
import './globals.css'

export const metadata: Metadata = {
  title: 'موان (Mown) — دانلود یوتیوب با گیت‌هاب',
  description:
    'موان برای دانلود ویدیوهای یوتیوب بدون نیاز به VPN با استفاده از زیرساخت گیت‌هاب. رابط کاربری ساده و سرعت بالا.',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8f8' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const dir = locale === 'fa' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} className="bg-background" suppressHydrationWarning>
      <body className={`${peyda.variable} ${geist.variable} font-sans antialiased`}>
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
