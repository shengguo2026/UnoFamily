import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const cssSource = readFileSync('src/App.css', 'utf8')
const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')
const mahjongSource = readFileSync('src/components/mahjong/mahjongScene.ts', 'utf8')
const indexSource = readFileSync('index.html', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(indexSource, /width=device-width, initial-scale=1\.0/, 'mobile viewport should use device width')
assert.match(cssSource, /\.table-screen\s*{[\s\S]*?height: 100svh;/, 'table should use a stable mobile viewport height')
assert.match(cssSource, /@media \(max-width: 640px\), \(max-height: 620px\)/, 'phone portrait and landscape should share a compact breakpoint')
assert.match(cssSource, /@media \(max-width: 900px\)/, 'tablet and narrow desktop layouts should reflow')

assert.match(canvasSource, /const dpr = Math\.min\(window\.devicePixelRatio \|\| 1, 2\)/, '2D canvas should cap high-DPI mobile backing buffers')
assert.match(canvasSource, /window\.addEventListener\('resize', resize\)/, '2D canvas should redraw after orientation changes')
assert.match(canvasSource, /window\.removeEventListener\('resize', resize\)/, '2D canvas resize handling should clean up')
assert.match(canvasSource, /matchMedia\?\.\('\(pointer: coarse\)'\)/, 'touch devices should use compact input geometry')
assert.match(canvasSource, /event\.currentTarget\.setPointerCapture\(event\.pointerId\)/, 'touch long-press should retain its pointer')

assert.match(mahjongSource, /setPixelRatio\(Math\.min\(window\.devicePixelRatio \|\| 1, 2\)\)/, 'Mahjong WebGL should cap mobile DPR')
assert.match(mahjongSource, /addEventListener\('pointercancel', handlePointerUp\)/, 'Mahjong gestures should handle interrupted touches')
assert.match(appSource, /window\.addEventListener\('pointerdown', unlockAudio, \{ passive: true \}\)/, 'first touch should unlock audio')
assert.match(appSource, /className="winner-celebration-overlay"[\s\S]*?onPointerDown=\{onFinish\}/, 'winner celebration should be skippable by touch')

assert.ok(existsSync('docs/q2-mobile-tablet-qa-checklist.md'), 'Q2 should provide a manual device matrix')
const checklistSource = readFileSync('docs/q2-mobile-tablet-qa-checklist.md', 'utf8')
for (const viewport of ['390 x 844', '844 x 390', '768 x 1024', '1024 x 768']) {
  assert.match(checklistSource, new RegExp(viewport), `checklist should include ${viewport}`)
}
assert.match(checklistSource, /portrait to landscape/, 'checklist should cover live orientation changes')
assert.match(checklistSource, /first interaction/, 'checklist should cover mobile audio unlock')
assert.match(slicesSource, /Progress: Source audit complete; manual phone and tablet validation pending\./, 'Q2 should remain pending until device validation')

console.log('Mobile and tablet QA behavior tests passed')
