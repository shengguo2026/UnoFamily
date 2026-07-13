import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(appSource, /justiceLeagueAnimation/, 'HardwareEventOverlay should keep Justice League animation state')
assert.match(appSource, /justiceLeagueRevealedCards/, 'Justice League overlay should render every revealed card')
assert.match(appSource, /justiceLeagueResultText/, 'Justice League overlay should describe the captured and returned cards')
assert.match(appSource, /justiceLeagueEvent/, 'Justice League events should participate in hardware event timing')
assert.match(cssSource, /\.justice-league-scene/, 'Justice League overlay should include a reveal and swap scene')
assert.match(cssSource, /@keyframes justiceLeagueCapture/, 'Justice League captured card should animate')
assert.match(cssSource, /@keyframes justiceLeagueReturn/, 'Justice League returned card should animate')

console.log('UNO DC overlay wiring test passed')
