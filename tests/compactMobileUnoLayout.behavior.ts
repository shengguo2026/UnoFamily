import assert from 'node:assert/strict'
import type { GameVariant } from '../src/game/types'
import { compactMobileUnoLayoutGeometryForTest, usesCompactMobileUnoLayoutForTest } from '../src/components/GameCanvas'

function intersects(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

const phone = { width: 390, height: 620 }
const standardUnoGames: GameVariant[] = [
  'classic',
  'extreme',
  'flash',
  'flip',
  'h2o',
  'spin',
  'flex',
  'liars',
  'party',
  'teams',
  'houseRules',
  'challenge',
  'flipExtreme',
  'lotr',
  'popCulture',
  'allWild',
  'noMercy',
  'superMario',
  'sonic',
  'barbie',
  'motu',
  'tmnt',
  'spiderman',
  'dc',
  'starTrek',
  'avatar',
  'monsterHigh',
  'nfl',
  'triplePlay',
  'minecraft',
  'wildJackpot',
  'blast',
  'roboto',
  'tippo',
  'dice',
  'emoji',
  'marioKart',
  'guoNeighborMatch',
  'guoHiLo',
  'guoPassage',
]

for (const game of standardUnoGames) {
  assert.equal(usesCompactMobileUnoLayoutForTest(game, phone.width, phone.height, 4), true, `${game} should use compact mobile UNO seats for four players`)
}

for (const game of ['zero', 'cabo', 'skyjo', 'dos', 'phase10', 'skipBo', 'mahjong', 'guoUnoMahjong'] as GameVariant[]) {
  assert.equal(usesCompactMobileUnoLayoutForTest(game, phone.width, phone.height, 4), false, `${game} keeps its specialized mobile layout`)
}

assert.equal(usesCompactMobileUnoLayoutForTest('classic', 900, 620, 4), false, 'desktop Classic should keep the full table layout')
assert.equal(usesCompactMobileUnoLayoutForTest('allWild', phone.width, phone.height, 5), false, 'five-plus-player games should keep the multi-seat layout instead of hiding players')
assert.equal(usesCompactMobileUnoLayoutForTest('guoNeighborMatch', 932, 430, 4), true, 'Neighbor Match should use compact seats on wide phone landscape displays')
assert.equal(usesCompactMobileUnoLayoutForTest('guoNeighborMatch', 980, 700, 4, true), true, 'Neighbor Match should use compact seats when a phone reports a large touch viewport')

const geometry = compactMobileUnoLayoutGeometryForTest(phone.width, phone.height, 4, 7)
for (const seat of geometry.seats) {
  assert.equal(intersects(seat.labelRect, seat.stackRect), false, `${seat.align} compact UNO cards should not overlap the player label`)
  assert.equal(intersects(seat.labelRect, geometry.centerRect), false, `${seat.align} compact UNO label should stay clear of the center piles`)
  if (seat.align !== 'bottom') {
    assert.equal(intersects(seat.stackRect, geometry.centerRect), false, `${seat.align} compact UNO cards should stay clear of the center piles`)
  }
}

const landscapeGeometry = compactMobileUnoLayoutGeometryForTest(932, 430, 4, 10)
for (const seat of landscapeGeometry.seats) {
  assert.equal(seat.labelRect.x >= 0, true, `${seat.align} compact UNO label should stay inside the left viewport edge`)
  assert.equal(seat.labelRect.x + seat.labelRect.w <= 932, true, `${seat.align} compact UNO label should stay inside the right viewport edge`)
}
assert.equal(
  intersects(landscapeGeometry.seats[3].labelRect, landscapeGeometry.seats[0].stackRect),
  false,
  'left player label should not overlap the bottom hand on phone landscape displays',
)
assert.equal(
  landscapeGeometry.seats[0].stackRect.x >= 0 && landscapeGeometry.seats[0].stackRect.x + landscapeGeometry.seats[0].stackRect.w <= 932,
  true,
  'bottom compact UNO hand should stay visible on phone landscape displays',
)

const touchViewportGeometry = compactMobileUnoLayoutGeometryForTest(980, 700, 4, 10, true)
for (const seat of touchViewportGeometry.seats) {
  assert.equal(seat.labelRect.x >= 0, true, `${seat.align} touch viewport label should stay inside the left edge`)
  assert.equal(seat.labelRect.x + seat.labelRect.w <= 980, true, `${seat.align} touch viewport label should stay inside the right edge`)
}
assert.equal(
  intersects(touchViewportGeometry.seats[3].labelRect, touchViewportGeometry.seats[0].stackRect),
  false,
  'left player label should not overlap the bottom hand when a phone reports a large touch viewport',
)

console.log('Compact mobile UNO layout regression tests passed')
