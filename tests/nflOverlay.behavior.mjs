import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const cssSource = readFileSync('src/App.css', 'utf8')

assert.match(appSource, /touchdownAnimation/, 'HardwareEventOverlay should keep Touchdown animation state')
assert.match(appSource, /touchdownResultText/, 'Touchdown overlay should render localized result text')
assert.match(appSource, /touchdownEvent/, 'UNO NFL should publish Touchdown animation events')
assert.match(cssSource, /\.touchdown-scene/, 'Touchdown overlay should have a dedicated animation scene')
assert.match(cssSource, /@keyframes touchdownDrive/, 'Touchdown overlay should animate the football drive')
assert.match(cssSource, /@keyframes touchdownPenalty/, 'Touchdown overlay should animate the penalty cards')

console.log('UNO NFL overlay tests passed')
