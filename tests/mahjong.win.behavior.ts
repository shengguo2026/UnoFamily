import assert from 'node:assert/strict'
import { evaluateMahjongWin } from '../src/game/mahjong/win'
import type { MahjongTile } from '../src/game/mahjong/types'

function suitTile(suit: 'dots' | 'bamboo' | 'characters', rank: number, copy: number): MahjongTile {
  return { id: `${suit}-${rank}-${copy}`, category: 'suit', suit, rank, copy, key: `${suit}-${rank}` }
}

function windTile(wind: 'east' | 'south' | 'west' | 'north', copy: number): MahjongTile {
  return { id: `${wind}-${copy}`, category: 'wind', wind, copy, key: `wind-${wind}` }
}

function dragonTile(dragon: 'red' | 'green' | 'white', copy: number): MahjongTile {
  return { id: `${dragon}-${copy}`, category: 'dragon', dragon, copy, key: `dragon-${dragon}` }
}

{
  const result = evaluateMahjongWin([
    suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    windTile('east', 1), windTile('east', 2),
  ])

  assert.equal(result.winning, true, 'four melds plus one pair should win')
  assert.equal(result.pattern, 'standard', 'mixed chows and pongs should be a standard win')
  assert.equal(result.melds.length, 4, 'standard win should explain four melds')
  assert.equal(result.pair?.[0]?.key, 'wind-east', 'standard win should explain the pair')
}

{
  const result = evaluateMahjongWin([
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    windTile('east', 1), windTile('east', 2),
  ], { exposedMeldCount: 1 })

  assert.equal(result.winning, true, 'one exposed meld plus three concealed melds and a pair should win')
  assert.equal(result.melds.length, 3, 'exposed-meld win should explain only the remaining concealed melds')
  assert.equal(result.pair?.[0]?.key, 'wind-east', 'exposed-meld win should still explain the pair')
}

{
  const result = evaluateMahjongWin([
    dragonTile('red', 1), dragonTile('red', 2),
    windTile('east', 1), windTile('east', 2),
    windTile('south', 1),
  ], { exposedMeldCount: 3 })

  assert.equal(result.winning, false, 'three exposed melds still require one concealed meld plus a pair')
  assert.equal(result.reason, 'noValidGrouping', 'exposed hand near-miss should reject invalid concealed grouping')
}

{
  const result = evaluateMahjongWin([
    suitTile('dots', 1, 1), suitTile('dots', 1, 2), suitTile('dots', 1, 3),
    suitTile('bamboo', 5, 1), suitTile('bamboo', 5, 2), suitTile('bamboo', 5, 3),
    suitTile('characters', 9, 1), suitTile('characters', 9, 2), suitTile('characters', 9, 3),
    windTile('south', 1), windTile('south', 2), windTile('south', 3),
    dragonTile('green', 1), dragonTile('green', 2),
  ])

  assert.equal(result.winning, true, 'four triplets plus one pair should win')
  assert.equal(result.melds.every((meld) => meld.kind === 'pong'), true, 'all-pong win should be explained as pongs')
}

{
  const result = evaluateMahjongWin([
    suitTile('dots', 1, 1), suitTile('dots', 1, 2),
    suitTile('dots', 3, 1), suitTile('dots', 3, 2),
    suitTile('bamboo', 5, 1), suitTile('bamboo', 5, 2),
    suitTile('bamboo', 7, 1), suitTile('bamboo', 7, 2),
    suitTile('characters', 2, 1), suitTile('characters', 2, 2),
    windTile('west', 1), windTile('west', 2),
    dragonTile('white', 1), dragonTile('white', 2),
  ])

  assert.equal(result.winning, true, 'seven pairs should win when enabled')
  assert.equal(result.pattern, 'sevenPairs', 'seven pairs should be identified as its own pattern')
}

{
  const result = evaluateMahjongWin([
    suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    windTile('east', 1),
  ])

  assert.equal(result.winning, false, '13 tiles should not be a complete win')
  assert.equal(result.reason, 'wrongTileCount', 'near-miss should explain wrong tile count')
}

{
  const result = evaluateMahjongWin([
    windTile('east', 1), windTile('south', 1), windTile('west', 1),
    suitTile('dots', 2, 1), suitTile('dots', 3, 1), suitTile('dots', 4, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    dragonTile('green', 1), dragonTile('green', 2),
  ])

  assert.equal(result.winning, false, 'winds should not form sequences')
}

{
  const result = evaluateMahjongWin([
    suitTile('dots', 1, 1), suitTile('dots', 1, 2), suitTile('dots', 1, 3), suitTile('dots', 1, 4), suitTile('dots', 1, 5),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 6, 1), suitTile('characters', 7, 1), suitTile('characters', 8, 1),
    dragonTile('white', 1), dragonTile('white', 2), dragonTile('white', 3),
  ])

  assert.equal(result.winning, false, 'five copies of a tile should be rejected')
  assert.equal(result.reason, 'tooManyCopies', 'invalid duplicate count should be explained')
}

console.log('Mahjong win behavior tests passed')
