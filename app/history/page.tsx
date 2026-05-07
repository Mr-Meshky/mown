'use client'

import {
  ArrowLeft,
  AudioLines,
  Download,
  FileText,
  FolderOpen,
  Globe,
  HardDrive,
  Loader2,
  Plus,
  Terminal,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getSettings } from '@/lib/store'
import { cn } from '@/lib/utils'

interface HistoryEntry {
  id: string
  filename: string
  title: string
  url?: string
  githubUrl: string
  downloadUrl: string
  thumbnail: string
  type: 'youtube' | 'soundcloud' | 'direct' | 'snapshot'
  quality: string
  format: string
  duration: string
  uploader?: string
  track?: string
  album?: string
  size: number | string
  createdAt: string
  isSplit: boolean
  parts: Array<{
    filename: string
    size: number | string
    downloadUrl: string
  }>
  fileCount?: number
}

const typeIcons: Record<string, React.ElementType> = {
  youtube: Video,
  soundcloud: AudioLines,
  direct: HardDrive,
  snapshot: Globe,
}

const typeColors: Record<string, string> = {
  youtube: 'text-red-500',
  soundcloud: 'text-orange-500',
  direct: 'text-blue-500',
  snapshot: 'text-green-500',
}

function formatFileSize(bytes: number | string): string {
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes
  if (isNaN(num) || num === 0) return 'Unknown'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = num
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(size >= 1024 ? 1 : 0)} ${units[unitIndex]}`
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MergeInstructions({
  filename,
  parts,
}: {
  filename: string
  parts: Array<{ filename: string; downloadUrl: string }>
}) {
  const t = useTranslations('history')
  const [activeTab, setActiveTab] = useState('cli')

  const baseName = filename.replace(/\.[^.]+$/, '')

  const cliCommand = `# Download all parts first
${parts.map(p => `curl -L -o "${p.filename}" "${p.downloadUrl}"`).join('\n')}

# Merge and extract
cat ${baseName}part*.zip > "${baseName}.zip"
unzip "${baseName}.zip"

# The merged file is ready to use`

  return (
    <div className="mt-3 rounded-lg border bg-muted/30">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b px-4 pt-3">
          <TabsList className="h-8">
            <TabsTrigger value="cli" className="gap-1.5 text-xs">
              <Terminal className="h-3 w-3" />
              {t('merge.cli')}
            </TabsTrigger>
            <TabsTrigger value="ui" className="gap-1.5 text-xs">
              <Download className="h-3 w-3" />
              {t('merge.ui')}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="cli" className="p-4">
          <p className="text-muted-foreground mb-3 text-sm">{t('merge.cliDesc')}</p>
          <pre className="bg-background overflow-x-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed">
            {cliCommand}
          </pre>
        </TabsContent>
        <TabsContent value="ui" className="p-4">
          <p className="text-muted-foreground mb-3 text-sm">{t('merge.uiDesc')}</p>
          <ol className="text-muted-foreground space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                1
              </span>
              <span>{t('merge.uiStep1')}</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                2
              </span>
              <span>{t('merge.uiStep2')}</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                3
              </span>
              <span>{t('merge.uiStep3')}</span>
            </li>
          </ol>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function HistoryItem({ entry }: { entry: HistoryEntry }) {
  const t = useTranslations('history')
  const locale = useLocale()
  const TypeIcon = typeIcons[entry.type] ?? HardDrive
  const typeColor = typeColors[entry.type] ?? 'text-muted-foreground'

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'border-border bg-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border'
              )}
            >
              <TypeIcon className={cn('h-5 w-5', typeColor)} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-foreground truncate font-medium">{entry.title}</h3>
              <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="capitalize">{entry.type}</span>
                <span>·</span>
                <span>{entry.format?.toUpperCase()}</span>
                {entry.quality && (
                  <>
                    <span>·</span>
                    <span>{entry.quality}</span>
                  </>
                )}
                {entry.duration && (
                  <>
                    <span>·</span>
                    <span>{entry.duration}</span>
                  </>
                )}
                <span>·</span>
                <span>{formatFileSize(entry.size)}</span>
              </div>
            </div>

            <span className="text-muted-foreground shrink-0 text-xs">
              {formatDate(entry.createdAt, locale)}
            </span>
          </div>

          {/* Single file download */}
          {!entry.isSplit && (
            <div className="ps-13">
              <a
                href={entry.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-secondary inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="font-mono text-xs">{entry.filename}</span>
                <span className="text-muted-foreground">({formatFileSize(entry.size)})</span>
              </a>
            </div>
          )}

          {/* Multi-part download */}
          {entry.isSplit && entry.parts.length > 0 && (
            <div className="ps-13 space-y-3">
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
                  {t('partsTitle')} ({entry.parts.length})
                </p>
                <div className="space-y-1">
                  {entry.parts.map(part => (
                    <a
                      key={part.filename}
                      href={part.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-secondary flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                    >
                      <FileText className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="font-mono text-xs">{part.filename}</span>
                      <span className="text-muted-foreground ml-auto text-xs">
                        {formatFileSize(part.size)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              <MergeInstructions
                filename={entry.filename}
                parts={entry.parts}
              />
            </div>
          )}

          {/* Snapshot info */}
          {entry.type === 'snapshot' && entry.fileCount && (
            <div className="ps-13">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <FolderOpen className="h-3.5 w-3.5" />
                <span>
                  {t('snapshotFiles', { count: entry.fileCount })}
                </span>
              </div>
              <a
                href={entry.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-secondary mt-2 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{t('browseOnGitHub')}</span>
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function HistoryPage() {
  const t = useTranslations('history')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      const settings = getSettings()
      if (!settings.token || !settings.owner) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(
          `/api/history?token=${encodeURIComponent(settings.token)}&owner=${encodeURIComponent(settings.owner)}&repo=${encodeURIComponent(settings.repo)}`
        )
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setHistory(data)
      } catch (e) {
        console.error('Failed to load history:', e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filters = [
    { key: 'all', label: t('filter.all') },
    { key: 'youtube', label: t('filter.youtube') },
    { key: 'soundcloud', label: t('filter.soundcloud') },
    { key: 'direct', label: t('filter.direct') },
    { key: 'snapshot', label: t('filter.snapshot') },
  ]

  const filtered =
    filter === 'all' ? history : history.filter(e => e.type === filter)

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            <p className="text-muted-foreground mt-4 text-sm">{t('loading')}</p>
          </div>
        </main>
      </div>
    )
  }

  const settings = getSettings()
  if (!settings.token || !settings.owner) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-foreground text-2xl font-semibold tracking-tight">{t('title')}</h1>
              <p className="text-muted-foreground mt-1.5 text-sm">{t('subtitle')}</p>
            </div>
          </div>
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-secondary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                <Download className="text-muted-foreground h-6 w-6" />
              </div>
              <p className="text-foreground font-medium">{t('setupRequired')}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t('setupRequiredHint')}</p>
              <Link href="/" className="mt-4">
                <Button size="sm" className="gap-2">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t('goHome')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">{t('subtitle')}</p>
          </div>
          <Link href="/">
            <Button size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              {t('newDownload')}
            </Button>
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* History list */}
        {sorted.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-secondary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                <Download className="text-muted-foreground h-6 w-6" />
              </div>
              <p className="text-foreground font-medium">{t('empty')}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t('emptyHint')}</p>
              <Link href="/" className="mt-4">
                <Button size="sm" className="gap-2">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t('newDownload')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sorted.map(entry => (
              <HistoryItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
