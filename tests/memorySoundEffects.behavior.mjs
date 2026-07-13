import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const soundSource = readFileSync('src/game/sound.ts', 'utf8')
const typesSource = readFileSync('src/game/types.ts', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

const memoryCues = ['memoryFlip', 'memoryMatch', 'memoryTripleMatch', 'memoryMismatch', 'memoryAction', 'memoryWinnerTakesAll']
for (const cue of memoryCues) {
  assert.match(typesSource, new RegExp(`\\| '${cue}'`), `SoundCue should include ${cue}`)
  assert.match(soundSource, new RegExp(`${cue}: '${cue}'`), `soundEventMap should include ${cue}`)
  assert.match(soundSource, new RegExp(`${cue}: \\{ frequencies: \\[`), `${cue} should have an original synthesized profile`)
}

assert.match(appSource, /if \(hasNewMemoryActionEvent\(previous, next\)\) \{\s*return next\.memoryActionEvent\?\.action === 'winnerTakesAll' \? 'memoryWinnerTakesAll' : 'memoryAction'\s*\}/s, 'action cards should produce one dedicated reveal cue')
assert.match(appSource, /previous\.memoryBoard\.pendingMatchIndexes\?\.length[\s\S]*cardsPerMatch === 3 \? 'memoryTripleMatch' : 'memoryMatch'/, 'pair and triple collection should have different success cues')
assert.match(appSource, /previous\.memoryBoard\.pendingMismatchIndexes\?\.length\) return 'memoryMismatch'/, 'mismatch return should have a dedicated cue')
assert.match(appSource, /hasNewMemoryCardReveal\(previous, next\)[\s\S]*return 'memoryFlip'/, 'human and AI card reveals should use the flip cue')

const actionCueIndex = appSource.indexOf('if (hasNewMemoryActionEvent(previous, next))')
const regularMemoryCueIndex = appSource.indexOf('if (previous?.memoryBoard && next.memoryBoard', actionCueIndex)
assert.ok(actionCueIndex >= 0 && regularMemoryCueIndex > actionCueIndex, 'action-card cue selection should take precedence to avoid stacked sounds')
assert.match(slicesSource, /### Slice S5: Memory-Specific Sound Effects\s+Status: Complete/s, 'slice tracker should mark S5 complete')

console.log('Memory-specific sound effect behavior tests passed')
