import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { JobStatus } from '@/lib/mock-data'
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface JobStatusBadgeProps {
  status: JobStatus | string
  className?: string
}

const statusIconMap: Record<string, React.ElementType> = {
  queued: Clock,
  in_progress: Loader2,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
}

const statusClassMap: Record<string, string> = {
  queued: 'border-warning/40 bg-warning/10 text-warning',
  in_progress: 'border-primary/40 bg-primary/10 text-primary',
  running: 'border-primary/40 bg-primary/10 text-primary',
  completed: 'border-success/40 bg-success/10 text-success',
  failed: 'border-destructive/40 bg-destructive/10 text-destructive',
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const t = useTranslations('common')
  const Icon = statusIconMap[status] || statusIconMap.queued
  const statusClass = statusClassMap[status] || statusClassMap.queued

  // Map status to translation key
  const statusKey =
    status === 'in_progress' ? 'in_progress' : status === 'running' ? 'in_progress' : status

  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', statusClass, className)}>
      <Icon
        className={cn(
          'h-3 w-3',
          (status === 'running' || status === 'in_progress') && 'animate-spin'
        )}
      />
      {t(`status.${statusKey}`)}
    </Badge>
  )
}
