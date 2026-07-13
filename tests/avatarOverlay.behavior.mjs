import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(appSource, /avatarStateAnimation/, 'HardwareEventOverlay should keep Avatar State animation state')
assert.match(appSource, /avatarStateResultText/, 'Avatar State overlay should describe the kept and returned cards')
assert.match(appSource, /avatarStateEvent/, 'Avatar State events should participate in hardware event timing')
assert.match(cssSource, /\.avatar-state-scene/, 'Avatar State overlay should include an elemental reveal scene')
assert.match(cssSource, /@keyframes avatarStateReveal/, 'Avatar State should animate the revealed cards')
assert.match(cssSource, /@keyframes avatarStateKeep/, 'Avatar State should animate the kept card to the player')

console.log('UNO Avatar overlay wiring test passed')
