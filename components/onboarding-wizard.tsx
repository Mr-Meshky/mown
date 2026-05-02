'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Github,
  GitFork,
  KeyRound,
  Link2,
  Loader2,
  Sparkles,
  Youtube,
} from 'lucide-react'
import { saveSettings, getSettings } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ONBOARDING_KEY = 'mown_onboarding_done'

function useOnboardingState() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) setOpen(true)
  }, [])

  function finish() {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setOpen(false)
  }

  function reopen() {
    setOpen(true)
  }

  return { open, setOpen, finish, reopen, mounted }
}

// ── Step 1: Welcome ──────────────────────────────────────────────────────────
function Step1({ t }: { t: ReturnType<typeof useTranslations> }) {
  const features = [
    { icon: Youtube, text: t('step1.feature1'), color: 'text-red-500 bg-red-500/10' },
    { icon: Link2, text: t('step1.feature2'), color: 'text-blue-400 bg-blue-400/10' },
    { icon: Camera, text: t('step1.feature3'), color: 'text-green-500 bg-green-500/10' },
    { icon: Github, text: t('step1.feature4'), color: 'text-foreground bg-secondary' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Download className="text-primary h-8 w-8" />
        </div>
        <div>
          <h2 className="text-foreground text-xl font-bold">{t('step1.title')}</h2>
          <p className="text-muted-foreground mt-1.5 max-w-xs text-sm leading-relaxed">
            {t('step1.description')}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {features.map(({ icon: Icon, text, color }, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                color
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-foreground text-sm leading-relaxed">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Step 2: Token ────────────────────────────────────────────────────────────
function Step2({
  t,
  token,
  onChange,
  error,
}: {
  t: ReturnType<typeof useTranslations>
  token: string
  onChange: (v: string) => void
  error: string
}) {
  const [visible, setVisible] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const steps = [t('step2.step1'), t('step2.step2'), t('step2.step3'), t('step2.step4')]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 text-center">
        <div className="bg-primary/10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <KeyRound className="text-primary h-7 w-7" />
        </div>
        <h2 className="text-foreground mt-2 text-xl font-bold">{t('step2.title')}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{t('step2.description')}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="onboarding-token" className="text-sm font-medium">
          {t('step2.tokenLabel')}
        </Label>
        <div className="relative">
          <Input
            id="onboarding-token"
            type={visible ? 'text' : 'password'}
            placeholder={t('step2.tokenPlaceholder')}
            value={token}
            onChange={e => onChange(e.target.value)}
            className={cn(
              'ps-10 font-mono text-sm',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? 'Hide token' : 'Show token'}
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
        </div>
        {error ? (
          <p className="text-destructive text-xs">{error}</p>
        ) : (
          <p className="text-muted-foreground text-xs">{t('step2.tokenHint')}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowGuide(v => !v)}
        className="text-primary hover:text-primary/80 flex items-center gap-1.5 text-start text-sm font-medium transition-colors"
      >
        <Github className="h-3.5 w-3.5 shrink-0" />
        {t('step2.howToGet')}
      </button>

      {showGuide && (
        <ol className="bg-muted/50 border-border flex flex-col gap-2.5 rounded-xl border p-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-primary bg-primary/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                {i + 1}
              </span>
              <span className="text-foreground text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ── Step 3: Repo Setup ───────────────────────────────────────────────────────
function Step3({
  t,
  owner,
  repo,
  onOwnerChange,
  onRepoChange,
  onInit,
  initializing,
  initialized,
  ownerError,
  repoError,
  onSkip,
}: {
  t: ReturnType<typeof useTranslations>
  owner: string
  repo: string
  onOwnerChange: (v: string) => void
  onRepoChange: (v: string) => void
  onInit: () => void
  initializing: boolean
  initialized: boolean
  ownerError: string
  repoError: string
  onSkip: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 text-center">
        <div className="bg-primary/10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <GitFork className="text-primary h-7 w-7" />
        </div>
        <h2 className="text-foreground mt-2 text-xl font-bold">{t('step3.title')}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{t('step3.description')}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onboarding-owner" className="text-sm font-medium">
            {t('step3.ownerLabel')}
          </Label>
          <Input
            id="onboarding-owner"
            placeholder={t('step3.ownerPlaceholder')}
            value={owner}
            onChange={e => onOwnerChange(e.target.value)}
            className={cn(
              'font-mono text-sm',
              ownerError && 'border-destructive focus-visible:ring-destructive'
            )}
            spellCheck={false}
            dir="ltr"
          />
          {ownerError && <p className="text-destructive text-xs">{ownerError}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onboarding-repo" className="text-sm font-medium">
            {t('step3.repoLabel')}
          </Label>
          <Input
            id="onboarding-repo"
            placeholder={t('step3.repoPlaceholder')}
            value={repo}
            onChange={e => onRepoChange(e.target.value)}
            className={cn(
              'font-mono text-sm',
              repoError && 'border-destructive focus-visible:ring-destructive'
            )}
            spellCheck={false}
            dir="ltr"
          />
          {repoError && <p className="text-destructive text-xs">{repoError}</p>}
        </div>

        {initialized ? (
          <div className="bg-success/10 flex items-center gap-2.5 rounded-xl p-3">
            <CheckCircle2 className="text-success h-4 w-4 shrink-0" />
            <span className="text-success text-sm font-medium">{t('step3.success')}</span>
          </div>
        ) : (
          <Button type="button" onClick={onInit} disabled={initializing} className="w-full gap-2">
            {initializing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('step3.initializing')}
              </>
            ) : (
              t('step3.initButton')
            )}
          </Button>
        )}

        <button
          type="button"
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground text-center text-sm underline underline-offset-4 transition-colors"
        >
          {t('step3.skipSetup')}
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Done ─────────────────────────────────────────────────────────────
function Step4({ t }: { t: ReturnType<typeof useTranslations> }) {
  const tips = [
    {
      icon: Link2,
      title: t('step4.tip1Title'),
      desc: t('step4.tip1Desc'),
      color: 'text-blue-400 bg-blue-400/10',
    },
    {
      icon: Sparkles,
      title: t('step4.tip2Title'),
      desc: t('step4.tip2Desc'),
      color: 'text-primary bg-primary/10',
    },
    {
      icon: CheckCircle2,
      title: t('step4.tip3Title'),
      desc: t('step4.tip3Desc'),
      color: 'text-success bg-success/10',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <div className="bg-success/10 flex h-16 w-16 items-center justify-center rounded-2xl">
          <CheckCircle2 className="text-success h-8 w-8" />
        </div>
        <div>
          <h2 className="text-foreground text-xl font-bold">{t('step4.title')}</h2>
          <p className="text-muted-foreground mt-1.5 max-w-xs text-sm leading-relaxed">
            {t('step4.description')}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-4">
        {tips.map(({ icon: Icon, title, desc, color }, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                color
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground text-sm font-semibold">{title}</span>
              <span className="text-muted-foreground text-xs leading-relaxed">{desc}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main Wizard ──────────────────────────────────────────────────────────────
export function OnboardingWizard() {
  const t = useTranslations('onboarding')
  const { open, setOpen, finish } = useOnboardingState()

  const [step, setStep] = useState(0)
  const TOTAL = 4

  // Step 2 state
  const [token, setToken] = useState('')
  const [tokenError, setTokenError] = useState('')

  // Step 3 state
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('mown-downloads')
  const [ownerError, setOwnerError] = useState('')
  const [repoError, setRepoError] = useState('')
  const [initializing, setInitializing] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [step3Skipped, setStep3Skipped] = useState(false)

  useEffect(() => {
    const s = getSettings()
    if (s.token) setToken(s.token)
    if (s.owner) setOwner(s.owner)
    if (s.repo) setRepo(s.repo)
  }, [])

  function validateStep(): boolean {
    if (step === 1) {
      if (!token.trim()) {
        setTokenError(t('step2.tokenRequired'))
        return false
      }
      setTokenError('')
      saveSettings({ token })
    }
    return true
  }

  function handleNext() {
    if (!validateStep()) return
    if (step < TOTAL - 1) setStep(s => s + 1)
    else handleFinish()
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1)
  }

  function handleFinish() {
    if (token) saveSettings({ token })
    if (owner) saveSettings({ owner })
    if (repo) saveSettings({ repo })
    finish()
  }

  async function handleInit() {
    if (!owner.trim()) {
      setOwnerError(t('step3.ownerRequired'))
      return
    }
    if (!repo.trim()) {
      setRepoError(t('step3.repoRequired'))
      return
    }
    setOwnerError('')
    setRepoError('')
    setInitializing(true)
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, repo, owner }),
      })
      if (!res.ok) throw new Error('Setup failed')
      const data = await res.json()
      saveSettings({ token, owner: data.owner ?? owner, repo: data.repo ?? repo })
      setInitialized(true)
      toast.success(t('step3.success'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setInitializing(false)
    }
  }

  const progressPct = ((step + 1) / TOTAL) * 100

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-sm flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md"
        aria-describedby="onboarding-description"
        dir="rtl"
      >
        <DialogTitle className="sr-only">{t('step1.title')}</DialogTitle>

        {/* Progress header */}
        <div className="border-border border-b px-6 pt-5 pb-4">
          <div className="mb-2.5 flex items-center justify-between ps-2.5">
            <span className="text-muted-foreground text-xs">
              {t('step', { current: step + 1, total: TOTAL })}
            </span>
            {step < TOTAL - 1 && (
              <button
                type="button"
                onClick={finish}
                className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4 transition-colors"
              >
                {t('skip')}
              </button>
            )}
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i === step
                    ? 'bg-primary flex-1'
                    : i < step
                      ? 'bg-primary/40 w-6'
                      : 'bg-border w-6'
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div id="onboarding-description" className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && <Step1 t={t} />}
          {step === 1 && (
            <Step2
              t={t}
              token={token}
              onChange={v => {
                setToken(v)
                setTokenError('')
              }}
              error={tokenError}
            />
          )}
          {step === 2 && (
            <Step3
              t={t}
              owner={owner}
              repo={repo}
              onOwnerChange={v => {
                setOwner(v)
                setOwnerError('')
              }}
              onRepoChange={v => {
                setRepo(v)
                setRepoError('')
              }}
              onInit={handleInit}
              initializing={initializing}
              initialized={initialized}
              ownerError={ownerError}
              repoError={repoError}
              onSkip={() => {
                setStep3Skipped(true)
                setStep(s => s + 1)
              }}
            />
          )}
          {step === 3 && <Step4 t={t} />}
        </div>

        {/* Footer navigation */}
        <div className="border-border flex items-center justify-between border-t px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 0}
            className="gap-1.5"
          >
            {/* ChevronRight in RTL context = visually "back" arrow pointing right */}
            <ChevronRight className="h-4 w-4" />
            {t('back')}
          </Button>

          <Button type="button" size="sm" onClick={handleNext} className="gap-1.5">
            {step === TOTAL - 1 ? t('finish') : t('next')}
            {/* ChevronLeft in RTL context = visually "forward" arrow pointing left */}
            {step < TOTAL - 1 && <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Re-open trigger (for navbar) ──────────────────────────────────────────────
const globalReopenFns: Array<() => void> = []

export function useReopenOnboarding() {
  return () => {
    localStorage.removeItem(ONBOARDING_KEY)
    globalReopenFns.forEach(fn => fn())
    window.location.reload()
  }
}
