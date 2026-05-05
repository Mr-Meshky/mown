import { NextRequest, NextResponse } from 'next/server'
import AdmZip from 'adm-zip'
import { writeFileSync, unlinkSync, readFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Extract all parts from zip files
    const allParts: { name: string; data: Buffer }[] = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const zip = new AdmZip(buffer)

      for (const entry of zip.getEntries()) {
        if (!entry.isDirectory) {
          allParts.push({
            name: entry.entryName,
            data: entry.getData(),
          })
        }
      }
    }

    if (allParts.length === 0) {
      throw new Error('No files found in archives')
    }

    // Sort parts by name to ensure correct order
    allParts.sort((a, b) => a.name.localeCompare(b.name))

    // Group parts by base filename (remove part number suffix)
    const groups = new Map<string, Buffer[]>()
    for (const part of allParts) {
      // Match patterns like: testfilepart00.bin, filepart01.txt, etc.
      const match = part.name.match(/^(.*?)(part\d+)?(\..*?)?$/)
      if (match) {
        const baseName = match[1] || 'merged'
        const ext = match[3] || ''
        const key = `${baseName}${ext}`

        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(part.data)
      }
    }

    // Merge each group
    const results: { filename: string; buffer: Buffer }[] = []
    for (const [key, partBuffers] of groups) {
      // Sort buffers by their original part name
      // We need to maintain the order from allParts
      const sortedBuffers = partBuffers.map((buf, idx) => {
        const partIndex = allParts.findIndex(p => p.data === buf)
        return { buf, index: partIndex }
      }).sort((a, b) => a.index - b.index).map(item => item.buf)

      // Concatenate all parts
      const totalLength = sortedBuffers.reduce((sum, buf) => sum + buf.length, 0)
      const merged = Buffer.concat(sortedBuffers, totalLength)

      const filename = key.includes('/') ? key.split('/').pop()! : key
      results.push({
        filename,
        buffer: merged,
      })
    }

    // If single file, return it directly
    if (results.length === 1) {
      const result = results[0]
      return new NextResponse(result.buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(result.filename)}"`,
        },
      })
    }

    // If multiple files, create a zip
    const outputZip = new AdmZip()
    for (const result of results) {
      outputZip.addFile(result.filename, result.buffer)
    }

    const zipBuffer = outputZip.toBuffer()
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="merged-files.zip"',
      },
    })
  } catch (error) {
    console.error('Merge error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Merge failed' },
      { status: 500 }
    )
  }
}
