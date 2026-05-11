import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'

import { triggerWorkflow } from '@/lib/github'
import { saveJob } from '@/lib/store'

const WORKFLOW_MAP: Record<string, string> = {
  youtube: 'youtube-download.yml',
  direct: 'direct-download.yml',
  snapshot: 'snapshot.yml',
  soundcloud: 'soundcloud-download.yml',
}

export async function POST(request: NextRequest) {
  try {
    const { token, owner, repo, type, url, options } = await request.json()

    if (!token || !owner || !repo || !type || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const workflowFile = WORKFLOW_MAP[type]
    if (!workflowFile) {
      return NextResponse.json({ error: 'Invalid job type' }, { status: 400 })
    }

    // Parse owner/repo if passed as "owner/repo"
    let ownerName = owner
    let repoName = repo
    if (repo.includes('/')) {
      ;[ownerName, repoName] = repo.split('/')
    } else if (owner.includes('/')) {
      ;[ownerName, repoName] = owner.split('/')
    }

    const inputs: Record<string, string> = { url }
    if (type === 'youtube') {
      let quality = options?.quality || 'best'

      // Normalize numeric quality - add 'p' suffix (e.g. '1080' → '1080p')
      if (quality !== 'best' && quality !== 'audio-only' && /^\d+$/.test(quality)) {
        quality = quality + 'p'
      }

      inputs.quality = quality
      if (options?.filename) inputs.filename = options.filename
    } else if (type === 'soundcloud') {
      inputs.quality = options?.quality || 'best'
      if (options?.bale_token) inputs.bale_token = options.bale_token
      if (options?.bale_chat_id) inputs.bale_chat_id = options.bale_chat_id
      if (options?.rubika_token) inputs.rubika_token = options.rubika_token
      if (options?.rubika_chat_id) inputs.rubika_chat_id = options.rubika_chat_id
    } else if (type === 'direct') {
      inputs.filename = options?.filename || 'download'
    } else if (type === 'snapshot') {
      // snapshot workflow only accepts url input
    }

    const { runId } = await triggerWorkflow(token, ownerName, repoName, workflowFile, inputs)

    const jobId = crypto.randomUUID()
    saveJob({
      id: jobId,
      runId,
      owner: ownerName,
      repo: repoName,
      type,
      url,
      options,
      status: 'queued',
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ runId, jobId })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger job' },
      { status: 500 }
    )
  }
}
