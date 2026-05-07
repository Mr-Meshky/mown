import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')

  if (!token || !owner || !repo) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/history.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json([])
      }
      return NextResponse.json(
        { error: `GitHub API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    if (data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf8')
      const parsed = JSON.parse(content)
      return NextResponse.json(parsed)
    }

    return NextResponse.json([])
  } catch {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
