export type JobType = 'youtube' | 'direct' | 'snapshot' | 'soundcloud'
export type JobStatus = 'queued' | 'in_progress' | 'completed' | 'failed'
export type DownloadType = 'video' | 'audio' | 'webpage' | 'raw' | string
export type InputType = 'youtube' | 'direct' | 'snapshot'

export interface Job {
  id: string
  runId: number
  owner: string
  repo: string
  type: JobType
  url: string
  options: Record<string, string>
  status: JobStatus
  createdAt: string
  updatedAt?: string
  downloadType?: DownloadType
  quality?: string
  filename?: string
  fileSize?: string
  duration?: string
  logs?: string[]
  progress?: number
  commitSha?: string
}

export interface Settings {
  token: string
  owner: string
  repo: string
  cookiesUploaded: boolean
  baleToken: string
  baleChatId: string
  baleEnabled: boolean
  rubikaToken: string
  rubikaChatId: string
  rubikaEnabled: boolean
}

const STORE_KEY = 'mown_jobs'
const SETTINGS_KEY = 'mown_settings'

const DEFAULT_SETTINGS: Settings = {
  token: '',
  owner: '',
  repo: 'mown-downloads',
  cookiesUploaded: false,
  baleToken: '',
  baleChatId: '',
  baleEnabled: false,
  rubikaToken: '',
  rubikaChatId: '',
  rubikaEnabled: false,
}

// Job functions
export function saveJob(job: Job): void {
  const jobs = getJobs()
  jobs.push(job)
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORE_KEY, JSON.stringify(jobs))
  }
}

export function updateJob(runId: number, updates: Partial<Job>): void {
  const jobs = getJobs()
  const index = jobs.findIndex(j => j.runId === runId)
  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEY, JSON.stringify(jobs))
    }
  }
}

export function getJobs(): Job[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getJobByRunId(runId: number): Job | null {
  const jobs = getJobs()
  return jobs.find(j => j.runId === runId) ?? null
}

// Settings functions
export function saveSettings(s: Partial<Settings>): void {
  const current = getSettings()
  const updated = { ...current, ...s }
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  }
}

export function getSettings(): Settings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}
