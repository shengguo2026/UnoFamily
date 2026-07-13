import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const classicSource = readFileSync('src/game/classic.ts', 'utf8')
const typesSource = readFileSync('src/game/types.ts', 'utf8')

assert.match(typesSource, /export type AnimationSpeed = 'fast' \| 'normal' \| 'slow'/, 'animation speed should be a typed setting')
assert.match(typesSource, /export type CardFlourishStyle = 'random' \| 'fan' \| 'cut' \| 'faro' \| 'pirouette'/, 'card flourish style should be typed')
assert.match(typesSource, /roundStartFlourish: boolean/, 'config should include round-start flourish toggle')
assert.match(typesSource, /cardFlourishStyle: CardFlourishStyle/, 'config should include flourish style')
assert.match(typesSource, /dealAnimation: boolean/, 'config should include deal animation toggle')
assert.match(typesSource, /winnerCelebration: boolean/, 'config should include winner celebration toggle')
assert.match(typesSource, /animationSpeed: AnimationSpeed/, 'config should include animation speed')

assert.match(classicSource, /roundStartFlourish: true/, 'round-start flourish should default on')
assert.match(classicSource, /cardFlourishStyle: 'random'/, 'flourish style should default to random')
assert.match(classicSource, /dealAnimation: true/, 'deal animation should default on')
assert.match(classicSource, /winnerCelebration: true/, 'winner celebration should default on')
assert.match(classicSource, /animationSpeed: 'normal'/, 'animation speed should default to normal')

assert.match(appSource, /animationSettingsVersion: 1/, 'visual settings persistence should version animation settings')
assert.match(appSource, /roundStartFlourish: typeof stored\.roundStartFlourish === 'boolean'/, 'stored round-start flourish should be restored safely')
assert.match(appSource, /cardFlourishStyle: cardFlourishStyles\.includes\(stored\.cardFlourishStyle as CardFlourishStyle\)/, 'stored flourish style should be restored safely')
assert.match(appSource, /dealAnimation: typeof stored\.dealAnimation === 'boolean'/, 'stored deal animation should be restored safely')
assert.match(appSource, /winnerCelebration: typeof stored\.winnerCelebration === 'boolean'/, 'stored winner celebration should be restored safely')
assert.match(appSource, /animationSpeed: animationSpeeds\.includes\(stored\.animationSpeed as AnimationSpeed\)/, 'stored animation speed should be restored safely')

assert.match(appSource, /<h2>\{animationSettingsTitle\(language\)\}<\/h2>/, 'setup should show an animation settings panel')
assert.match(appSource, /checked=\{config\.roundStartFlourish\}/, 'setup should expose round-start flourish toggle')
assert.match(appSource, /value=\{config\.cardFlourishStyle\}/, 'setup should expose flourish style selector')
assert.match(appSource, /checked=\{config\.dealAnimation\}/, 'setup should expose deal animation toggle')
assert.match(appSource, /checked=\{config\.winnerCelebration\}/, 'setup should expose winner celebration toggle')
assert.match(appSource, /value=\{config\.animationSpeed\}/, 'setup should expose animation speed selector')
assert.match(appSource, /const \[animationLockReason, setAnimationLockReason\]/, 'app should provide a foundation marker for blocking animation locks')
assert.match(appSource, /const isBlockingAnimationActive = Boolean\(animationLockReason\)/, 'app should expose a shared blocking animation flag')

console.log('Animation settings behavior tests passed')
