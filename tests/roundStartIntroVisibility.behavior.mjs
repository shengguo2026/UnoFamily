import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(canvasSource, /interface RoundStartDealCover\s*{\s*hideCenterCards: boolean\s*hideAllHands: boolean\s*}/s, 'intro cover should hide both center cards and settled hands')
assert.match(canvasSource, /if \(!roundStartDealCover\?\.hideCenterCards\) drawCenter\(/, 'center piles should stay absent throughout flourish and deal')
assert.match(canvasSource, /if \(roundStartDealCover\?\.hideAllHands\) return/, 'normal player layouts should skip settled hands during the intro')
assert.match(canvasSource, /hideHands = false/, 'large-player layouts should support hiding settled hands')
assert.match(canvasSource, /if \(!hideHands\) drawCompactOpponentStack\(/, 'large-player opponent stacks should remain hidden during the intro')
assert.match(canvasSource, /drawCardBack\(ctx, from\.x \+ \(from\.w - baseW\) \/ 2, from\.y \+ \(from\.h - baseH\) \/ 2, baseW, baseH, state\.config\.deckTheme\)/, 'deal animation should draw its own temporary source deck')
assert.match(canvasSource, /activeRoundStartFlourishAnimation \|\| activeRoundStartDealAnimation\s*\? { hideCenterCards: true, hideAllHands: true }/s, 'flourish and deal should share the empty-table cover')
assert.match(slicesSource, /Settled hands and center piles remain hidden during the flourish and deal/, 'A11 tracker should record the corrected reveal sequence')

console.log('Round-start intro visibility behavior tests passed')
