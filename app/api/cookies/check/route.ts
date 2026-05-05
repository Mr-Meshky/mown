import { type NextRequest, NextResponse } from 'next/server'

import { checkCookies } from '@/lib/github'

export async function POST(request: NextRequest) {
  try {
    const { token, owner, repo } = await request.json()

    if (!token || !owner || !repo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const exists = await checkCookies(token, owner, repo)
    return NextResponse.json({ exists })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check cookies' },
      { status: 500 }
    )
  }
}
