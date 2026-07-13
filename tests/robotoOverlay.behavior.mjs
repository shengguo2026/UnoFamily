import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(appSource, /robotoAnimation/, 'HardwareEventOverlay should keep Roboto animation state')
assert.match(appSource, /robotoInstructionText/, 'Roboto overlay should show the command instruction text')
assert.match(appSource, /robotoAffectedText/, 'Roboto overlay should show which player gets what')
assert.match(cssSource, /\.roboto-scene/, 'Roboto overlay should include a Roboto animation scene')
assert.match(cssSource, /\.roboto-speech-bubble/, 'Roboto overlay should include a speech bubble for the instruction')

console.log('UNO Roboto overlay wiring test passed')
