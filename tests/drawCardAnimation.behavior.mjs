import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')

assert.match(canvasSource, /interface DrawCardAnimation/, 'GameCanvas should keep draw-card animation metadata')
assert.match(canvasSource, /detectDrawCardAnimation\(/, 'GameCanvas should detect when one card moved from draw pile to a hand')
assert.match(canvasSource, /drawCardAnimationDurationMs\(/, 'GameCanvas should derive draw-card duration from animation speed')
assert.match(canvasSource, /export function drawCardAnimationDurationMsForTest/, 'draw-card duration should be testable')
assert.match(canvasSource, /export function detectDrawCardAnimationForTest/, 'draw-card movement detection should be testable')
assert.match(canvasSource, /drawDrawCardAnimation\(/, 'GameCanvas should render a draw-to-player overlay')
assert.match(canvasSource, /coverDrawAnimationTarget\(/, 'draw animation should cover the final hand slot until the card arrives')
assert.match(canvasSource, /drawOpaqueEmptyCardPlaceholder\(/, 'draw target cover should be an opaque empty placeholder, not a transparent pile or card back')
assert.match(canvasSource, /progress < 0\.98/, 'drawn card should stay hidden in the hand until the animation finishes')
assert.match(canvasSource, /const revealFace = animation\.targetFaceUp && progress >= 0\.98/, 'draw animation should not reveal the card face before the final arrival frame')
assert.match(canvasSource, /if \(!state\.config\.reducedMotion && drawCardAnimation\.current\)/, 'reduced motion should disable draw-card animation')
assert.match(canvasSource, /speed === 'fast'\s+\? 190/, 'fast draw-card animation should use the planned 190 ms duration')
assert.match(canvasSource, /speed === 'slow'\s+\? 340/, 'slow draw-card animation should use the planned 340 ms duration')

console.log('Draw-card animation behavior tests passed')
