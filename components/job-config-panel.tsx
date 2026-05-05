'use client'

import { FileAudio, FileVideo, Globe, HardDrive } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DownloadType, InputType } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface JobConfigPanelProps {
  inputType: InputType
  downloadType: DownloadType
  onDownloadTypeChange: (val: DownloadType) => void
  quality: string
  onQualityChange: (val: string) => void
  filename: string
  onFilenameChange: (val: string) => void
}

const downloadTypes: {
  type: DownloadType
  label: string
  description: string
  icon: React.ElementType
  compatibleWith: InputType[]
}[] = [
  {
    type: 'video',
    label: 'Video',
    description: 'MP4',
    icon: FileVideo,
    compatibleWith: ['youtube'],
  },
  {
    type: 'audio',
    label: 'Audio',
    description: 'MP3',
    icon: FileAudio,
    compatibleWith: ['youtube', 'soundcloud'],
  },
  {
    type: 'webpage',
    label: 'Webpage',
    description: 'ZIP',
    icon: Globe,
    compatibleWith: ['snapshot'],
  },
  {
    type: 'raw',
    label: 'Raw File',
    description: 'Original',
    icon: HardDrive,
    compatibleWith: ['direct'],
  },
]

const youtubeQualityOptions = ['2160p', '1440p', '1080p', '720p', '480p', '360p', 'best']
const soundcloudQualityOptions = ['320k', '256k', '192k', '128k', 'best']

const typeKeyMap: Record<string, string> = {
  video: 'video',
  audio: 'audio',
  webpage: 'snapshot',
  raw: 'direct',
}

export function JobConfigPanel({
  inputType,
  downloadType,
  onDownloadTypeChange,
  quality,
  onQualityChange,
}: JobConfigPanelProps) {
  const t = useTranslations('jobConfig')

  return (
    <div className="space-y-5">
      {/* Download type selector */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-sm">{t('type.label')}</Label>
        <div className="grid grid-cols-2 gap-2">
          {downloadTypes.map(({ type, description, icon: Icon, compatibleWith }) => {
            const disabled = !compatibleWith.includes(inputType)
            const selected = downloadType === type
            const typeKey = typeKeyMap[type] || type
            return (
              <button
                key={type}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onDownloadTypeChange(type)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border p-3 text-start text-sm transition-all',
                  selected
                    ? 'border-primary/50 bg-primary/8 text-foreground'
                    : 'border-border bg-background text-muted-foreground',
                  disabled
                    ? 'cursor-not-allowed opacity-30'
                    : 'hover:border-border/80 hover:bg-secondary hover:text-foreground cursor-pointer'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', selected ? 'text-primary' : '')} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {t(`type.${typeKey}` as Parameters<typeof t>[0])}
                  </p>
                  <p className="text-[10px] opacity-60">{description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quality selector (YouTube and SoundCloud) */}
      {(downloadType === 'video' || downloadType === 'audio') &&
        (inputType === 'youtube' || inputType === 'soundcloud') && (
          <div className="space-y-1.5">
            <Label htmlFor="quality" className="text-muted-foreground text-sm">
              {t('quality.label')}
            </Label>
            <Select value={quality} onValueChange={onQualityChange}>
              <SelectTrigger id="quality" className="w-full">
                <SelectValue placeholder={t('quality.label')} />
              </SelectTrigger>
              <SelectContent>
                {(inputType === 'soundcloud'
                  ? soundcloudQualityOptions
                  : youtubeQualityOptions
                ).map(q => (
                  <SelectItem key={q} value={q}>
                    {t(`quality.${q}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
    </div>
  )
}
