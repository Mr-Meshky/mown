export type JobStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'running'
export type DownloadType = 'video' | 'audio' | 'webpage' | 'raw' | string
export type InputType = 'youtube' | 'direct' | 'snapshot' | 'soundcloud'

export interface Job {
  id: string
  url: string
  inputType: InputType
  downloadType: DownloadType
  quality?: string
  filename?: string
  repo: string
  status: JobStatus
  createdAt: string
  updatedAt: string
  fileSize?: string
  duration?: string
  logs: string[]
  progress: number
}
