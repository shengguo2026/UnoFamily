import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(appSource, /beamMeUpAnimation/, 'HardwareEventOverlay should keep Beam Me Up animation state')
assert.match(appSource, /beamMeUpResultText/, 'Beam Me Up overlay should describe the beamed card and replacement')
assert.match(appSource, /beamMeUpEvent/, 'Beam Me Up events should participate in hardware event timing')
assert.match(cssSource, /\.beam-me-up-scene/, 'Beam Me Up overlay should include a transporter scene')
assert.match(cssSource, /@keyframes beamMeUpTransport/, 'Beam Me Up should animate the revealed card into the beam')
assert.match(cssSource, /@keyframes beamMeUpReplacement/, 'Beam Me Up should animate the replacement card to the target')

console.log('UNO Star Trek overlay wiring test passed')
