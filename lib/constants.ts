import { FileAudio, FileVideo, Globe, HardDrive } from 'lucide-react'
import type { InputType } from './mock-data'

export const TYPE_ICONS: Record<string, React.ElementType> = {
  video: FileVideo,
  audio: FileAudio,
  webpage: Globe,
  raw: HardDrive,
}

export const INPUT_TYPE_LABELS: Record<InputType, string> = {
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
  direct: 'Direct URL',
  snapshot: 'Snapshot',
}

export const STATUS_COLORS: Record<string, string> = {
  queued: 'border-warning/40 bg-warning/10 text-warning',
  in_progress: 'border-primary/40 bg-primary/10 text-primary',
  running: 'border-primary/40 bg-primary/10 text-primary',
  completed: 'border-success/40 bg-success/10 text-success',
  failed: 'border-destructive/40 bg-destructive/10 text-destructive',
}

export const STATUS_ICONS: Record<string, React.ElementType> = {
  queued: Clock,
  in_progress: Loader2,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
}

// Re-export needed icons
import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react'

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}
