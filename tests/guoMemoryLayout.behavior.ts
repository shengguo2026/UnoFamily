import assert from 'node:assert/strict'
import { cardBackLabelStyleForTest, memoryLayoutGeometryForTest } from '../src/components/GameCanvas'

function intersects(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

const viewports = [
  { name: 'monitor', width: 1680, height: 720 },
  { name: 'phone', width: 390, height: 620 },
]

for (const viewport of viewports) {
  for (const size of [4, 6, 8]) {
    const geometry = memoryLayoutGeometryForTest(viewport.width, viewport.height, size, size, 4)

    assert.equal(geometry.boardRect.w > 0, true, `${viewport.name} ${size}x${size} board should have positive width`)
    assert.equal(geometry.boardRect.h > 0, true, `${viewport.name} ${size}x${size} board should have positive height`)
    assert.equal(geometry.boardRect.x >= 0, true, `${viewport.name} ${size}x${size} board should stay inside left edge`)
    assert.equal(geometry.boardRect.y >= 0, true, `${viewport.name} ${size}x${size} board should stay inside top edge`)
    assert.equal(geometry.boardRect.x + geometry.boardRect.w <= viewport.width, true, `${viewport.name} ${size}x${size} board should stay inside right edge`)
    assert.equal(geometry.boardRect.y + geometry.boardRect.h <= viewport.height, true, `${viewport.name} ${size}x${size} board should stay inside bottom edge`)

    for (const labelRect of geometry.labelRects) {
      assert.equal(intersects(labelRect, geometry.boardRect), false, `${viewport.name} ${size}x${size} memory board should not overlap player labels`)
      assert.equal(labelRect.x >= 0, true, `${viewport.name} ${size}x${size} label should stay inside left edge`)
      assert.equal(labelRect.x + labelRect.w <= viewport.width, true, `${viewport.name} ${size}x${size} label should stay inside right edge`)
      if (viewport.name === 'phone') {
        assert.equal(labelRect.x >= 16, true, `${viewport.name} ${size}x${size} label should keep a safe left inset`)
        assert.equal(labelRect.x + labelRect.w <= viewport.width - 16, true, `${viewport.name} ${size}x${size} label should keep a safe right inset`)
      }
    }
    for (let first = 0; first < geometry.labelRects.length; first += 1) {
      for (let second = first + 1; second < geometry.labelRects.length; second += 1) {
        assert.equal(intersects(geometry.labelRects[first], geometry.labelRects[second]), false, `${viewport.name} ${size}x${size} player labels should not overlap each other`)
      }
    }
  }

  for (const [rows, columns] of [[6, 3], [6, 6], [6, 8]]) {
    const geometry = memoryLayoutGeometryForTest(viewport.width, viewport.height, rows, columns, 4)
    assert.equal(geometry.boardRect.w > 0, true, `${viewport.name} ${rows}x${columns} triple board should have positive width`)
    assert.equal(geometry.boardRect.h > 0, true, `${viewport.name} ${rows}x${columns} triple board should have positive height`)
    assert.equal(geometry.boardRect.x + geometry.boardRect.w <= viewport.width, true, `${viewport.name} ${rows}x${columns} triple board should stay inside right edge`)
    assert.equal(geometry.boardRect.y + geometry.boardRect.h <= viewport.height, true, `${viewport.name} ${rows}x${columns} triple board should stay inside bottom edge`)
    if (viewport.name === 'phone' && columns >= 8) {
      assert.equal(geometry.boardRect.x >= 24, true, `${viewport.name} ${rows}x${columns} wide triple board should keep a visible left gutter`)
      assert.equal(geometry.boardRect.x + geometry.boardRect.w <= viewport.width - 24, true, `${viewport.name} ${rows}x${columns} wide triple board should keep a visible right gutter`)
    }
    for (const labelRect of geometry.labelRects) {
      assert.equal(intersects(labelRect, geometry.boardRect), false, `${viewport.name} ${rows}x${columns} triple board should not overlap player labels`)
      if (viewport.name === 'phone') {
        assert.equal(labelRect.x >= 16, true, `${viewport.name} ${rows}x${columns} label should keep a safe left inset`)
        assert.equal(labelRect.x + labelRect.w <= viewport.width - 16, true, `${viewport.name} ${rows}x${columns} label should keep a safe right inset`)
      }
    }
  }
}

for (const phoneWidth of [360, 375, 390, 430]) {
  const geometry = memoryLayoutGeometryForTest(phoneWidth, 620, 6, 8, 4)
  const squareGeometry = memoryLayoutGeometryForTest(phoneWidth, 620, 8, 8, 4)
  assert.equal(geometry.cardW < squareGeometry.cardW, true, `${phoneWidth}px phone hard Triple Memory cards should be smaller than the stable 8x8 Memory cards`)
  assert.equal(geometry.boardRect.x >= 24, true, `${phoneWidth}px phone hard Triple Memory board should not hug the left edge`)
  assert.equal(geometry.boardRect.x + geometry.boardRect.w <= phoneWidth - 24, true, `${phoneWidth}px phone hard Triple Memory board should not hug the right edge`)
}

{
  const phoneHard = memoryLayoutGeometryForTest(390, 620, 8, 8, 4)
  const labelStyle = cardBackLabelStyleForTest(phoneHard.cardW, phoneHard.cardH)

  assert.equal(labelStyle.maxWidth <= phoneHard.cardW * 0.7, true, 'phone 8x8 UNO card-back label should stay inside the card face')
  assert.equal(labelStyle.maxSize <= phoneHard.cardW * 0.36, true, 'phone 8x8 UNO card-back label font should shrink with tiny cards')
}

console.log("Guo's Exclusive UNO Memory layout tests passed")
