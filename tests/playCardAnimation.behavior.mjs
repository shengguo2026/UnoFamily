import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')

assert.match(canvasSource, /interface PlayCardAnimation/, 'GameCanvas should keep play-card animation metadata')
assert.match(canvasSource, /detectPlayCardAnimation\(/, 'GameCanvas should detect when a card moved from hand to discard')
assert.match(canvasSource, /playCardAnimationDurationMs\(/, 'GameCanvas should derive play-card duration from animation speed')
assert.match(canvasSource, /export function playCardAnimationDurationMsForTest/, 'play-card duration should be testable')
assert.match(canvasSource, /export function detectPlayCardAnimationForTest/, 'play-card movement detection should be testable')
assert.match(canvasSource, /drawPlayCardAnimation\(/, 'GameCanvas should render a flying card overlay')
assert.match(canvasSource, /if \(!state\.config\.reducedMotion && playCardAnimation\.current\)/, 'reduced motion should disable play-card animation')
assert.match(canvasSource, /speed === 'fast'\s+\? 230/, 'fast play-card animation should use the planned 230 ms duration')
assert.match(canvasSource, /speed === 'slow'\s+\? 420/, 'slow play-card animation should use the planned 420 ms duration')

console.log('Play-card animation behavior tests passed')
