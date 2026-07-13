import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(appSource, /webSwingAnimation/, 'HardwareEventOverlay should keep Web Swing animation state')
assert.match(appSource, /webSwingResultText/, 'Web Swing overlay should describe the swung and returned cards')
assert.match(appSource, /webSwingEvent/, 'Web Swing events should participate in hardware event timing')
assert.match(cssSource, /\.web-swing-scene/, 'Web Swing overlay should include a swap scene')
assert.match(cssSource, /@keyframes webSwingCapture/, 'Web Swing captured card should animate')
assert.match(cssSource, /@keyframes webSwingReturn/, 'Web Swing returned card should animate')

console.log('UNO Spider-Man overlay wiring test passed')
