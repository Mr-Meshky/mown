import { Octokit } from '@octokit/rest'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, owner, repo, cookies } = body

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: 'Missing required fields: token, owner, repo' },
        { status: 400 }
      )
    }

    const octokit = new Octokit({ auth: token })

    // Update the YT_COOKIES secret
    // First, get the public key for the repo
    const {
      data: { key_id: keyId, key },
    } = await octokit.actions.getRepoPublicKey({
      owner,
      repo,
    })

    // Encrypt the secret value using libsodium-wrappers
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports
    const sodium = require('libsodium-wrappers') as typeof import('libsodium-wrappers')
    await sodium.ready

    const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
    const binsec = sodium.from_string(cookies || '')
    const encBytes = sodium.crypto_box_seal(binsec, binkey)
    const encryptedValue = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)

    await octokit.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name: 'YT_COOKIES',
      encrypted_value: encryptedValue,
      key_id: keyId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating cookie secret:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update cookies' },
      { status: 500 }
    )
  }
}
