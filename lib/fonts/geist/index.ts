import localFont from 'next/font/local'

export const geist = localFont({
  src: [
    {
      path: './Geist-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: './Geist-ThinItalic.woff2',
      weight: '100',
      style: 'italic',
    },
    {
      path: './Geist-ExtraLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: './Geist-ExtraLightItalic.woff2',
      weight: '200',
      style: 'italic',
    },
    {
      path: './Geist-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './Geist-LightItalic.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: './Geist-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './Geist-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './Geist-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './Geist-MediumItalic.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: './Geist-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './Geist-SemiBoldItalic.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: './Geist-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './Geist-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: './Geist-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: './Geist-ExtraBoldItalic.woff2',
      weight: '800',
      style: 'italic',
    },
    {
      path: './Geist-Black.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: './Geist-BlackItalic.woff2',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-geist',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})
