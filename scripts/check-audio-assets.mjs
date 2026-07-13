import { existsSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const MAX_SINGLE_AUDIO_BYTES = 1_500_000
const MAX_TOTAL_AUDIO_BYTES = 4_000_000
const SHIPPING_ROOTS = ['public', 'src/assets']
const browserAudioExtensions = new Set(['.mp3', '.ogg', '.wav', '.m4a', '.aac'])
const sourceOnlyAudioExtensions = new Set(['.mid', '.midi'])
const unsupportedAudioExtensions = new Set(['.aiff', '.flac', '.wma'])

function filesUnder(root) {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    return entry.isDirectory() ? filesUnder(path) : [path]
  })
}

const errors = []
const audioFiles = []

for (const path of SHIPPING_ROOTS.flatMap(filesUnder)) {
  const extension = extname(path).toLowerCase()
  if (sourceOnlyAudioExtensions.has(extension)) {
    errors.push(`${relative('.', path)}: MIDI is source-only; render or synthesize it for browser playback.`)
    continue
  }
  if (unsupportedAudioExtensions.has(extension)) {
    errors.push(`${relative('.', path)}: unsupported shipping audio format ${extension}.`)
    continue
  }
  if (!browserAudioExtensions.has(extension)) continue
  const bytes = statSync(path).size
  audioFiles.push({ path, bytes })
  if (bytes > MAX_SINGLE_AUDIO_BYTES) {
    errors.push(`${relative('.', path)}: ${bytes} bytes exceeds the ${MAX_SINGLE_AUDIO_BYTES}-byte per-file budget.`)
  }
}

const totalBytes = audioFiles.reduce((total, file) => total + file.bytes, 0)
if (totalBytes > MAX_TOTAL_AUDIO_BYTES) {
  errors.push(`Audio payload is ${totalBytes} bytes, exceeding the ${MAX_TOTAL_AUDIO_BYTES}-byte total budget.`)
}

if (errors.length > 0) {
  console.error(`Audio asset audit failed:\n- ${errors.join('\n- ')}`)
  process.exitCode = 1
} else if (audioFiles.length === 0) {
  console.log('Audio asset audit passed: no binary audio assets; sound is generated with Web Audio.')
} else {
  console.log(`Audio asset audit passed: ${audioFiles.length} files, ${totalBytes} bytes total.`)
}
