import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const soundSource = readFileSync('src/game/sound.ts', 'utf8')
const typesSource = readFileSync('src/game/types.ts', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

const mahjongCues = ['mahjongWallBuild', 'mahjongDraw', 'mahjongDiscard', 'mahjongChow', 'mahjongPong', 'mahjongKong', 'mahjongWin']
for (const cue of mahjongCues) {
  assert.match(typesSource, new RegExp(`\\| '${cue}'`), `SoundCue should include ${cue}`)
  assert.match(soundSource, new RegExp(`${cue}: '${cue}'`), `soundEventMap should include ${cue}`)
  assert.match(soundSource, new RegExp(`${cue}: \\{ frequencies: \\[`), `${cue} should have an original synthesized profile`)
}

assert.match(soundSource, /interface SoundProfile[\s\S]*stagger\?: number/, 'Mahjong percussion and gong profiles should control note spacing')
assert.match(soundSource, /mahjongWin: \{[^\n]*stagger: 0/, 'the win gong partials should sound together')
assert.match(appSource, /deriveMahjongAnimationTransition\(previous, next\)/, 'Mahjong sounds should follow the same authoritative transitions as animations')
assert.match(appSource, /if \(transition\.roundStart\) return 'mahjongWallBuild'/, 'new rounds should play wall construction')
assert.match(appSource, /if \(transition\.eventKind === 'win'\) return 'mahjongWin'/, 'wins should play the gong')
assert.match(appSource, /if \(transition\.eventKind === 'kong'\) return 'mahjongKong'/, 'kong should take priority over its replacement draw')
assert.match(appSource, /if \(transition\.eventKind === 'pong'\) return 'mahjongPong'/, 'pong should have a dedicated cue')
assert.match(appSource, /if \(transition\.eventKind === 'chow'\) return 'mahjongChow'/, 'chow should have a dedicated cue')
assert.match(appSource, /if \(transition\.discardedTileId\) return 'mahjongDiscard'/, 'discards should use their tile clack even when also ready')
assert.match(appSource, /if \(transition\.drawnTileId\) return 'mahjongDraw'/, 'draws should use their tile clack')
assert.match(appSource, /sound\?\.play\(soundCueForMahjongTransition\(previousMahjongState, snapshot\.mahjongState, 'play'\)\)/, 'WiFi clients should hear public transitions from private snapshots')
assert.match(appSource, /function playSoundAfterUnlock\(sound: SoundManager \| null, cue: SoundCue\)/, 'start-only sounds should wait for browser audio unlock')
assert.match(appSource, /sound\.unlock\(\)\.then\(\(unlocked\) => \{\s*if \(unlocked\) sound\.play\(cue\)\s*\}\)/s, 'the wall cue should play only after audio is running')
assert.match(appSource, /playSoundAfterUnlock\(sound, 'mahjongWallBuild'\)/, 'local Mahjong starts should use unlock-safe wall construction')
assert.match(slicesSource, /### Slice S4: Mahjong-Specific Sound Effects\s+Status: Complete/s, 'slice tracker should mark S4 complete')

console.log('Mahjong-specific sound effect behavior tests passed')
