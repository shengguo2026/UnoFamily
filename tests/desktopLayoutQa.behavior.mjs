import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const cssSource = readFileSync('src/App.css', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(cssSource, /@media \(max-width: 1180px\)\s*{[\s\S]*?\.control-dock\s*{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/, 'control dock should reflow before its six minimum columns clip')
assert.match(cssSource, /@media \(max-width: 1180px\)\s*{[\s\S]*?\.mahjong-control-dock\s*{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/, 'Mahjong dock should share the laptop-width reflow')
assert.match(cssSource, /\.global-modal-overlay\s*{[\s\S]*?overflow: auto;/, 'modal overlay should remain scrollable on short laptop screens')
assert.match(cssSource, /\.modal-panel\s*{[\s\S]*?max-height: calc\(100svh - 40px\);[\s\S]*?overflow: auto;/, 'generic modals should stay bounded within the viewport')

assert.ok(existsSync('docs/q1-desktop-qa-checklist.md'), 'Q1 should provide a manual desktop validation matrix')
const checklistSource = readFileSync('docs/q1-desktop-qa-checklist.md', 'utf8')
for (const viewport of ['1280 x 720', '1366 x 768', '1440 x 900', '1920 x 1080']) {
  assert.match(checklistSource, new RegExp(viewport), `checklist should include ${viewport}`)
}
assert.match(checklistSource, /125%/, 'checklist should cover browser zoom')
assert.match(checklistSource, /English, Chinese, and German/, 'checklist should cover localized text')
assert.match(slicesSource, /Progress: Source audit and manual desktop validation complete\./, 'Q1 should record completed manual validation')

console.log('Desktop layout QA behavior tests passed')
