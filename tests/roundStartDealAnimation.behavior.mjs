import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')
const appSource = readFileSync('src/App.tsx', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(canvasSource, /interface RoundStartDealAnimation/, 'GameCanvas should keep round-start deal animation metadata')
assert.match(canvasSource, /roundStartDealAnimationDurationMs\(/, 'round-start deal animation should derive duration from player count and hand size')
assert.match(canvasSource, /Math\.min\(1100, 450 \+ playerCount \* startingHandSize \* 18\)/, 'round-start deal duration should use the planned capped formula')
assert.match(canvasSource, /canUseRoundStartDealAnimation\(/, 'round-start deal animation should have an eligibility guard')
assert.match(canvasSource, /customRoundStartDealGames = new Set/, 'custom layout games should be excluded until their dedicated slice')
assert.match(canvasSource, /state\.config\.dealAnimation && !state\.config\.reducedMotion/, 'deal animation should respect settings and reduced motion')
assert.match(canvasSource, /drawRoundStartDealAnimation\(/, 'GameCanvas should render the round-start deal overlay')
assert.match(canvasSource, /drawCardBack\(ctx, drawX, drawY, cardW, cardH, state\.config\.deckTheme\)/, 'deal stream should use card backs to avoid hand privacy leaks')
assert.match(canvasSource, /interface RoundStartDealCover/, 'round-start deal should keep an intro cover marker')
assert.match(canvasSource, /roundStartDealCover/, 'table rendering should receive the round-start deal cover marker')
assert.match(canvasSource, /roundStartDealCover\?\.hideAllHands/, 'all settled hands should be hidden during the deal intro')
assert.match(canvasSource, /roundStartDealCover\?\.hideCenterCards/, 'settled center piles should be hidden during the deal intro')
assert.match(canvasSource, /(?:const|let) activeRoundStartDealAnimation = roundStartDealAnimation\.current[\s\S]*const roundStartDealAge = activeRoundStartDealAnimation \? timestamp - activeRoundStartDealAnimation\.startedAt : 999[\s\S]*if \(activeRoundStartDealAnimation && roundStartDealAge > roundStartDealAnimationDurationMs/, 'finished deal animation should be cleared before drawing the table cover')
assert.match(canvasSource, /onBlockingAnimationChange\?\.\('roundStartDeal'\)/, 'round-start deal should raise the shared animation lock')
assert.match(canvasSource, /onBlockingAnimationChange\?\.\(null\)/, 'round-start deal should release the shared animation lock')
assert.match(appSource, /onBlockingAnimationChange=\{setAnimationLockReason\}/, 'App should connect GameCanvas round-start lock to AI/input gating')
assert.match(slicesSource, /### Slice A5: Round-Start Deal Animation\s+Status: Complete/s, 'slice tracker should mark A5 complete')

console.log('Round-start deal animation behavior tests passed')
