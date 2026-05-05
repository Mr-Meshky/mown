'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const currentLocale = useLocale()

  function switchLocale(locale: 'en' | 'fa') {
    document.cookie = `locale=${locale};path=/;max-age=31536000;SameSite=Lax`
    startTransition(() => router.refresh())
  }

  return (
    <div className="border-border flex items-center gap-0.5 rounded-md border p-0.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => switchLocale('fa')}
        disabled={isPending}
        className={cn(
          'h-6 rounded px-2 text-xs font-medium transition-colors',
          currentLocale === 'fa'
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        فا
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className={cn(
          'h-6 rounded px-2 text-xs font-medium transition-colors',
          currentLocale === 'en'
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        EN
      </Button>
    </div>
  )
}
