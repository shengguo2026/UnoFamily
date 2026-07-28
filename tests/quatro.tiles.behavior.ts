import assert from 'node:assert/strict'
import {
  buildQuatroBag,
  QUATRO_COLOR_MARKS,
  shuffleQuatroTiles,
} from '../src/game/quatro/tiles'

{
  const bag = buildQuatroBag()

  assert.equal(bag.length, 44, 'UNO Quatro should use exactly 44 tiles')
  assert.equal(
    new Set(bag.map((tile) => tile.id)).size,
    44,
    'every physical tile should have a stable unique ID',
  )
  assert.deepEqual(
    Object.fromEntries(
      ['red', 'green', 'yellow', 'blue'].map((color) => [
        color,
        bag.filter((tile) => tile.color === color).length,
      ]),
    ),
    { red: 11, green: 11, yellow: 11, blue: 11 },
    'each color should contribute 11 tiles',
  )
  assert.equal(
    bag.every((tile) => tile.value >= 0 && tile.value <= 5),
    true,
    'tile values should stay in the official zero-to-five range',
  )
  assert.equal(bag.filter((tile) => tile.action === 'minus2').length, 8)
  assert.equal(bag.filter((tile) => tile.action === 'swap').length, 12)
  assert.equal(bag.filter((tile) => tile.action === 'push').length, 8)
  assert.equal(bag.filter((tile) => tile.action === null).length, 16)
}

assert.deepEqual(QUATRO_COLOR_MARKS, {
  red: 'triangle',
  green: 'circle',
  yellow: 'star',
  blue: 'diamond',
})

{
  const bag = buildQuatroBag()
  const originalIds = bag.map((tile) => tile.id)
  let calls = 0
  const random = {
    int(maxExclusive: number) {
      calls += 1
      assert.equal(maxExclusive > 0, true)
      return 0
    },
  }

  const first = shuffleQuatroTiles(bag, random)
  const second = shuffleQuatroTiles(bag, {
    int: () => 0,
  })

  assert.deepEqual(
    bag.map((tile) => tile.id),
    originalIds,
    'shuffle should not mutate its input',
  )
  assert.deepEqual(
    first.map((tile) => tile.id),
    second.map((tile) => tile.id),
    'shuffle should be deterministic for a deterministic random source',
  )
  assert.equal(calls, bag.length - 1)
  assert.equal(new Set(first.map((tile) => tile.id)).size, 44)
}

console.log('UNO Quatro tile behavior tests passed')
