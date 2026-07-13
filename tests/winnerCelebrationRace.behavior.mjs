import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(appSource, /function handleWinnerCelebrationClick\(/, 'winner celebration should distinguish keyboard clicks from trailing pointer clicks')
assert.match(appSource, /if \(event\.detail === 0\) onFinish\(\)/, 'only keyboard-generated clicks should finish through onClick')
assert.match(appSource, /onPointerDown=\{onFinish\}/, 'a fresh pointer or touch should still skip immediately')
assert.match(appSource, /onClick=\{\(event\) => handleWinnerCelebrationClick\(event, onFinish\)\}/, 'overlay should use the guarded click handler')
assert.doesNotMatch(appSource, /onClick=\{onFinish\}/, 'the winning-card trailing click must not immediately dismiss the overlay')
assert.match(slicesSource, /Ignore the trailing click from the winning-card pointer gesture/, 'A7 tracker should record the intermittent skip fix')

console.log('Winner celebration race regression tests passed')
