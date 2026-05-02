'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Download,
  Github,
  Globe,
  HardDrive,
  Loader2,
  Settings2,
  Upload,
  Youtube,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TokenInput } from '@/components/token-input'
import { RepoSelector } from '@/components/repo-selector'
import { JobConfigPanel } from '@/components/job-config-panel'
import { VideoPreviewCard } from '@/components/video-preview-card'
import { saveJob, saveSettings, getSettings } from '@/lib/store'
import type { DownloadType, InputType } from '@/lib/mock-data'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const defaultDownloadType: Record<InputType, DownloadType> = {
  youtube: 'video',
  direct: 'raw',
  snapshot: 'webpage',
}

const inputTabs: Array<{ key: InputType; icon: React.ElementType; activeColor: string }> = [
  { key: 'youtube', icon: Youtube, activeColor: 'text-red-500' },
  { key: 'direct', icon: HardDrive, activeColor: 'text-blue-400' },
  { key: 'snapshot', icon: Globe, activeColor: 'text-green-500' },
]

export function HomeClient() {
  const router = useRouter()
  const t = useTranslations('home')
  const tJobConfig = useTranslations('jobConfig')

  const [inputType, setInputType] = useState<InputType>('youtube')
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [repo, setRepo] = useState('')
  const [downloadType, setDownloadType] = useState<DownloadType>('video')
  const [quality, setQuality] = useState('1080p')
  const [filename, setFilename] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [settingUp, setSettingUp] = useState(false)
  const [cookiesUploaded, setCookiesUploaded] = useState(false)
  const [isSetupDone, setIsSetupDone] = useState(false)

  useEffect(() => {
    const settings = getSettings()
    if (settings.token) setToken(settings.token)
    if (settings.repo) setRepo(settings.repo)
    if (settings.cookiesUploaded) setCookiesUploaded(settings.cookiesUploaded)
    if (settings.token && settings.repo) setIsSetupDone(true)
  }, [])

  function handleTabChange(val: InputType) {
    setInputType(val)
    setDownloadType(defaultDownloadType[val])
    setUrl('')
  }

  async function handleCookiesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const settings = getSettings()
    if (!settings.token || !settings.owner || !settings.repo) {
      toast.error(t('setup.title'))
      return
    }
    try {
      const res = await fetch('/api/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: settings.token,
          owner: settings.owner,
          repo: settings.repo,
          cookies: text,
        }),
      })
      if (!res.ok) throw new Error('Failed to upload cookies')
      saveSettings({ cookiesUploaded: true })
      setCookiesUploaded(true)
      toast.success(t('setup.cookiesSaved'))
    } catch (err) {
      toast.error(t('setup.cookies'), {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  async function handleSetup() {
    if (!token) {
      toast.error(t('auth.tokenLabel'))
      return
    }
    setSettingUp(true)
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, repo: repo || undefined }),
      })
      if (!res.ok) throw new Error('Setup failed')
      const data = await res.json()
      saveSettings({ token, owner: data.owner, repo: data.repo })
      setRepo(data.repo)
      setIsSetupDone(true)
      toast.success(t('setup.success'), {
        description: `${data.owner}/${data.repo}`,
      })
    } catch (err) {
      toast.error(t('setup.title'), { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSettingUp(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) {
      toast.error(t('form.urlLabel'))
      return
    }
    const settings = getSettings()
    if (!settings.token || !settings.repo) {
      toast.error(t('setup.description'))
      return
    }
    if (inputType === 'youtube' && !settings.cookiesUploaded) {
      const confirm = window.confirm(t('setup.cookiesDescription'))
      if (confirm) {
        toast.info(t('setup.cookies'))
        return
      }
    }
    setSubmitting(true)
    try {
      const typeMap: Record<InputType, string> = {
        youtube: 'youtube',
        direct: 'direct',
        snapshot: 'snapshot',
      }
      const options: Record<string, string> = {}
      if (inputType === 'youtube') {
        options.quality = quality.replace('p', '')
        options.format = downloadType === 'audio' ? 'mp3' : 'mp4'
      }
      if (filename) options.filename = filename

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: settings.token,
          owner: settings.owner,
          repo: settings.repo,
          type: typeMap[inputType],
          url,
          options,
        }),
      })
      if (!res.ok) throw new Error('Job submission failed')
      const data = await res.json()
      saveJob({
        id: data.jobId,
        runId: data.runId,
        owner: settings.owner,
        repo: settings.repo,
        type: typeMap[inputType] as 'youtube' | 'direct' | 'snapshot',
        url,
        options,
        status: 'queued',
        createdAt: new Date().toISOString(),
      })
      toast.success(t('form.submit'))
      router.push(`/jobs/${data.runId}`)
    } catch (err) {
      toast.error(t('form.submit'), { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  const showPreview = inputType === 'youtube' && url.includes('youtube.com')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* URL hero section */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 sm:p-5">
          {/* Tab selector */}
          <div className="bg-secondary mb-4 flex gap-1 rounded-lg p-1">
            {inputTabs.map(({ key, icon: Icon, activeColor }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTabChange(key)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all',
                  inputType === key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', inputType === key ? activeColor : '')} />
                <span>{t(`tabs.${key}`)}</span>
              </button>
            ))}
          </div>

          {/* URL input + submit button */}
          <div className="flex gap-2">
            <Input
              type="url"
              inputMode="url"
              placeholder={t('form.urlPlaceholder')}
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="h-11 flex-1 font-mono text-sm"
              spellCheck={false}
              dir="ltr"
              aria-label={t('form.urlLabel')}
            />
            <Button type="submit" className="h-11 shrink-0 gap-2 px-5" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {submitting ? t('form.submitting') : t('form.submit')}
              </span>
            </Button>
          </div>

          {/* Video preview */}
          {showPreview && (
            <div className="mt-4">
              <VideoPreviewCard url={url} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Download config */}
        <Card className="border-border bg-card">
          <CardHeader className="px-5 pt-4 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Settings2 className="text-muted-foreground h-4 w-4" />
              {tJobConfig('title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <JobConfigPanel
              inputType={inputType}
              downloadType={downloadType}
              onDownloadTypeChange={setDownloadType}
              quality={quality}
              onQualityChange={setQuality}
              filename={filename}
              onFilenameChange={setFilename}
            />
          </CardContent>
        </Card>

        {/* GitHub setup */}
        <Card className="border-border bg-card">
          <CardHeader className="px-5 pt-4 pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Github className="text-muted-foreground h-4 w-4" />
                {t('auth.title')}
              </div>
              {isSetupDone && (
                <span className="text-success flex items-center gap-1 text-xs font-normal">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  راه‌اندازی شده
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <TokenInput value={token} onChange={setToken} />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSetup}
              disabled={settingUp}
              className="w-full gap-2"
            >
              {settingUp ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('setup.initializing')}
                </>
              ) : (
                t('setup.button')
              )}
            </Button>

            {/* Cookies upload */}
            <div className="border-warning/30 bg-warning/5 space-y-2 rounded-lg border p-3">
              <p className="text-warning text-xs leading-relaxed">
                {cookiesUploaded ? t('setup.cookiesUpdate') : t('setup.cookiesDescription')}
              </p>
              <label className="border-border hover:border-primary/40 hover:text-foreground bg-background/50 text-muted-foreground flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs transition-colors">
                <Upload className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {cookiesUploaded ? 'بارگذاری مجدد cookies.txt' : 'بارگذاری cookies.txt'}
                </span>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleCookiesUpload}
                  className="sr-only"
                />
              </label>
              {cookiesUploaded && (
                <p className="text-success flex items-center gap-1 text-[10px]">
                  <CheckCircle2 className="h-3 w-3" />
                  {t('setup.cookiesSaved')}
                </p>
              )}
            </div>

            <RepoSelector value={repo} onChange={setRepo} />
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
