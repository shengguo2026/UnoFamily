import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')
const i18nSource = readFileSync('src/i18n.ts', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(i18nSource, /export function cardFlourishStyleName\(language: Language, style: CardFlourishStyle\)/, 'flourish names should come from shared localization')
assert.match(appSource, /import {[^}]*cardFlourishStyleName[^}]*} from '\.\/i18n'/s, 'settings should use shared flourish localization')
assert.match(canvasSource, /cardFlourishStyleName\(language, animation\.style\)/, 'Canvas should resolve the active localized flourish name')
assert.match(canvasSource, /drawFlourishTitle\(/, 'Canvas should render a flourish title')
assert.match(canvasSource, /ctx\.fillStyle = '#f4cf67'/, 'flourish title should use a golden fill')
assert.match(canvasSource, /centerY - cardH \* 1\.55/, 'flourish title should sit above the animation')

assert.match(canvasSource, /let randomFlourishBag: ResolvedCardFlourishStyle\[] = \[]/, 'Random should keep a shuffled bag outside the component lifecycle')
assert.match(canvasSource, /let lastResolvedRandomFlourishStyle: ResolvedCardFlourishStyle \| null = null/, 'Random should remember the last result across Canvas remounts')
assert.match(canvasSource, /function refillRandomFlourishBag\(/, 'Random should refill and shuffle its style bag')
assert.match(canvasSource, /randomFlourishBag\.pop\(\)/, 'Random should consume styles without replacement')
assert.match(canvasSource, /candidate === previousStyle/, 'Random should prevent a repeat at shuffled-bag boundaries')
assert.doesNotMatch(canvasSource, /const hash = \[\.\.\.key\]/, 'Random should not deterministically repeat identical round keys')

assert.match(slicesSource, /localized golden flourish name/, 'A11 tracker should record the title treatment')
assert.match(slicesSource, /shuffled bag/, 'A11 tracker should record the Random behavior')

console.log('Flourish title and Random behavior tests passed')
