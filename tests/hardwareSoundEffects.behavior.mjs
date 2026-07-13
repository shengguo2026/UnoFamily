import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const soundSource = readFileSync('src/game/sound.ts', 'utf8')
const typesSource = readFileSync('src/game/types.ts', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

for (const cue of ['launcherBuild', 'launcherFire', 'blastPressure', 'blastRelease', 'robotoBeep', 'robotoInstruction', 'tippoWobble', 'tippoTip', 'diceRoll', 'diceSettle']) {
  assert.match(typesSource, new RegExp(`\\| '${cue}'`), `SoundCue should include ${cue}`)
  assert.match(soundSource, new RegExp(`${cue}: '${cue}'`), `soundEventMap should include ${cue}`)
  assert.match(soundSource, new RegExp(`${cue}: \\{ frequencies: \\[`), `${cue} should have an original synthesized profile`)
}

assert.match(appSource, /hasNewLauncherEvent\(previous, next\)/, 'launcher build and fire sounds should follow new launcher events')
assert.match(appSource, /hasNewBlastEvent\(previous, next\)/, 'Blast pressure and release should follow new Blast events')
assert.match(appSource, /hasNewRobotoEvent\(previous, next\)/, 'Roboto cues should follow new Roboto commands')
assert.match(appSource, /hasNewTippoEvent\(previous, next\)/, 'Tippo wobble and tip should follow tray events')
assert.match(appSource, /hasDiceReroll\(previous, next, cue\)/, 'Dice roll and settle should follow dice rerolls')
assert.match(appSource, /sound\.play\('robotoBeep'\)/, 'Roboto should play a leading electronic beep')
assert.match(appSource, /window\.setTimeout\(\(\) => sound\.play\('diceSettle'\), 180\)/, 'Dice should play a settling cue after the roll')
assert.match(slicesSource, /### Slice S3: Hardware-Specific Sound Effects\s+Status: Complete/s, 'slice tracker should mark S3 complete')

console.log('Hardware sound effects behavior tests passed')
