'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Download, History, Moon, Sun, Zap } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useReopenOnboarding } from '@/components/onboarding-wizard'
import Image from 'next/image'

const navLinks = [
  { href: '/', key: 'newJob' as const, icon: Download },
  { href: '/history', key: 'history' as const, icon: History },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const t = useTranslations('navbar')
  const tOnboarding = useTranslations('onboarding')
  const reopenOnboarding = useReopenOnboarding()

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-13 max-w-4xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Mown" width={20} height={20} />
          <span className="text-foreground font-semibold tracking-tight">Mown</span>
          <span className="bg-secondary text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase">
            beta
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-0.5">
          {navLinks.map(({ href, key, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t(key)}</span>
                {/* Active indicator */}
                {isActive && (
                  <span className="bg-primary absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-0.5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                  onClick={reopenOnboarding}
                  aria-label={tOnboarding('reopen')}
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{tOnboarding('reopen')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <LanguageSwitcher />

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
        </div>
      </div>
    </header>
  )
}
