import assert from 'node:assert/strict'
import { triplePlayLayoutGeometryForTest } from '../src/components/GameCanvas'

function intersects(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

for (const viewport of [
  { name: 'desktop', width: 900, height: 620 },
  { name: 'phone', width: 390, height: 620 },
]) {
  const geometry = triplePlayLayoutGeometryForTest(viewport.width, viewport.height, 4, 7)

  assert.equal(geometry.seats.length, 4, `${viewport.name} should place four Triple Play seats`)
  for (const seat of geometry.seats) {
    assert.equal(intersects(seat.labelRect, seat.stackRect), false, `${viewport.name} ${seat.align} Triple Play cards should not overlap the player label`)
    assert.equal(intersects(seat.labelRect, geometry.centerRect), false, `${viewport.name} ${seat.align} Triple Play label should stay clear of the unit`)
    if (seat.align !== 'bottom') {
      assert.equal(intersects(seat.stackRect, geometry.centerRect), false, `${viewport.name} ${seat.align} Triple Play cards should stay clear of the unit`)
    }
  }
}

console.log('UNO Triple Play layout regression tests passed')
