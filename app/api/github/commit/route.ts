import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')
  const path = searchParams.get('path')

  if (!token || !owner || !repo || !path) {
    return NextResponse.json({ sha: null })
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=1&sha=main`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        Accept: 'application/vnd.github+json',
      },
    }
  )

  if (!res.ok) return NextResponse.json({ sha: null })

  const commits = await res.json()
  return NextResponse.json({ sha: (commits[0]?.sha as string) ?? null })
}
