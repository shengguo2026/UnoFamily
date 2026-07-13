import assert from 'node:assert/strict'
import { skyjoGridGeometryForTest } from '../src/components/GameCanvas'

function intersects(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

for (const viewport of [
  { name: 'desktop', width: 900, height: 620 },
  { name: 'phone', width: 390, height: 620 },
]) {
  const geometry = skyjoGridGeometryForTest(viewport.width, viewport.height)
  const center = {
    x: viewport.width / 2 - 74,
    y: viewport.height / 2 - 92,
    w: 148,
    h: 184,
  }

  assert.equal(geometry.length, 4, `${viewport.name} should place four Skyjo seats`)
  for (const seat of geometry) {
    assert.equal(intersects(seat.labelRect, seat.gridRect), false, `${viewport.name} ${seat.align} Skyjo grid should not overlap its label`)
    if (seat.align !== 'bottom') {
      assert.equal(intersects(seat.gridRect, center), false, `${viewport.name} ${seat.align} Skyjo grid should stay clear of the deck/discard center`)
    }
  }
}

console.log('Skyjo layout regression tests passed')
