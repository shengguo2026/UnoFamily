import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/App.css', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')

for (const title of [
  "Guo's Exclusive UNO Triple Memory Action",
  "Guo's Exclusive Uno Neighbor Match",
  "Guo's Exclusive Uno Mahjong",
  "Guo's Exclusive Uno Hi-Lo",
  "Guo's Exclusive Uno Passage",
  'Traditional Chinese Mahjong',
  'Uno Challenge Adults Only',
  'Pop-Culture Uno editions',
]) {
  assert.equal(app.includes(title), true, `${title} should remain covered by long-title layout protection`)
}

assert.match(css, /\.table-screen\s*{[\s\S]*max-width:\s*100vw/, 'table screens should not become wider than the phone viewport')
assert.match(css, /\.table-title-text strong,[\s\S]*text-overflow:\s*ellipsis/, 'table toolbar titles should truncate instead of expanding the canvas')
assert.match(css, /\.setup-header h1\s*{[\s\S]*-webkit-line-clamp:\s*2/, 'setup titles should clamp long game names')
assert.match(css, /\.setup-header \.brand-block\s*{[\s\S]*min-width:\s*0/, 'setup title block should be allowed to shrink')

console.log('Long title layout regression tests passed')
