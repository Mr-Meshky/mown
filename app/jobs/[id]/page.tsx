'use client'

import { ChevronLeft, History, Plus } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { JobStatusCard } from '@/components/job-status-card'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { getJobByRunId, type Job as StoreJob } from '@/lib/store'

export default function JobPage() {
  const params = useParams()
  const router = useRouter()
  const runId = Number(params.id)
  const [job, setJob] = useState<StoreJob | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const j = getJobByRunId(runId)
    setJob(j)
    setLoading(false)
    if (!j) router.push('/')
  }, [runId, router])

  const t = useTranslations('common')
  const tHistory = useTranslations('history')
  const tJobStatus = useTranslations('jobStatus')

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">{t('loading')}</p>
      </div>
    )
  }

  if (!job) return null

  const mockJob = {
    id: job.id,
    url: job.url,
    inputType: job.type as 'youtube' | 'direct' | 'snapshot',
    downloadType:
      job.type === 'youtube'
        ? ('video' as const)
        : job.type === 'snapshot'
          ? ('webpage' as const)
          : ('raw' as const),
    quality: job.options?.quality,
    filename: job.options?.filename,
    repo: job.repo,
    status: job.status === 'in_progress' ? ('running' as const) : job.status,
    createdAt: job.createdAt,
    updatedAt: job.createdAt,
    logs: [] as string[],
    progress: job.status === 'completed' ? 100 : job.status === 'in_progress' ? 60 : 0,
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        {/* Breadcrumb nav */}
        <div className="mb-6 flex items-center gap-1.5">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 gap-1 text-xs">
              <Plus className="h-3 w-3" />
              {tHistory('newDownload')}
            </Button>
          </Link>
          <span className="text-border text-xs">/</span>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 gap-1 text-xs">
              <History className="h-3 w-3" />
              {tHistory('title')}
            </Button>
          </Link>
          <span className="text-border text-xs">/</span>
          <span className="text-foreground font-mono text-xs">#{job.runId}</span>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Link href="/history">
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
                <ChevronLeft className="h-4 w-4 rtl:-rotate-180" />
              </Button>
            </Link>
            <div>
              <h1 className="text-foreground text-xl font-semibold tracking-tight">
                {tJobStatus('title')}
              </h1>
              <p className="text-muted-foreground mt-0.5 font-mono text-sm">Run #{job.runId}</p>
            </div>
          </div>
        </div>

        <JobStatusCard job={mockJob} runId={job.runId} />
      </main>
    </div>
  )
}
