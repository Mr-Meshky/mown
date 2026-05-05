import { type NextRequest, NextResponse } from 'next/server'

import { getRunLogs } from '@/lib/github'

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

    const logs = await getRunLogs(token, owner, repo, Number(runId))
    return NextResponse.json({ logs })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get logs' },
      { status: 500 }
    )
  }
}
