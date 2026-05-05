import { NextRequest, NextResponse } from 'next/server'
import { triggerWorkflow } from '@/lib/github'
import { saveJob } from '@/lib/store'
import crypto from 'crypto'

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

      // Normalize quality - add 'p' suffix if numeric value without 'p'
      if (quality !== 'best' && quality !== 'audio' && /^\d+$/.test(quality)) {
        quality = quality + 'p'
      }

      inputs.quality = quality
      inputs.format = options?.format || 'mp4'
      if (options?.filename) inputs.filename = options.filename
    } else if (type === 'direct') {
      inputs.filename = options?.filename || 'download'
    } else if (type === 'snapshot') {
      inputs.filename = options?.filename || 'snapshot.mhtml'
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
