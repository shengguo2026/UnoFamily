import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createMahjongTableLayout } from '../src/components/mahjong/mahjongLayout'
import { createMahjongTileFaceSpec } from '../src/components/mahjong/mahjongTextures'
import {
  mahjongCenterPatterns,
  mahjongCenterPatternSpec,
  mahjongFeltPalette,
  mahjongFramePalette,
  mahjongTableFeltThemes,
  mahjongTableFrameThemes,
  mahjongTileDeckPalette,
  mahjongTileDeckThemes,
} from '../src/components/mahjong/mahjongVisuals'
import type { MahjongTile } from '../src/game/mahjong/types'

function suitTile(suit: 'dots' | 'bamboo' | 'characters', rank: number): MahjongTile {
  return { id: `${suit}-${rank}-1`, category: 'suit', suit, rank, copy: 1, key: `${suit}-${rank}` }
}

function windTile(wind: 'east' | 'south' | 'west' | 'north'): MahjongTile {
  return { id: `${wind}-1`, category: 'wind', wind, copy: 1, key: `wind-${wind}` }
}

function dragonTile(dragon: 'red' | 'green' | 'white'): MahjongTile {
  return { id: `${dragon}-1`, category: 'dragon', dragon, copy: 1, key: `dragon-${dragon}` }
}

function assertTableFitsViewport(viewportWidth: number, viewportHeight: number, label: string): void {
  const layout = createMahjongTableLayout({ viewportWidth, viewportHeight })
  const camera = new THREE.PerspectiveCamera(layout.camera.fov, viewportWidth / viewportHeight, 0.1, 100)
  camera.position.set(layout.camera.position.x, layout.camera.position.y, layout.camera.position.z)
  camera.lookAt(layout.camera.target.x, layout.camera.target.y, layout.camera.target.z)
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()

  const halfWidth = layout.table.width / 2 + 0.4
  const halfDepth = layout.table.depth / 2 + 0.4
  const halfHeight = 0.7
  for (const x of [-halfWidth, halfWidth]) {
    for (const y of [-halfHeight, halfHeight]) {
      for (const z of [-halfDepth, halfDepth]) {
        const projected = new THREE.Vector3(x, y, z).project(camera)
        assert.equal(Math.abs(projected.x) <= 0.94, true, `${label} should keep the complete table inside the horizontal camera bounds`)
        assert.equal(Math.abs(projected.y) <= 0.94, true, `${label} should keep the complete table inside the vertical camera bounds`)
      }
    }
  }
}

{
  const layout = createMahjongTableLayout({ viewportWidth: 1280, viewportHeight: 720 })

  assert.equal(layout.tile.width > 0, true, 'layout should define positive tile width')
  assert.equal(layout.seats.length, 4, 'layout should include four seats')
  assert.equal(layout.seats[0].id, 'bottom', 'first seat should be the bottom human seat')
  assert.equal(layout.seats[0].hand.axis, 'x', 'bottom hand should run horizontally across the table edge')
  assert.equal(layout.seats[0].hand.position.z > 0, true, 'bottom hand should sit near the positive-z edge')
  assert.equal(
    layout.seats[0].hand.position.z <= layout.table.depth / 2 - layout.tile.height * 2,
    true,
    'bottom hand should stay far enough inside the table to avoid the control dock',
  )
  assert.equal(layout.seats[2].hand.position.z < 0, true, 'top hand should sit near the negative-z edge')
  assert.equal(layout.seats[2].hand.axis, 'x', 'top hand should run horizontally across the table edge')
  assert.equal(layout.seats[1].hand.rotationY < 0, true, 'right seat should rotate tiles toward the table')
  assert.equal(layout.seats[1].hand.axis, 'z', 'right hand should run vertically along the table side')
  assert.equal(layout.seats[3].hand.rotationY > 0, true, 'left seat should rotate tiles toward the table')
  assert.equal(layout.seats[3].hand.axis, 'z', 'left hand should run vertically along the table side')
}

{
  const layout = createMahjongTableLayout({ viewportWidth: 390, viewportHeight: 844 })

  assert.equal(layout.wallStacks.length, 72, 'Mahjong wall should render as 72 two-tile stacks')
  assert.equal(layout.wallStackLevels, 2, 'Mahjong wall stacks should render two tile levels')
  assert.equal(layout.wallStacks.filter((stack) => stack.side === 'bottom').length, 18, 'bottom wall should have 18 stacks')
  assert.equal(layout.wallStacks.filter((stack) => stack.side === 'right').length, 18, 'right wall should have 18 stacks')
  assert.equal(layout.table.width <= 9.6, true, 'mobile layout should use a compact table width so side hands remain visible')
  assert.equal(layout.table.depth <= 7.4, true, 'mobile layout should use a compact table depth so the bottom hand remains visible')
  assert.equal(layout.tile.width <= 0.31, true, 'mobile tiles should be compact enough to fit a full Mahjong hand')
  assert.equal(layout.camera.fov >= 58, true, 'mobile camera should widen enough to show side hands in portrait')
  assert.equal(layout.camera.position.y > 8, true, 'mobile layout should keep a high camera for readability')
  assert.equal(
    layout.seats[0].hand.position.z <= layout.table.depth / 2 - layout.tile.height * 2,
    true,
    'mobile bottom hand should stay inside the table instead of hiding behind controls',
  )
}

