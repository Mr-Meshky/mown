import { useTranslations } from 'next-intl'

import { HomeClient } from '@/components/home-client'
import { Navbar } from '@/components/navbar'
import { OnboardingWizard } from '@/components/onboarding-wizard'

export default function HomePage() {
  const t = useTranslations('home')

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <div className="mb-7">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight text-balance">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm text-pretty">{t('subtitle')}</p>
        </div>
        <HomeClient />
      </main>
      <OnboardingWizard />
    </div>
  )
}
