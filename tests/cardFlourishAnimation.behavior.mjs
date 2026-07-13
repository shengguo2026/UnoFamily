import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(canvasSource, /interface RoundStartFlourishAnimation/, 'GameCanvas should keep round-start flourish metadata')
assert.match(canvasSource, /cardFlourishAnimationDurationMs\(speed: AnimationSpeed\)/, 'flourish duration should follow animation speed')
assert.match(canvasSource, /speed === 'fast' \? 900 : speed === 'slow' \? 1300 : 1100/, 'flourish durations should remain within the planned range')
assert.match(canvasSource, /resolveCardFlourishStyle\(/, 'flourish style should resolve the configured or random choice')
for (const style of ['fan', 'cut', 'faro', 'pirouette']) {
  assert.match(canvasSource, new RegExp(`'${style}'`), `${style} should remain available`)
}
assert.match(canvasSource, /state\.config\.roundStartFlourish && !state\.config\.reducedMotion/, 'flourish should respect its setting and reduced motion')
assert.match(canvasSource, /onBlockingAnimationChange\?\.\('roundStartFlourish'\)/, 'flourish should raise the shared animation lock')
assert.match(canvasSource, /drawRoundStartFlourishAnimation\(/, 'GameCanvas should render the flourish overlay')
assert.match(canvasSource, /const cardW = Math\.max\(26, layout\.cardW \* 0\.62\)/, 'flourish cards should use a prominent table scale')
assert.match(canvasSource, /const cardH = Math\.max\(38, layout\.cardH \* 0\.62\)/, 'flourish card height should match the larger scale')
assert.match(canvasSource, /activeRoundStartFlourishAnimation \|\| activeRoundStartDealAnimation/, 'visible hands should remain covered throughout the intro')
assert.match(canvasSource, /pendingRoundStartDealAnimation/, 'flourish should hand off to the existing deal animation')
assert.match(slicesSource, /### Slice A6: Card Flourish Slice 1\s+Status: Complete/s, 'slice tracker should mark A6 complete')

console.log('Card flourish animation behavior tests passed')
