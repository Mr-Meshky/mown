import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

import type { routing } from './routing'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'fa'
  const validLocale = (
    ['en', 'fa'].includes(locale) ? locale : 'fa'
  ) as (typeof routing.locales)[number]

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
  }
})
