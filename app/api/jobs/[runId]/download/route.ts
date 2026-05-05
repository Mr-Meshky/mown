import { type NextRequest, NextResponse } from 'next/server'

import { downloadArtifact } from '@/lib/github'

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    mhtml: 'multipart/related',
    html: 'text/html',
    pdf: 'application/pdf',
    zip: 'application/zip',
    txt: 'text/plain',
  }
  return types[ext || ''] || 'application/octet-stream'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params
    const { searchParams } = request.nextUrl
    const token = searchParams.get('token')
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')

    if (!token || !owner || !repo) {
      return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 })
    }

    const { buffer, filename, isMultipart } = await downloadArtifact(
      token,
      owner,
      repo,
      Number(runId)
    )

    const headers = new Headers()
    headers.set('Content-Type', isMultipart ? 'application/zip' : getMimeType(filename))
    headers.set(
      'Content-Disposition',
      `attachment; filename="${isMultipart ? 'parts.zip' : filename}"`
    )
    headers.set('Content-Length', buffer.length.toString())

    return new NextResponse(buffer, { headers })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    )
  }
}
