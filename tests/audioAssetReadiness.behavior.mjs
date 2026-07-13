import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const soundSource = readFileSync('src/game/sound.ts', 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(soundSource, /const MAX_INSTRUMENT_SAMPLE_CACHE_ENTRIES = 64/, 'mobile music sample memory should have a fixed cap')
assert.match(soundSource, /private soundEffectsCompressor: DynamicsCompressorNode \| null = null/, 'sound effects should use a reusable output limiter')
assert.match(soundSource, /private ensureSoundEffectsOutput\(context: AudioContext\): DynamicsCompressorNode/, 'sound effects should initialize a protected output bus')
assert.match(soundSource, /gain\.connect\(this\.ensureSoundEffectsOutput\(context\)\)/, 'every generated sound cue should pass through the limiter')
assert.match(soundSource, /this\.instrumentSampleCache\.size >= MAX_INSTRUMENT_SAMPLE_CACHE_ENTRIES/, 'instrument cache should evict samples before exceeding its cap')

assert.equal(packageJson.scripts['check:audio'], 'node scripts/check-audio-assets.mjs', 'package scripts should expose the audio packaging audit')
assert.ok(existsSync('scripts/check-audio-assets.mjs'), 'audio packaging audit script should exist')
assert.ok(existsSync('docs/audio-asset-policy.md'), 'audio provenance and APK policy should be documented')

const checkerSource = readFileSync('scripts/check-audio-assets.mjs', 'utf8')
const policySource = readFileSync('docs/audio-asset-policy.md', 'utf8')
assert.match(checkerSource, /MAX_SINGLE_AUDIO_BYTES = 1_500_000/, 'individual audio assets should have a shipping budget')
assert.match(checkerSource, /MAX_TOTAL_AUDIO_BYTES = 4_000_000/, 'all audio assets should have a combined shipping budget')
for (const extension of ['.mp3', '.ogg', '.wav', '.m4a', '.aac', '.mid', '.midi']) {
  assert.match(checkerSource, new RegExp(extension.replace('.', '\\.')), `${extension} should be recognized by the audit`)
}
assert.match(policySource, /No binary audio assets are currently shipped/, 'policy should record the generated-audio baseline')
assert.match(policySource, /Android 12\+/, 'policy should document the target Android validation baseline')
assert.match(policySource, /original procedural synthesis/, 'policy should document audio provenance')

assert.match(slicesSource, /### Slice S8: Audio Asset Polish And APK Readiness\s+Status: Complete/s, 'slice tracker should mark S8 implementation complete')
assert.match(slicesSource, /No binary audio assets are shipped/, 'tracker should record the zero-payload audit result')

console.log('Audio asset readiness behavior tests passed')
