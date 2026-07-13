import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(appSource, /creepyCoolAnimation/, 'HardwareEventOverlay should keep Creepy Cool animation state')
assert.match(appSource, /creepyCoolResultText/, 'Creepy Cool overlay should describe discarded and kept revealed cards')
assert.match(appSource, /creepyCoolEvent/, 'Creepy Cool events should participate in hardware event timing')
assert.match(cssSource, /\.creepy-cool-scene/, 'Creepy Cool overlay should include a spooky reveal scene')
assert.match(cssSource, /@keyframes creepyCoolReveal/, 'Creepy Cool should animate revealed cards')
assert.match(cssSource, /@keyframes creepyCoolDiscard/, 'Creepy Cool should animate matching cards to discard')

console.log('UNO Monster High overlay wiring test passed')
