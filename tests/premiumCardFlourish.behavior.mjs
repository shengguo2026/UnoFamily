import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const typesSource = readFileSync('src/game/types.ts', 'utf8')
const appSource = readFileSync('src/App.tsx', 'utf8')
const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')
const i18nSource = readFileSync('src/i18n.ts', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

const premiumStyles = ['spring', 'waterfall', 'dribble', 'oneHanded']

for (const style of premiumStyles) {
  assert.match(typesSource, new RegExp(`'${style}'`), `${style} should be part of CardFlourishStyle`)
  assert.match(appSource, new RegExp(`'${style}'`), `${style} should be selectable in settings`)
  assert.match(canvasSource, new RegExp(`'${style}'`), `${style} should be available to the Canvas renderer`)
}

assert.match(i18nSource, /spring: 'Spring'/, 'Spring should have an English label')
assert.match(i18nSource, /waterfall: 'Waterfall'/, 'Waterfall should have an English label')
assert.match(i18nSource, /dribble: 'Dribble'/, 'Dribble should have an English label')
assert.match(i18nSource, /oneHanded: 'One-handed shuffle'/, 'One-handed shuffle should have an English label')

assert.match(canvasSource, /drawSpringFlourish\(/, 'Spring should have a distinct motion renderer')
assert.match(canvasSource, /drawWaterfallFlourish\(/, 'Waterfall should have a distinct motion renderer')
assert.match(canvasSource, /drawDribbleFlourish\(/, 'Dribble should have a distinct motion renderer')
assert.match(canvasSource, /drawOneHandedFlourish\(/, 'One-handed shuffle should have a distinct motion renderer')
assert.match(canvasSource, /drawPremiumFlourishAccents\(/, 'premium flourishes should share a polished accent layer')
assert.match(canvasSource, /const premiumCardCount = Math\.max\(10, Math\.min\(14, Math\.round\(width \/ 78\)\)\)/, 'premium flourishes should use enough cards to read as flowing packets')

assert.match(slicesSource, /### Slice A11: Premium Flourishes And Optional Three\.js Upgrades\s+Status: Complete/s, 'slice tracker should mark A11 complete')
assert.match(slicesSource, /Canvas 2D was retained/, 'tracker should record the rendering decision')

console.log('Premium card flourish behavior tests passed')
