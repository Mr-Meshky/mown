import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const token = searchParams.get('token')
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')

    if (!token || !owner || !repo) {
      return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 })
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/history.json`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        Accept: 'application/vnd.github+json',
      },
    })

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ history: [] })
      }
      return NextResponse.json(
        { error: `Failed to fetch history: ${res.statusText}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    const history = JSON.parse(content)

    return NextResponse.json({ history })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
