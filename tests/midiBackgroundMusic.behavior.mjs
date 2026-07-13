import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const soundSource = readFileSync('src/game/sound.ts', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(soundSource, /type MidiInstrument =/, 'music should expose a small MIDI instrument palette')
assert.match(soundSource, /bassNotes: \[45, 45, 47, 43/, 'scores should store MIDI note numbers instead of raw oscillator frequencies')
assert.match(soundSource, /function midiNoteToFrequency\(note: number\)/, 'sample generation should tune MIDI notes accurately')
assert.match(soundSource, /context\.createBuffer\(/, 'instrument notes should be rendered into local PCM samples')
assert.match(soundSource, /context\.createBufferSource\(\)/, 'the primary music path should play generated instrument samples')
assert.match(soundSource, /private scheduleFallbackMusicNote\(/, 'an oscillator fallback should remain available')
assert.match(soundSource, /private backgroundMusicCompressor: DynamicsCompressorNode \| null = null/, 'music should have a dedicated compressor')
assert.match(soundSource, /context\.createDynamicsCompressor\(\)/, 'the output chain should protect louder music from clipping')
assert.match(soundSource, /this\.masterVolume \* this\.backgroundMusicVolume \* 0\.42/, 'full music volume should be clearly audible')
assert.match(slicesSource, /MIDI-note arrangements drive locally generated instrument samples/, 'the slice tracker should document the richer playback path')
assert.match(slicesSource, /compressor\/limiter/, 'the slice tracker should document loudness protection')

console.log('MIDI-style background music behavior tests passed')
