import { type NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUser, setupRepo } from '@/lib/github'

export async function POST(request: NextRequest) {
  try {
    const { token, repo } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const { login } = await getAuthenticatedUser(token)
    const result = await setupRepo(token, login, repo)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup failed' },
      { status: 500 }
    )
  }
}
