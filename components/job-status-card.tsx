'use client'

import { Download, ExternalLink, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { JobStatusBadge } from '@/components/job-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { getSettings, updateJob } from '@/lib/store'
import { cn, getDownloadTypeFolder } from '@/lib/utils'
import { formatDate, formatFileSize, TYPE_ICONS } from '@/lib/constants'
import { usePolling } from '@/hooks/use-polling'

interface JobStatusCardProps {
  job: {
    id: string
    url: string
    downloadType: string
    status: string
    createdAt: string
    filename?: string
    fileSize?: string
    logs?: string[]
    repo?: string
  }
  runId?: number
}

const typeIcons = TYPE_ICONS

function formatDate(iso: string) {

type PipelineStatus = 'queued' | 'running' | 'completed' | 'failed'

const pipelineSteps: Array<{
  key: PipelineStatus | 'queued'
  label: string
  icon: React.ElementType
}> = [
  { key: 'queued', label: 'در صف', icon: Clock },
  { key: 'running', label: 'در حال دانلود', icon: Loader2 },
  { key: 'completed', label: 'تکمیل شد', icon: CheckCircle2 },
]

function PipelineStep({
  label,
  icon: Icon,
  state,
  isLast,
}: {
  label: string
  icon: React.ElementType
  state: 'done' | 'active' | 'pending' | 'failed'
  isLast: boolean
}) {
  return (
    <div className="flex items-center gap-0">
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
            state === 'done' && 'border-success bg-success/15 text-success',
            state === 'active' && 'border-primary bg-primary/15 text-primary',
            state === 'pending' && 'border-border bg-background text-muted-foreground',
            state === 'failed' && 'border-destructive bg-destructive/15 text-destructive'
          )}
        >
          <Icon
            className={cn('h-3.5 w-3.5', state === 'active' && Icon === Loader2 && 'animate-spin')}
          />
        </div>
        <span
          className={cn(
            'text-[11px] font-medium whitespace-nowrap',
            state === 'done' && 'text-success',
            state === 'active' && 'text-primary',
            state === 'pending' && 'text-muted-foreground',
            state === 'failed' && 'text-destructive'
          )}
        >
          {label}
        </span>
      </div>
      {!isLast && (
        <div
          className={cn(
            'mx-2 mb-5 h-0.5 w-12 flex-shrink-0 transition-all sm:w-20',
            state === 'done' ? 'bg-success/40' : 'bg-border'
          )}
        />
      )}
    </div>
  )
}

