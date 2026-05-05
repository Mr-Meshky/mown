import { Octokit } from 'octokit'

export interface RepoSettings {
  repoName: string
  owner: string
  createdAt: string
  lastSync: string
  workflows: {
    youtube: boolean
    direct: boolean
    snapshot: boolean
    soundcloud: boolean
  }
  totalDownloads: number
}

export const DEFAULT_SETTINGS: RepoSettings = {
  repoName: '',
  owner: '',
  createdAt: '',
  lastSync: '',
  workflows: {
    youtube: false,
    direct: false,
    snapshot: false,
    soundcloud: false,
  },
  totalDownloads: 0,
}

export async function getRepoSettings(
  token: string,
  owner: string,
  repo: string
): Promise<RepoSettings> {
  const octokit = new Octokit({ auth: token })

  try {
    const res = await octokit.repos.getContent({
      owner,
      repo,
      path: 'settings.json',
    })

    if ('content' in res.data) {
      const content = Buffer.from(res.data.content, 'base64').toString('utf-8')
      return { ...DEFAULT_SETTINGS, ...JSON.parse(content) }
    }
  } catch {
    // settings.json doesn't exist yet
  }

  return { ...DEFAULT_SETTINGS }
}

export async function updateRepoSettings(
  token: string,
  owner: string,
  repo: string,
  updates: Partial<RepoSettings>
): Promise<void> {
  const octokit = new Octokit({ auth: token })

  const current = await getRepoSettings(token, owner, repo)
  const updated = { ...current, ...updates, lastSync: new Date().toISOString() }

  let sha: string | undefined
  try {
    const res = await octokit.repos.getContent({
      owner,
      repo,
      path: 'settings.json',
    })
    if ('sha' in res.data) {
      sha = res.data.sha
    }
  } catch {
    // file doesn't exist
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'settings.json',
    message: 'mown: Update settings.json',
    content: Buffer.from(JSON.stringify(updated, null, 2)).toString('base64'),
    ...(sha ? { sha } : {}),
  })
}
