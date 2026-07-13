import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(appSource, /turtlePowerAnimation/, 'HardwareEventOverlay should keep Turtle Power animation state')
assert.match(appSource, /turtlePowerPassedCards/, 'Turtle Power overlay should render every passed card')
assert.match(appSource, /turtlePowerEvent/, 'Turtle Power events should participate in hardware event timing')
assert.match(appSource, /turtle-power-revealed-card/, 'Turtle Power overlay should show the auto-selected cards before they move')
assert.match(cssSource, /\.turtle-power-scene/, 'Turtle Power overlay should include a card-pass scene')
assert.match(cssSource, /\.turtle-power-oval-path/, 'Turtle Power overlay should expose the oval movement path')
assert.match(cssSource, /@keyframes turtlePowerPassClockwise/, 'Turtle Power clockwise card pass should animate')
assert.match(cssSource, /@keyframes turtlePowerPassCounter/, 'Turtle Power counter-clockwise card pass should animate')

console.log('UNO TMNT overlay wiring test passed')
