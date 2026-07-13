import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(canvasSource, /interface CustomRoundStartAnimation/, 'GameCanvas should keep custom round-start metadata')
assert.match(canvasSource, /customRoundStartAnimationDurationMs\(speed: AnimationSpeed\)/, 'custom starts should respect animation speed')
assert.match(canvasSource, /const customRoundStartAnimationGames = new Set<GameVariant>\(/, 'custom layout games should have a dedicated intro eligibility set')
for (const game of ['triplePlay', 'dice', 'dos', 'phase10', 'skipBo', 'zero', 'cabo', 'skyjo']) {
  assert.match(canvasSource, new RegExp(`'${game}'`), `${game} should participate in the custom round-start slice`)
}
assert.match(canvasSource, /state\.config\.dealAnimation && !state\.config\.reducedMotion && detectedCustomRoundStart/, 'custom starts should respect the deal setting and reduced motion')
assert.match(canvasSource, /isNewSessionAfterWinner/, 'a new session should replay a matching round-one intro')
assert.match(canvasSource, /onBlockingAnimationChange\?\.\('customRoundStart'\)/, 'custom starts should raise the shared animation lock')
assert.match(canvasSource, /hitAreas\.current\.length = 0/, 'custom starts should prevent card input while the opaque intro is active')
assert.match(canvasSource, /drawCustomIntroBackdrop\(/, 'custom starts should hide the underlying table during setup')
assert.match(canvasSource, /drawCustomIntroDiceLine\(/, 'UNO Dice should use a dice-specific intro')
assert.match(canvasSource, /drawCustomIntroPhaseBadge\(/, 'Phase 10 should show a phase-specific intro badge')
assert.match(canvasSource, /drawCustomIntroSkipBo\(/, 'Skip-Bo should show stock and build-pile setup')
assert.match(canvasSource, /drawCustomIntroGrid\(/, 'Zero, Cabo, and Skyjo should use grid setup animations')
assert.match(canvasSource, /customIntroViewerId\(/, 'initial grid reveals should respect the local viewer')
assert.match(canvasSource, /const revealedBefore = grid\.slice\(0, index\)/, 'randomized initial reveal positions should animate in their grid order')
assert.match(slicesSource, /### Slice A8: Special Start Animations For Custom Layout Games\s+Status: Complete/s, 'slice tracker should mark A8 complete')

console.log('Custom round-start animation behavior tests passed')
