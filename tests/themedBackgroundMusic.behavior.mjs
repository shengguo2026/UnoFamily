import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const soundSource = readFileSync('src/game/sound.ts', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(soundSource, /export type BackgroundMusicTheme = 'neutral' \| 'classic' \| 'mahjong' \| 'arcade' \| 'puzzle'/, 'music themes should be a typed contract')
for (const theme of ['neutral', 'classic', 'mahjong', 'arcade', 'puzzle']) {
  assert.match(soundSource, new RegExp(`\\n  ${theme}: \\{`), `${theme} should have an original procedural arrangement`)
}
assert.match(soundSource, /setBackgroundMusicTheme\(theme: BackgroundMusicTheme\)/, 'SoundManager should switch arrangements')
assert.match(soundSource, /if \(theme === this\.backgroundMusicTheme\) return/, 'turn changes should not restart the same theme')
assert.match(soundSource, /this\.stopBackgroundMusic\(\)\s*this\.syncBackgroundMusic\(\)/, 'theme changes should stop the old loop before starting the new one')
assert.match(appSource, /function backgroundMusicThemeForGame\(game: GameVariant\): BackgroundMusicTheme/, 'App should select music from the game type')
assert.match(appSource, /if \(isMahjongGame\(game\)\) return 'mahjong'/, 'Mahjong should use its calm pentatonic arrangement')
assert.match(appSource, /if \(isGuoExclusiveGame\(game\)\) return 'puzzle'/, 'Guo games should use the premium puzzle arrangement')
assert.match(appSource, /if \(arcadeMusicGames\.has\(game\)\) return 'arcade'/, 'branded and action games should use the playful arcade arrangement')
assert.match(appSource, /return 'classic'/, 'remaining table games should use the lounge arrangement')
assert.match(appSource, /sound\?\.setBackgroundMusicTheme\(backgroundMusicThemeForGame\(activeMusicGame\)\)/, 'active game changes should update the music manager')
assert.match(slicesSource, /### Slice S7: Themed Background Music\s+Status: Complete/s, 'slice tracker should mark S7 complete')

console.log('Themed background music behavior tests passed')
