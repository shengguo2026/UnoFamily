import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const soundSource = readFileSync('src/game/sound.ts', 'utf8')

assert.match(soundSource, /export interface AudioSettings/, 'audio settings should be a typed sound-manager contract')
assert.match(soundSource, /soundEventMap: Record<SoundCue, SoundCue>/, 'sound manager should expose a cue map foundation')
assert.match(soundSource, /unlock\(\)/, 'sound manager should support first-interaction audio unlock')
assert.match(soundSource, /setMasterVolume\(/, 'sound manager should support master volume')
assert.match(soundSource, /setSoundEffectsVolume\(/, 'sound manager should support sound effects volume')
assert.match(soundSource, /setBackgroundMusicVolume\(/, 'sound manager should support background music volume')
assert.match(soundSource, /setSoundEffectsEnabled\(/, 'sound manager should support effects on/off')
assert.match(soundSource, /setBackgroundMusicEnabled\(/, 'sound manager should support music on/off')

assert.match(appSource, /uno-audio-settings/, 'audio settings should persist separately from visual settings')
assert.match(appSource, /audioSettingsVersion: 1/, 'audio settings persistence should be versioned')
assert.match(appSource, /window\.addEventListener\('pointerdown', unlockAudio, \{ passive: true \}\)/, 'mobile audio should attempt unlock on pointer interaction')
assert.match(appSource, /window\.addEventListener\('keydown', unlockAudio\)/, 'keyboard interaction should also unlock audio')
assert.match(appSource, /if \(!unlocked \|\| !listening\) return\s*removeUnlockListeners\(\)/, 'unlock listeners should remain available until audio actually starts')
assert.match(appSource, /patch\.backgroundMusicEnabled === true[\s\S]*sound\?\.unlock\(\)/, 'enabling music should retry unlock inside the checkbox interaction')
assert.match(appSource, /sound\.configure\(audioSettings\)/, 'app should push settings into SoundManager')
assert.match(appSource, /<h2>\{audioSettingsTitle\(language\)\}<\/h2>/, 'setup should expose an audio settings panel')
assert.match(appSource, /checked=\{audioSettings\.soundEffectsEnabled\}/, 'setup or toolbar should expose sound effects on/off')
assert.match(appSource, /checked=\{audioSettings\.backgroundMusicEnabled\}/, 'setup should expose background music on/off')
assert.match(appSource, /value=\{audioSettings\.masterVolume\}/, 'setup or toolbar should expose master volume')
assert.match(appSource, /value=\{audioSettings\.soundEffectsVolume\}/, 'setup should expose effects volume')
assert.match(appSource, /value=\{audioSettings\.backgroundMusicVolume\}/, 'setup should expose music volume')

console.log('Audio settings behavior tests passed')
