'use client'

import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TokenInputProps {
  value: string
  onChange: (val: string) => void
}

export function TokenInput({ value, onChange }: TokenInputProps) {
  const [visible, setVisible] = useState(false)
  const t = useTranslations('home.auth')

  return (
    <div className="space-y-1.5">
      <Label htmlFor="pat" className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <KeyRound className="h-3.5 w-3.5" />
        {t('tokenLabel')}
      </Label>
      <div className="relative">
        <Input
          id="pat"
          type={visible ? 'text' : 'password'}
          placeholder={t('tokenPlaceholder')}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="pe-10 font-mono text-sm"
          autoComplete="off"
          spellCheck={false}
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
      <p className="text-muted-foreground text-[11px]">{t('tokenHint')}</p>
    </div>
  )
}
