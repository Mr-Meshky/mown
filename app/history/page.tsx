'use client'

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileAudio,
  FileVideo,
  FolderOpen,
  GitCommit,
  Globe,
  HardDrive,
  Loader2,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { JobStatusBadge } from '@/components/job-status-badge'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Job as StoreJob } from '@/lib/store'
import { getJobs } from '@/lib/store'
import { cn, getJobFolder } from '@/lib/utils'

const typeIcons: Record<string, React.ElementType> = {
  video: FileVideo,
  audio: FileAudio,
  webpage: Globe,
  raw: HardDrive,
}

const statusLeftBorder: Record<string, string> = {
  queued: 'border-s-warning',
  in_progress: 'border-s-primary',
  running: 'border-s-primary',
  completed: 'border-s-success',
  failed: 'border-s-destructive',
}

const statusIconMap: Record<string, React.ElementType> = {
  queued: Clock,
  in_progress: Loader2,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function JobRow({
  job,
  onRetry,
}: {
  readonly job: StoreJob
  readonly onRetry: (job: StoreJob) => void
}) {
  const t = useTranslations('history')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const typeKey = job.type === 'youtube' ? 'video' : job.type === 'snapshot' ? 'webpage' : 'raw'
  const TypeIcon = typeIcons[typeKey] ?? HardDrive

  const displayStatus =
    job.status === 'in_progress'
      ? 'running'
      : (job.status as 'queued' | 'running' | 'completed' | 'failed')

  const StatusIcon = statusIconMap[displayStatus] ?? Clock
  const folder = getJobFolder(job.type)
  const folderUrl = `https://github.com/${job.owner}/${job.repo}/tree/main/${folder}`
  const commitUrl = job.commitSha
    ? `https://github.com/${job.owner}/${job.repo}/commit/${job.commitSha}`
    : null

  return (
    <div
      className={cn(
        'group hover:bg-secondary/30 border-s-2 transition-colors',
        statusLeftBorder[displayStatus] ?? 'border-s-border'
      )}
    >
      <div className="flex flex-col gap-2 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: icon + title */}
          <div className="flex items-center gap-3">
            <div className="border-border bg-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
              <TypeIcon className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-foreground truncate font-mono text-sm font-medium">
                {job.options?.filename ?? `Run #${job.runId}`}
              </p>
              <p className="text-muted-foreground mt-0.5 max-w-xs truncate font-mono text-xs">
                {job.url}
              </p>
            </div>
          </div>

          {/* Right: status + actions */}
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <div className="flex items-center gap-1.5">
              <StatusIcon
                className={cn(
                  'h-3.5 w-3.5',
                  displayStatus === 'completed' && 'text-success',
                  displayStatus === 'failed' && 'text-destructive',
                  displayStatus === 'running' && 'text-primary animate-spin',
                  displayStatus === 'queued' && 'text-warning'
                )}
              />
              <JobStatusBadge status={displayStatus} />
            </div>

            <div className="flex items-center gap-1.5">
              {job.status === 'completed' && (
                <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                  <Download className="h-3 w-3" />
                  {tCommon('download')}
                </Button>
              )}
              {job.status === 'failed' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => onRetry(job)}
                >
                  <RefreshCw className="h-3 w-3" />
                  {t('redownload')}
                </Button>
              )}
              <Link href={`/jobs/${job.runId}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground h-7 gap-1.5 text-xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('details')}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Metadata row */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 ps-12 text-[11px]">
          <span>{job.repo}</span>
          <span>·</span>
          <span>{formatDate(job.createdAt, locale)}</span>

          {job.status === 'completed' && job.owner && (
            <>
              <span>·</span>
              <a
                href={folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <FolderOpen className="h-3 w-3" />
                {t('viewFolder')}
              </a>
              {commitUrl && (
                <a
                  href={commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <GitCommit className="h-3 w-3" />
                  {t('viewCommit')}
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const statCards = [
  {
    key: 'total' as const,
    icon: null,
    className: 'text-foreground',
    iconClass: '',
  },
  {
    key: 'completed' as const,
    icon: CheckCircle2,
    className: 'text-success',
    iconClass: 'text-success',
  },
  {
    key: 'running' as const,
    icon: Loader2,
    className: 'text-primary',
    iconClass: 'text-primary animate-spin',
  },
  {
    key: 'failed' as const,
    icon: XCircle,
    className: 'text-destructive',
    iconClass: 'text-destructive',
  },
]

export default function HistoryPage() {
  const [jobs, setJobs] = useState<StoreJob[]>([])
  const t = useTranslations('history')

  useEffect(() => {
    setJobs(getJobs())
  }, [])

  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const counts = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    running: jobs.filter(j => j.status === 'in_progress').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  }

  function handleRetry(job: StoreJob) {
    window.location.href = `/jobs/${job.runId}`
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight text-balance">
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">{t('subtitle')}</p>
          </div>
          <Link href="/">
            <Button size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              {t('newDownload')}
            </Button>
          </Link>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map(({ key, icon: Icon, className, iconClass }) => (
            <Card key={key} className="border-border bg-card">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                    {t(`stats.${key}`)}
                  </p>
                  {Icon && <Icon className={cn('h-3.5 w-3.5', iconClass)} />}
                </div>
                <p className={cn('mt-1.5 text-2xl font-semibold tabular-nums', className)}>
                  {counts[key]}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Job list */}
        <Card className="border-border bg-card overflow-hidden">
          {sortedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="bg-secondary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                <Download className="text-muted-foreground h-6 w-6" />
              </div>
              <p className="text-foreground font-medium">{t('empty')}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t('emptyHint')}</p>
              <Link href="/" className="mt-4">
                <Button size="sm" className="gap-2">
                  <ArrowLeft className="h-3.5 w-3.5 rtl:-rotate-180" />
                  {t('newDownload')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-border divide-y">
              {sortedJobs.map(job => (
                <JobRow key={job.runId} job={job} onRetry={handleRetry} />
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