{
  assertTableFitsViewport(768, 787, 'portrait tablet')
  assertTableFitsViewport(1024, 555, 'landscape tablet')
  assertTableFitsViewport(1280, 811, '5:4 monitor')
}

{
  assert.deepEqual(mahjongTableFeltThemes, ['classicGreen', 'skyBlue', 'goldenBeach', 'chineseRed'], 'Mahjong should expose the requested table deck color variants')
  assert.deepEqual(mahjongTableFrameThemes, ['classicMahjong', 'vintage', 'premiumWood', 'luxusKing'], 'Mahjong should expose the requested table frame themes')
  assert.deepEqual(mahjongCenterPatterns, ['none', 'dragon', 'lion', 'faCai', 'yuanBao'], 'Mahjong should expose the requested center pattern options')
  assert.deepEqual(mahjongTileDeckThemes, ['classicIvory', 'jadeGreen', 'golden', 'ruby', 'sapphire'], 'Mahjong should expose the requested tile deck options')
  assert.equal(mahjongFeltPalette('classicGreen').base, '#136347', 'classic green should preserve the current Mahjong felt color')
  assert.equal(mahjongFeltPalette('skyBlue').base, '#2d7ea8', 'sky blue should use a distinct blue felt base')
  assert.equal(mahjongFeltPalette('goldenBeach').base, '#c99a45', 'golden beach should use a warm gold felt base')
  assert.equal(mahjongFeltPalette('chineseRed').base, '#9d2f2b', 'Chinese red should use a red felt base')
  assert.equal(mahjongFramePalette('classicMahjong').rail, '#6b3a24', 'classic Mahjong frame should preserve the current rail color')
  assert.equal(mahjongFramePalette('premiumWood').rail, '#4f2f1d', 'premium wood frame should use a darker wood rail')
  assert.equal(mahjongFramePalette('luxusKing').inlay, '#f0c85a', 'luxus king frame should use a bright gold inlay')
  assert.equal(mahjongCenterPatternSpec('none').label, '', 'empty center pattern should not draw visible text')
  assert.equal(mahjongCenterPatternSpec('dragon').motif, 'dragon', 'dragon center pattern should draw a Chinese dragon picture')
  assert.equal(mahjongCenterPatternSpec('lion').motif, 'lion', 'lion center pattern should draw a Chinese lion picture')
  assert.equal(mahjongCenterPatternSpec('faCai').label, '發', 'fa cai center pattern should use the traditional Chinese character')
  assert.equal(mahjongCenterPatternSpec('yuanBao').motif, 'yuanBao', 'yuan bao center pattern should draw a golden ingot picture')
  assert.equal(mahjongTileDeckPalette('classicIvory').face, '#fffdf2', 'classic ivory tile deck should preserve the current light face')
  assert.equal(mahjongTileDeckPalette('jadeGreen').side, '#6bbf8a', 'jade green tile deck should use green tile sides')
  assert.equal(mahjongTileDeckPalette('golden').side, '#d9a93d', 'golden tile deck should use golden tile sides')
  assert.equal(mahjongTileDeckPalette('ruby').side, '#a83245', 'ruby tile deck should use ruby tile sides')
  assert.equal(mahjongTileDeckPalette('sapphire').side, '#2f5fa8', 'sapphire tile deck should use sapphire tile sides')
}

{
  const dots = createMahjongTileFaceSpec(suitTile('dots', 5))
  const bamboo = createMahjongTileFaceSpec(suitTile('bamboo', 5))
  const east = createMahjongTileFaceSpec(windTile('east'))
  const red = createMahjongTileFaceSpec(dragonTile('red'))

  assert.deepEqual(dots, { primary: '5', secondary: 'Dots', accent: '#165aa8', motifAccent: '#165aa8', corner: '筒', center: '筒', motif: 'dot', count: 5 }, 'dots tile face should describe high-contrast blue dot pips with Chinese markings')
  assert.equal(bamboo.accent, '#146c3a', 'bamboo tile text should use a darker green for contrast')
  assert.equal(bamboo.motifAccent, '#146c3a', 'bamboo tile motif should use the same darker green for contrast')
  assert.equal(bamboo.corner, '条', 'bamboo tile should use readable Chinese marking')
  assert.deepEqual(east, { primary: '東', secondary: 'East', accent: '#1f2933', motifAccent: '#1f2933', corner: '東', center: '東', motif: 'wind', count: 1 }, 'east wind tile face should use the traditional Chinese marker')
  assert.deepEqual(red, { primary: '中', secondary: 'Red', accent: '#c7352d', motifAccent: '#c7352d', corner: '中', center: '中', motif: 'dragon', count: 1 }, 'red dragon tile face should use the traditional Chinese marker')
}

console.log('Mahjong render behavior tests passed')
