import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { getLocale } from 'next-intl/server'
import './globals.css'
import { peyda } from '@/lib/peyda'

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'موان (Mown) — دانلود یوتیوب با گیت‌هاب',
  description:
    'دانلود ویدیوهای یوتیوب بدون نیاز به VPN با استفاده از زیرساخت گیت‌هاب. رابط کاربری ساده و سرعت بالا.',
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
      <body className={`${peyda.variable} ${geistMono.variable} font-sans antialiased`}>
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
