import localFont from 'next/font/local'

export const peyda = localFont({
  src: [
    {
      path: './peyda-light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: './peyda-regular.ttf',
      weight: '400',
      style: 'normal',
    },

    {
      path: './peyda-medium.ttf',
      weight: '500',
      style: 'normal',
    },

    {
      path: './peyda-bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-peyda',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})
