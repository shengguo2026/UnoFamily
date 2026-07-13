import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(appSource, /marioKartAnimation/, 'HardwareEventOverlay should keep Mario Kart animation state')
assert.match(appSource, /marioKartItemIcon/, 'Mario Kart overlay should render an item icon for the revealed item')
assert.match(appSource, /marioKartAffectedText/, 'Mario Kart overlay should explain which player is affected')
assert.match(cssSource, /mario-kart-scene/, 'Mario Kart overlay should have scene styling')
assert.match(cssSource, /@keyframes marioKartItemPop/, 'Mario Kart item should animate in the overlay')

console.log('UNO Mario Kart overlay regression test passed')
