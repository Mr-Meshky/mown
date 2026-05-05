'use client'

import { Play, Youtube } from 'lucide-react'
import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface VideoPreviewCardProps {
  url: string
}

function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

export function VideoPreviewCard({ url }: VideoPreviewCardProps) {
  const videoId = extractYouTubeId(url)
  const [loaded, setLoaded] = useState(false)

  if (!videoId) return null

  const thumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`

  return (
    <Card className="border-border bg-card overflow-hidden">
      <div className="relative aspect-video w-full bg-black">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-none" />
          </div>
        )}
        <img
          src={thumb}
          alt="YouTube video thumbnail"
          className="h-full w-full object-cover"
          onLoad={() => setLoaded(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
            <Play className="h-5 w-5 translate-x-0.5 text-black" fill="black" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5">
          <Youtube className="h-3 w-3 text-red-500" />
          <span className="font-mono text-[10px] text-white">youtube.com</span>
        </div>
      </div>
    </Card>
  )
}
