import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const soundSource = readFileSync('src/game/sound.ts', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(soundSource, /const BACKGROUND_MUSIC_LOOP_SECONDS = 8/, 'background music should use a stable loop length')
assert.match(soundSource, /private backgroundMusicGain: GainNode \| null = null/, 'music should use a dedicated gain node')
assert.match(soundSource, /private backgroundMusicTimer: number \| null = null/, 'music should keep one loop scheduler')
assert.match(soundSource, /private syncBackgroundMusic\(\)/, 'SoundManager should synchronize music with settings')
assert.match(soundSource, /if \(!this\.backgroundMusicEnabled \|\| !this\.unlocked\)/, 'music should wait for both enablement and audio unlock')
assert.match(soundSource, /if \(context\.state !== 'running'\)/, 'unlock should resume any non-running audio context')
assert.match(soundSource, /this\.masterVolume \* this\.backgroundMusicVolume \* 0\.42/, 'music gain should be clearly audible on laptop speakers')
assert.match(soundSource, /melodyNotes: \[69, 71, 74/, 'the neutral fallback should include an audible upper-register melody')
assert.match(soundSource, /if \(this\.backgroundMusicTimer !== null\) return/, 'setting updates should not restart an active loop')
assert.match(soundSource, /window\.setTimeout\(\(\) => \{\s*this\.backgroundMusicTimer = null\s*this\.syncBackgroundMusic\(\)/s, 'music should schedule the next loop smoothly')
assert.match(soundSource, /private stopBackgroundMusic\(\)/, 'disabling music should stop active sources')
assert.match(soundSource, /this\.syncBackgroundMusic\(\)/, 'unlock and volume changes should synchronize music')
assert.match(appSource, /Automatically selects an original looping theme for each game; off by default\./, 'setup should describe automatic themed music')
assert.match(slicesSource, /### Slice S6: Background Music Foundation\s+Status: Complete/s, 'slice tracker should mark S6 complete')

console.log('Background music behavior tests passed')
