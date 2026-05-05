import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/store'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const url = searchParams.get('url')
  const token = searchParams.get('token')

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 })
  }

  // If token is provided, try to download via backend
  if (token) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const buffer = await res.arrayBuffer()
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${url.split('/').pop()}"`,
          },
        })
      }
    } catch {
      // Fall through to redirect
    }
  }

  // Redirect to raw URL
  return NextResponse.redirect(url)
}
