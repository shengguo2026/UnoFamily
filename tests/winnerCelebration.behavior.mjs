import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const cssSource = readFileSync('src/App.css', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(appSource, /const WINNER_CELEBRATION_DURATION_MS = 3000/, 'winner celebration should keep its planned three-second duration')
assert.match(appSource, /function WinnerCelebrationOverlay/, 'App should provide a winner celebration overlay')
assert.match(appSource, /winnerCelebrationHeadline\(language, sessionWinner\)/, 'celebration should use localized winner text')
assert.match(appSource, /winnerCelebrationSubtext\(language, winnerName, sessionWinner\)/, 'celebration should use localized winner subtext')
assert.match(appSource, /onPointerDown=\{onFinish\}/, 'clicking or tapping anywhere should skip the celebration')
assert.match(appSource, /event\.detail === 0/, 'the full-screen skip target should support keyboard activation without accepting trailing pointer clicks')
assert.match(appSource, /window\.setTimeout\(onFinish, WINNER_CELEBRATION_DURATION_MS\)/, 'celebration should continue to scoring after its fixed duration')
assert.match(appSource, /next\.config\.winnerCelebration \|\| next\.config\.reducedMotion/, 'celebration should respect its setting and reduced motion')
assert.match(appSource, /setAnimationLockReason\('winnerCelebration'\)/, 'celebration should raise the shared animation lock')
assert.match(appSource, /!winnerCelebration && \(/, 'the score modal should wait for the celebration to finish')
assert.match(cssSource, /@keyframes winner-title-drop/, 'winner title should fall into place')
assert.match(cssSource, /winner-firework-launch/, 'fireworks should rise from the bottom of the screen')
assert.match(slicesSource, /### Slice A7: Round-End Winner Celebration\s+Status: Complete/s, 'slice tracker should mark A7 complete')

console.log('Winner celebration behavior tests passed')
