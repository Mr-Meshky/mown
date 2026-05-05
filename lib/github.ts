import { Octokit } from '@octokit/rest'
import AdmZip from 'adm-zip'
import sodium from 'libsodium-wrappers'

import {
  DIRECT_WORKFLOW,
  SNAPSHOT_WORKFLOW,
  SOUNDCLOUD_WORKFLOW,
  YOUTUBE_WORKFLOW,
} from './workflows'

export type JobType = 'youtube' | 'direct' | 'snapshot' | 'soundcloud'

export type RunStatus = {
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'cancelled' | null
  runId: number
}

const WORKFLOWS: Record<JobType, { filename: string; content: string }> = {
  youtube: { filename: 'youtube-download.yml', content: YOUTUBE_WORKFLOW },
  direct: { filename: 'direct-download.yml', content: DIRECT_WORKFLOW },
  snapshot: { filename: 'snapshot.yml', content: SNAPSHOT_WORKFLOW },
  soundcloud: { filename: 'soundcloud-download.yml', content: SOUNDCLOUD_WORKFLOW },
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

  for (const { filename, content } of Object.values(WORKFLOWS)) {
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

  await octokit.rest.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id: workflowFile,
    ref: 'main',
    inputs,
  })

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
