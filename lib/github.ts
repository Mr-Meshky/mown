import { Octokit } from '@octokit/rest'
import AdmZip from 'adm-zip'
import sodium from 'libsodium-wrappers'

import {
  getDirectWorkflow,
  getSnapshotWorkflow,
  getSoundcloudWorkflow,
  getYoutubeWorkflow,
} from './workflows'

export type JobType = 'youtube' | 'direct' | 'snapshot' | 'soundcloud'

export type RunStatus = {
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'cancelled' | null
  runId: number
}

function getWorkflows(): Record<JobType, { filename: string; content: string }> {
  return {
    youtube: { filename: 'youtube-download.yml', content: getYoutubeWorkflow() },
    direct: { filename: 'direct-download.yml', content: getDirectWorkflow() },
    snapshot: { filename: 'snapshot.yml', content: getSnapshotWorkflow() },
    soundcloud: { filename: 'soundcloud-download.yml', content: getSoundcloudWorkflow() },
  }
}

function getOctokit(token: string) {
  return new Octokit({ auth: token })
}

export async function getAuthenticatedUser(token: string) {
  const octokit = getOctokit(token)
  const { data } = await octokit.rest.users.getAuthenticated()
  return { login: data.login }
}

export async function setupRepo(token: string, owner: string, repoName: string = 'mown-downloads') {
  const octokit = getOctokit(token)

  try {
    await octokit.rest.repos.get({ owner, repo: repoName })
  } catch {
    await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      auto_init: true,
    })
  }

  const workflows = getWorkflows()
  for (const { filename, content } of Object.values(workflows)) {
    const path = `.github/workflows/${filename}`
    const encoded = Buffer.from(content).toString('base64')
    let sha: string | undefined

    try {
      const { data } = await octokit.rest.repos.getContent({ owner, repo: repoName, path })
      if ('sha' in data) sha = data.sha
    } catch {
      // file doesn't exist yet
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path,
      message: sha ? `Update ${filename} workflow` : `Add ${filename} workflow`,
      content: encoded,
      ...(sha ? { sha } : {}),
    })
  }

  return { owner, repo: repoName }
}

export async function saveYouTubeCookies(
  token: string,
  owner: string,
  repo: string,
  cookiesText: string
) {
  const octokit = getOctokit(token)

  const { data: keyData } = await octokit.rest.actions.getRepoPublicKey({
    owner,
    repo,
  })

  // Use libsodium for sealed box encryption
  const publicKey = Buffer.from(keyData.key, 'base64')

  await new Promise<void>((resolve, reject) => {
    sodium.ready
      .then(() => {
        try {
          const message = Buffer.from(cookiesText, 'utf8')
          const sealed = (sodium as any).crypto_box_seal(message, publicKey)
          const encoded = Buffer.from(sealed).toString('base64')

          octokit.rest.actions
            .createOrUpdateRepoSecret({
              owner,
              repo,
              secret_name: 'YT_COOKIES',
              encrypted_value: encoded,
              key_id: keyData.key_id,
            })
            .then(() => resolve())
            .catch(reject)
        } catch (err) {
          reject(err)
        }
      })
      .catch(reject)
  })
}

export async function checkCookies(token: string, owner: string, repo: string): Promise<boolean> {
  const octokit = getOctokit(token)
  try {
    const { data } = await octokit.rest.actions.getRepoSecret({
      owner,
      repo,
      secret_name: 'YT_COOKIES',
    })
    return !!data.name
  } catch {
    return false
  }
}

export async function triggerWorkflow(
  token: string,
  owner: string,
  repo: string,
  workflowFile: string,
  inputs: Record<string, string>
) {
  const octokit = getOctokit(token)

  try {
    await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowFile,
      ref: 'main',
      inputs,
    })
  } catch (error: any) {
    if (error.status === 404 || error.status === 422) {
      // Workflow missing or outdated (e.g. new inputs not yet in repo) — push latest files and retry
      await setupRepo(token, owner, repo)
      await octokit.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowFile,
        ref: 'main',
        inputs,
      })
    } else {
      throw error
    }
  }

  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000))

    const { data } = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflowFile,
      event: 'workflow_dispatch',
      per_page: 5,
    })

    const now = Date.now()
    const run = data.workflow_runs.find((r: any) => {
      const created = new Date(r.created_at).getTime()
      return now - created < 15000
    })

    if (run) return { runId: run.id }
  }

  throw new Error('Could not resolve workflow run ID')
}

