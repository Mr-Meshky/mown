'use client'

import { GitFork } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RepoSelectorProps {
  value: string
  onChange: (val: string) => void
}

export function RepoSelector({ value, onChange }: RepoSelectorProps) {
  const t = useTranslations('home.auth')
  return (
    <div className="space-y-1.5">
      <Label htmlFor="repo" className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <GitFork className="h-3.5 w-3.5" />
        {t('repoLabel')}
      </Label>
      <Input
        id="repo"
        placeholder="owner/repo"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="font-mono text-sm"
        spellCheck={false}
      />
      <p className="text-muted-foreground text-[11px]">{t('tokenHint')}</p>
    </div>
  )
}
