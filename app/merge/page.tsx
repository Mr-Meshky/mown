'use client'

import { FileArchive, Loader2, Merge, Trash2, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export default function MergePage() {
  const t = useTranslations('merge')
  const router = useRouter()

  const [files, setFiles] = useState<File[]>([])
  const [merging, setMerging] = useState(false)
  const [progress, setProgress] = useState(0)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    const zipFiles = selected.filter(f => f.name.endsWith('.zip'))

    if (zipFiles.length === 0) {
      toast.error(t('errors.noZip'))
      return
    }

    setFiles(prev => [...prev, ...zipFiles])
    toast.success(t('filesAdded', { count: String(zipFiles.length) }))
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  function clearAll() {
    setFiles([])
    setProgress(0)
  }

  async function handleMerge() {
    if (files.length === 0) {
      toast.error(t('errors.noFiles'))
      return
    }

    setMerging(true)
    setProgress(10)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      setProgress(30)

      const res = await fetch('/api/merge', {
        method: 'POST',
        body: formData,
      })

      setProgress(70)

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Merge failed')
      }

      setProgress(90)

      // Download the result
      const blob = await res.blob()
      const filename =
        res.headers.get('Content-Disposition')?.match(/filename="?([^"]+)"?/)?.[1] || 'merged.zip'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = decodeURIComponent(filename)
      a.click()
      URL.revokeObjectURL(url)

      setProgress(100)
      toast.success(t('success'))

      // Clear files after successful merge
      setTimeout(() => {
        clearAll()
      }, 1000)
    } catch (error) {
      toast.error(t('errors.mergeFailed'), {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setMerging(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-primary" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{t('description')}</p>

          {/* Upload area */}
          <label
            className={cn(
              'border-border hover:border-primary/40 bg-background/50 flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors',
              merging && 'pointer-events-none opacity-50'
            )}
          >
            <Upload className="text-muted-foreground h-10 w-10" />
            <div className="text-center">
              <p className="text-sm font-medium">{t('dropzone')}</p>
              <p className="text-muted-foreground mt-1 text-xs">{t('dropzoneHint')}</p>
            </div>
            <input
              type="file"
              accept=".zip"
              multiple
              onChange={handleFileSelect}
              className="sr-only"
              disabled={merging}
            />
          </label>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('filesSelected', { count: String(files.length) })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={merging}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('clearAll')}
                </Button>
              </div>

              <div className="max-h-48 space-y-1 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2 rounded-md border border-border p-2 text-sm"
                  >
                    <FileArchive className="text-muted-foreground h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                      disabled={merging}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {progress > 0 && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-muted-foreground text-right text-xs">{progress}%</p>
            </div>
          )}

          {/* Merge button */}
          <Button
            type="button"
            onClick={handleMerge}
            disabled={files.length === 0 || merging}
            className="w-full gap-2"
          >
            {merging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('merging')}
              </>
            ) : (
              <>
                <Merge className="h-4 w-4" />
                {t('mergeButton')}
              </>
            )}
          </Button>

          {/* Back button */}
          <Button type="button" variant="ghost" onClick={() => router.push('/')} className="w-full">
            {t('back')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