export async function getRunStatus(
  token: string,
  owner: string,
  repo: string,
  runId: number
): Promise<RunStatus> {
  const octokit = getOctokit(token)
  const { data } = await octokit.rest.actions.getWorkflowRun({
    owner,
    repo,
    run_id: runId,
  })

  return {
    status: data.status as 'queued' | 'in_progress' | 'completed',
    conclusion: data.conclusion as 'success' | 'failure' | 'cancelled' | null,
    runId: data.id,
  }
}

export async function getRunLogs(
  token: string,
  owner: string,
  repo: string,
  runId: number
): Promise<string> {
  const octokit = getOctokit(token)

  const response = await octokit.rest.actions.downloadWorkflowRunLogs({
    owner,
    repo,
    run_id: runId,
    request: { redirect: 'follow' },
  })

  const zip = new AdmZip(Buffer.from(response.data as ArrayBuffer))
  const entries = zip.getEntries()
  const logs: string[] = []

  for (const entry of entries) {
    if (!entry.entryName.endsWith('.txt')) continue
    logs.push(entry.getData().toString('utf8'))
  }

  return logs.join('\n')
}

export async function downloadArtifact(token: string, owner: string, repo: string, runId: number) {
  const octokit = getOctokit(token)

  const { data: artifactsData } = await octokit.rest.actions.listWorkflowRunArtifacts({
    owner,
    repo,
    run_id: runId,
  })

  if (!artifactsData.artifacts.length) {
    throw new Error('No artifacts found')
  }

  const artifact = artifactsData.artifacts[0]
  const { data: zipData } = await octokit.rest.actions.downloadArtifact({
    owner,
    repo,
    artifact_id: artifact.id,
    archive_format: 'zip',
    request: { redirect: 'follow' },
  })

  const zip = new AdmZip(Buffer.from(zipData as ArrayBuffer))
  const entries = zip.getEntries()

  if (entries.length === 1) {
    const entry = entries[0]
    return {
      buffer: entry.getData(),
      filename: entry.entryName,
      isMultipart: false,
    }
  }

  return {
    buffer: Buffer.from(zip.toBuffer()),
    filename: 'parts.zip',
    isMultipart: true,
  }
}

export interface HistoryEntry {
  id: string
  filename: string
  title: string
  url?: string
  githubUrl: string
  downloadUrl?: string
  thumbnail: string
  type: 'youtube' | 'soundcloud' | 'direct' | 'snapshot'
  quality: string
  format: string
  duration: string
  uploader?: string
  track?: string
  album?: string
  size: string
  createdAt: string
  isSplit: boolean
  parts: Array<{
    filename: string
    size: string
    downloadUrl?: string
  }>
  fileCount?: number
  runId?: string
}

export async function fetchHistory(
  token: string,
  owner: string,
  repo: string
): Promise<HistoryEntry[]> {
  const octokit = getOctokit(token)

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'history.json',
    })

    if ('content' in data && data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf8')
      const entries: HistoryEntry[] = JSON.parse(content)

      // Generate authenticated download URLs using the API route
      const baseUrl = `/api/jobs`
      return entries.map(entry => {
        const downloadUrl = entry.runId
          ? `${baseUrl}/${entry.runId}/download?token=${encodeURIComponent(token)}&owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
          : undefined

        return {
          ...entry,
          downloadUrl,
          parts: entry.parts?.map(part => ({
            ...part,
            downloadUrl: entry.runId
              ? `${baseUrl}/${entry.runId}/download?token=${encodeURIComponent(token)}&owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
              : undefined,
          })) || [],
        }
      })
    }

    return []
  } catch {
    return []
  }
}

export async function fetchFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const octokit = getOctokit(token)

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    })

    if ('content' in data && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf8')
    }

    return null
  } catch {
    return null
  }
}
