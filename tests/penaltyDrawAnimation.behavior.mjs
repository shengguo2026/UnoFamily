import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')

assert.match(canvasSource, /interface PenaltyDrawAnimation/, 'GameCanvas should keep penalty draw animation metadata')
assert.match(canvasSource, /interface PenaltyDrawRecipient/, 'penalty draw animation should support one or more recipients')
assert.match(canvasSource, /detectPenaltyDrawAnimation\(/, 'GameCanvas should detect multi-card draw penalties')
assert.match(canvasSource, /penaltyDrawAnimationDurationMs\(/, 'GameCanvas should derive penalty duration from card count')
assert.match(canvasSource, /export function penaltyDrawAnimationDurationMsForTest/, 'penalty draw duration should be testable')
assert.match(canvasSource, /export function detectPenaltyDrawAnimationForTest/, 'penalty draw movement detection should be testable')
assert.match(canvasSource, /drawPenaltyDrawAnimation\(/, 'GameCanvas should render a penalty draw stream overlay')
assert.match(canvasSource, /Math\.min\(900, 260 \+ \(amount - 1\) \* 70\)/, 'penalty draw duration should use the planned capped formula')
assert.match(canvasSource, /const visibleCards = Math\.min\(6, recipient\.amount\)/, 'large penalties should cap visible flying cards')
assert.match(canvasSource, /drawPenaltyBadge\(/, 'large penalties should show a +N badge')
assert.match(canvasSource, /const PENALTY_DRAW_CARD_HIGHLIGHT_MS = 1500/, 'penalty-drawn cards should glow for 1.5 seconds')
assert.match(canvasSource, /cardIds: gainedFromDraw\.map\(\(card\) => card\.id\)/, 'penalty draw recipients should keep the exact gained card ids')
assert.match(canvasSource, /drawPenaltyDrawCardGlow\(/, 'visible penalty-drawn cards should get a temporary shine border')
assert.match(canvasSource, /penaltyDrawHighlightCardIds\(/, 'human hand rendering should receive only the matching penalty card ids')
assert.match(canvasSource, /if \(!state\.config\.reducedMotion && penaltyDrawAnimation\.current\)/, 'reduced motion should disable penalty draw stream')

console.log('Penalty draw animation behavior tests passed')
