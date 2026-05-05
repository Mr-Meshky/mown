import type { routing } from '@/i18n/routing'

// This file augments the next-intl module with type information
// The messages type will be generated automatically when you run `next dev` or `next build`
// thanks to the createMessagesDeclaration option in next.config.ts

// We import the messages from the default locale to generate types
// The .d.json.ts file will be generated automatically by next-intl

import type messages from '../messages/en.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof messages
  }
}
