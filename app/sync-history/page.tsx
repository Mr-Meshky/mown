'use client'

import {
  AlertCircle,
  ArrowLeft,
  Download,
  ExternalLink,
  FileVideo,
  Globe,
  HardDrive,
  Music,
  Play,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getSettings } from '@/lib/store'
import { cn } from '@/lib/utils'

interface HistoryItem {
  id: string
  filename: string
  title: string
  url: string
  downloadUrl: string
  thumbnail: string
  type: 'youtube' | 'direct' | 'snapshot' | 'soundcloud'
  quality?: string
  format: string
  duration?: string
  size: string
  createdAt: string
  urlInput?: string
}

const typeIcons: Record<string, React.ElementType> = {
  youtube: FileVideo,
  soundcloud: Music,
  snapshot: Globe,
  direct: HardDrive,
}

const typeColors: Record<string, string> = {
  youtube: 'text-red-500 bg-red-500/10',
  soundcloud: 'text-orange-500 bg-orange-500/10',
  snapshot: 'text-blue-500 bg-blue-500/10',
  direct: 'text-gray-500 bg-gray-500/10',
}

function formatFileSize(bytes: string): string {
  const size = parseInt(bytes)
  if (isNaN(size)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let s = size
  while (s >= 1024 && i < units.length - 1) {
    s /= 1024
    i++
  }
  return `${s.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fa-IR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function HistoryCard({
  item,
  token,
  owner,
  repo,
}: {
  item: HistoryItem
  token: string
  owner: string
  repo: string
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const TypeIcon = typeIcons[item.type] || HardDrive
  const typeColor = typeColors[item.type] || ''

  const thumbnailUrl = item.thumbnail
    ? item.thumbnail.startsWith('http')
      ? item.thumbnail
      : `https://raw.githubusercontent.com/${owner}/${repo}/main/${item.thumbnail}`
    : null

  return (
    <Card className="border-border bg-card overflow-hidden transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail/Preview */}
        <div className="bg-secondary relative h-48 w-full shrink-0 sm:h-auto sm:w-48">
          {thumbnailUrl && !imgError ? (
            <>
              {!imgLoaded && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
              <img
                src={thumbnailUrl}
                alt={item.title}
                className={cn(
                  'h-full w-full object-cover',
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <TypeIcon className="text-muted-foreground/30 h-12 w-12" />
            </div>
          )}

          {/* Type badge */}
          <div
            className={cn(
              'absolute top-2 left-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
              typeColor
            )}
          >
            <TypeIcon className="h-3 w-3" />
            {item.type}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <h3 className="text-foreground line-clamp-1 font-medium">{item.title}</h3>
            <p className="text-muted-foreground mt-1 line-clamp-1 font-mono text-xs">
              {item.filename}
            </p>

            {/* Metadata */}
            <div className="text-muted-foreground mt-3 flex flex-wrap gap-3 text-[11px]">
              {item.duration && (
                <span className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  {item.duration}
                </span>
              )}
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                {formatFileSize(item.size)}
              </span>
              <span>{formatDate(item.createdAt)}</span>
              {item.quality && <span className="bg-secondary rounded px-1">{item.quality}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`/api/jobs/redirect?url=${encodeURIComponent(item.downloadUrl)}&token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                دانلود
              </Button>
            </a>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                گیت‌هاب
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function SyncHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(getSettings())
  const t = useTranslations('syncHistory')

  async function fetchHistory() {
    setLoading(true)
    setError('')
    const { token, owner, repo } = getSettings()

    if (!token || !owner || !repo) {
      setError('تنظیمات ریپازیتوری کامل نیست')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(
        `/api/history?token=${encodeURIComponent(token)}&owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      )
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'خطا در دریافت تاریخچه')
      }

      setHistory(data.history || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت تاریخچه')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
    const interval = setInterval(() => {
      const newSettings = getSettings()
      if (
        newSettings.token !== settings.token ||
        newSettings.owner !== settings.owner ||
        newSettings.repo !== settings.repo
      ) {
        setSettings(newSettings)
        fetchHistory()
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">
              {t('title')}
              <span className="text-muted-foreground ms-2 text-lg font-normal">
                {t('downloadedFiles')}
              </span>
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">{t('subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={fetchHistory}
              disabled={loading}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              {t('refresh')}
            </Button>
            <Link href="/">
              <Button size="sm" className="gap-2">
                <ArrowLeft className="h-3.5 w-3.5 rtl:-rotate-180" />
                {t('newDownload')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Settings info */}
        {settings.owner && settings.repo && (
          <div className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm">
            <p className="text-blue-600 dark:text-blue-400">
              {t('repository')}{' '}
              <a
                href={`https://github.com/${settings.owner}/${settings.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono underline"
              >
                {settings.owner}/{settings.repo}
              </a>
              {settings.repo && <span className="ms-2 text-xs">({t('github')})</span>}
            </p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-border bg-card overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <Skeleton className="h-48 w-full sm:h-auto sm:w-48" />
                  <div className="flex-1 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                    <Skeleton className="mt-4 h-8 w-32" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive/50 bg-card">
            <CardContent className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <AlertCircle className="text-destructive mb-4 h-12 w-12" />
              <p className="text-foreground font-medium">{error || t('error')}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t('settingsIncomplete')}</p>
              <Link href="/" className="mt-4">
                <Button size="sm" variant="outline" className="gap-2">
                  {t('settingsIncomplete')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : history.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="bg-secondary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                <Download className="text-muted-foreground h-6 w-6" />
              </div>
              <p className="text-foreground font-medium">{t('empty')}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t('emptyHint')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {t('filesFound', { count: String(history.length) })}
            </p>
            {history.map(item => (
              <HistoryCard
                key={item.id}
                item={item}
                token={settings.token}
                owner={settings.owner}
                repo={settings.repo}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
