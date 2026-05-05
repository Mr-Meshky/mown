import { readFileSync } from 'fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'path'

const _dirname = dirname(fileURLToPath(import.meta.url))

function loadWorkflow(filename: string): string {
  const filePath = resolve(_dirname, filename)
  return readFileSync(filePath, 'utf-8')
}

export const YOUTUBE_WORKFLOW = loadWorkflow('youtube-download.yml')
export const DIRECT_WORKFLOW = loadWorkflow('direct-download.yml')
export const SNAPSHOT_WORKFLOW = loadWorkflow('snapshot.yml')
export const SOUNDCLOUD_WORKFLOW = loadWorkflow('soundcloud-download.yml')
