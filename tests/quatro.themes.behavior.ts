import assert from 'node:assert/strict'
import {
  defaultQuatroTileTheme,
  normalizeQuatroTileTheme,
  quatroActionGlyph,
  quatroTileThemeIds,
  quatroTileThemeDescription,
  quatroTileThemeName,
  quatroTileThemePalettes,
  quatroTileThemeTitle,
} from '../src/components/quatro/quatroTileThemes'

assert.deepEqual(quatroTileThemeIds, [
  'classicQuatro',
  'platinum',
  'neonArcade',
  'naturalWood',
])
assert.equal(defaultQuatroTileTheme, 'classicQuatro')
assert.equal(normalizeQuatroTileTheme('platinum'), 'platinum')
assert.equal(normalizeQuatroTileTheme('unknown-theme'), 'classicQuatro')

for (const themeId of quatroTileThemeIds) {
  const palette = quatroTileThemePalettes[themeId]
  assert.equal(palette.backLabel, 'Quatro')
  assert.notEqual(palette.frontTop, palette.backTop)
  assert.notEqual(palette.frontBorder, palette.backBorder)
}

assert.equal(quatroActionGlyph('swap'), '⇄')
assert.equal(quatroActionGlyph('push'), '⇩')
assert.equal(quatroActionGlyph('minus2'), '−2')
assert.equal(quatroActionGlyph(null), '')

for (const language of ['en', 'zh', 'de'] as const) {
  assert.ok(quatroTileThemeTitle(language).length > 0)
  const names = quatroTileThemeIds.map((themeId) =>
    quatroTileThemeName(language, themeId),
  )
  const descriptions = quatroTileThemeIds.map((themeId) =>
    quatroTileThemeDescription(language, themeId),
  )
  assert.equal(new Set(names).size, quatroTileThemeIds.length)
  assert.equal(names.every((name) => name.length > 0), true)
  assert.equal(descriptions.every((description) => description.length > 0), true)
}

console.log('UNO Quatro tile-theme behavior tests passed')