export function JobStatusCard({ job, runId }: JobStatusCardProps) {
  const router = useRouter()
  const t = useTranslations('jobStatus')
  const TypeIcon = typeIcons[job.downloadType] ?? HardDrive
  const logRef = useRef<HTMLDivElement>(null)
  const commitFetchedRef = useRef(false)
  const [logs, setLogs] = useState<string[]>(job.logs || [])
  const [status, setStatus] = useState<PipelineStatus>(
    job.status === 'in_progress' ? 'running' : (job.status as PipelineStatus)
  )

  const settings = getSettings()
  const effectiveRunId = runId || (job as unknown as { runId?: number }).runId || 0

  // Poll status
  useEffect(() => {
    if (!effectiveRunId || !settings.token) return
    if (status === 'completed' || status === 'failed') return

    let cancelled = false

    async function pollStatus() {
      try {
        const res = await fetch(
          `/api/jobs/${effectiveRunId}/status?token=${settings.token}&owner=${settings.owner}&repo=${settings.repo}`
        )
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return

        const newStatus: PipelineStatus =
          data.status === 'completed'
            ? data.conclusion === 'success'
              ? 'completed'
              : 'failed'
            : data.status === 'in_progress'
              ? 'running'
              : 'queued'

        setStatus(newStatus)
        updateJob(effectiveRunId, { status: newStatus } as Parameters<typeof updateJob>[1])

        if (newStatus === 'completed' && !commitFetchedRef.current) {
          commitFetchedRef.current = true
          const folder = getDownloadTypeFolder(job.downloadType)
          fetch(
            `/api/github/commit?token=${settings.token}&owner=${settings.owner}&repo=${settings.repo}&path=${encodeURIComponent(folder)}`
          )
              .then((r: Response) => r.json() as Promise<{ sha: string | null }>)
              .then(({ sha }) => {
                if (sha) updateJob(effectiveRunId, { commitSha: sha } as Parameters<typeof updateJob>[1])
              })
            .catch(() => {})
        }
      } catch {
        // ignore
      }
    }

    pollStatus()
    const interval = setInterval(pollStatus, 7000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [effectiveRunId, settings.token, settings.owner, settings.repo, status])

  // Fetch logs
  useEffect(() => {
    if (status !== 'running' || !effectiveRunId || !settings.token) return

    async function fetchLogs() {
      try {
        const logRes = await fetch(
          `/api/jobs/${effectiveRunId}/logs?token=${settings.token}&owner=${settings.owner}&repo=${settings.repo}`
        )
        if (logRes.ok) {
          const logData = await logRes.json()
          const lines = (logData.logs || '').split('\n').filter(Boolean)
          setLogs(lines)
        }
      } catch {
        // ignore
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [status, effectiveRunId, settings.token, settings.owner, settings.repo])

  // Auto-scroll logs
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])

  function handleDownload() {
    const params = new URLSearchParams({
      token: settings.token,
      owner: settings.owner,
      repo: settings.repo,
    })
    window.location.href = `/api/jobs/${effectiveRunId}/download?${params.toString()}`
  }

  function handleRetry() {
    router.push('/')
  }

  // Determine pipeline step states
  function getStepState(stepKey: string): 'done' | 'active' | 'pending' | 'failed' {
    if (status === 'failed') {
      if (stepKey === 'queued') return 'done'
      if (stepKey === 'running') return 'failed'
      return 'pending'
    }
    if (status === 'completed') {
      return 'done'
    }
    if (status === 'running') {
      if (stepKey === 'queued') return 'done'
      if (stepKey === 'running') return 'active'
      return 'pending'
    }
    // queued
    if (stepKey === 'queued') return 'active'
    return 'pending'
  }

  return (
    <Card className="border-border bg-card overflow-hidden">
      {/* Pipeline stepper */}
      <div className="border-border bg-secondary/30 border-b px-5 py-4">
        <div className="flex items-start justify-center gap-0 overflow-x-auto">
          {pipelineSteps.map((step, i) => {
            const state =
              status === 'failed' && step.key === 'completed'
                ? (getStepState('failed') as 'done' | 'active' | 'pending' | 'failed')
                : (getStepState(step.key) as 'done' | 'active' | 'pending' | 'failed')

            // For the last visible step when failed, replace with failed state
            const effectiveState = status === 'failed' && step.key === 'running' ? 'failed' : state

            return (
              <PipelineStep
                key={step.key}
                label={step.label}
                icon={status === 'failed' && step.key === 'running' ? XCircle : step.icon}
                state={effectiveState}
                isLast={i === pipelineSteps.length - 1}
              />
            )
          })}
        </div>
      </div>

      <CardContent className="p-5">
        {/* Job metadata header */}
        <div className="mb-5 flex flex-wrap items-start gap-3">
          <div className="border-border bg-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
            <TypeIcon className="text-muted-foreground h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground font-mono text-sm font-medium">
              {job.filename ?? job.id}
            </p>
            <p
              className="text-muted-foreground mt-0.5 max-w-sm truncate font-mono text-xs"
              dir="ltr"
            >
              {job.url}
            </p>
          </div>
          <JobStatusBadge status={status === 'running' ? 'in_progress' : status} />
        </div>

        <Separator className="mb-5" />

        {/* Meta grid */}
        <div className="mb-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          <MetaItem label={t('runId')}>
            <span className="font-mono text-xs">#{effectiveRunId}</span>
          </MetaItem>
          <MetaItem label={t('repository')}>
            <span className="font-mono text-xs">{settings.repo || job.repo}</span>
          </MetaItem>
          <MetaItem label={t('created')}>
            <span className="text-xs">{formatDate(job.createdAt)}</span>
          </MetaItem>
          {job.fileSize && (
            <MetaItem label="حجم فایل">
              <span className="text-xs">{job.fileSize}</span>
            </MetaItem>
          )}
        </div>

        {/* Terminal logs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-medium">{t('logs')}</p>
            {logs.length > 0 && (
              <span className="text-muted-foreground/60 font-mono text-[10px]">
                {logs.length} خط
              </span>
            )}
          </div>
          <div className="border-border bg-background overflow-hidden rounded-lg border">
            {/* Terminal title bar */}
            <div className="border-border bg-secondary/50 flex items-center gap-1.5 border-b px-3 py-2">
              <span className="bg-destructive/60 h-2.5 w-2.5 rounded-full" />
              <span className="bg-warning/60 h-2.5 w-2.5 rounded-full" />
              <span className="bg-success/60 h-2.5 w-2.5 rounded-full" />
              <span className="text-muted-foreground ms-2 font-mono text-[10px]">logs</span>
            </div>
            <ScrollArea className="h-52">
              <div ref={logRef as React.RefObject<HTMLDivElement>} className="p-4" dir="ltr">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground/50 font-mono text-xs">
                    {status === 'queued'
                      ? '> Waiting for runner...'
                      : status === 'completed'
                        ? '> Job completed successfully.'
                        : '> Initializing...'}
                  </p>
                ) : (
                  logs.map((line, i) => (
                    <p
                      key={i}
                      className={cn(
                        'font-mono text-xs leading-relaxed',
                        line.includes('Error') || line.includes('failed') || line.includes('error')
                          ? 'text-destructive'
                          : line.includes('completed') ||
                              line.includes('success') ||
                              line.includes('✓')
                            ? 'text-success'
                            : line.startsWith('>')
                              ? 'text-primary'
                              : 'text-muted-foreground'
                      )}
                    >
                      {line}
                    </p>
                  ))
                )}
                {status === 'running' && (
                  <span className="text-primary animate-pulse font-mono text-xs">▌</span>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          {status === 'completed' && (
            <Button size="sm" className="gap-2" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
              {t('downloadButton')}
            </Button>
          )}
          {status === 'failed' && (
            <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
              <RefreshCw className="h-3.5 w-3.5" />
              {t('retryButton')}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground gap-2"
            onClick={() =>
              window.open(
                `https://github.com/${settings.owner}/${settings.repo}/actions/runs/${effectiveRunId}`,
                '_blank'
              )
            }
          >
            <ExternalLink className="h-3.5 w-3.5" />
            مشاهده در گیت‌هاب
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground/60 text-[10px] font-medium tracking-wider uppercase">
        {label}
      </p>
      <div className="text-foreground">{children}</div>
    </div>
  )
}
