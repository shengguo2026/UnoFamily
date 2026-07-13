import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const soundSource = readFileSync('src/game/sound.ts', 'utf8')
const typesSource = readFileSync('src/game/types.ts', 'utf8')

for (const cue of ['penaltyDraw', 'match', 'mismatch', 'roundWin', 'sessionWin', 'hardware']) {
  assert.match(typesSource, new RegExp(`\\| '${cue}'`), `SoundCue should include ${cue}`)
  assert.match(soundSource, new RegExp(`${cue}: '${cue}'`), `soundEventMap should include ${cue}`)
}

assert.match(soundSource, /penaltyDraw: \{ frequencies: \[/, 'penalty draw stream should have a reusable sound profile')
assert.match(soundSource, /match: \{ frequencies: \[/, 'match success should have a reusable sound profile')
assert.match(soundSource, /mismatch: \{ frequencies: \[/, 'mismatch should have a reusable sound profile')
assert.match(soundSource, /roundWin: \{ frequencies: \[/, 'round win should have a reusable sound profile')
assert.match(soundSource, /sessionWin: \{ frequencies: \[/, 'session win should have a reusable sound profile')
assert.match(soundSource, /hardware: \{ frequencies: \[/, 'generic hardware release should have a reusable sound profile')

assert.match(appSource, /function soundCueForGameTransition/, 'app should translate broad game cues into reusable sound events')
assert.match(appSource, /if \(next\.gameWinnerId\) return 'sessionWin'/, 'session winners should play the session win cue')
assert.match(appSource, /if \(next\.winnerId\) return 'roundWin'/, 'round winners should play the round win cue')
assert.match(appSource, /return 'penaltyDraw'/, 'multi-card draw penalties should play the penalty draw stream cue')
assert.match(appSource, /'memoryTripleMatch' : 'memoryMatch'/, 'memory match resolution should use the dedicated S5 success cues')
assert.match(appSource, /return 'memoryMismatch'/, 'memory mismatch resolution should use the dedicated S5 return cue')
assert.match(appSource, /sound\?\.play\(soundCueForGameTransition\(previous, next, cue\)\)/, 'UNO state updates should use translated sound cues')

console.log('Core sound effects behavior tests passed')
