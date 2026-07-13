import assert from 'node:assert/strict'
import { availableMahjongControlActions } from '../src/game/mahjong/ui'
import { createMahjongGame } from '../src/game/mahjong/rules'
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
  const state = createMahjongGame({ mode: 'hotseat' })
  state.phase = 'draw'
  state.activePlayerIndex = 0

  assert.deepEqual(availableMahjongControlActions(state, 'p1', null), ['draw'], 'active player can draw in draw phase')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.phase = 'discard'
  state.activePlayerIndex = 0
  state.players[0].concealed = [
    suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    windTile('east', 1), windTile('east', 2),
  ]

  assert.deepEqual(availableMahjongControlActions(state, 'p1', 'east-1'), ['declareWin', 'discard'], 'complete active hand can declare win or discard selected tile')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.phase = 'discard'
  state.activePlayerIndex = 0
  state.players[0].concealed = [
    suitTile('dots', 1, 1), suitTile('dots', 3, 1), suitTile('dots', 5, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 4, 1), suitTile('bamboo', 6, 1),
    suitTile('characters', 1, 1), suitTile('characters', 9, 1),
    windTile('east', 1), windTile('south', 1), windTile('west', 1), windTile('north', 1),
    dragonTile('red', 1), dragonTile('green', 1),
  ]

  assert.deepEqual(
    availableMahjongControlActions(state, 'p1', null),
    ['discard'],
    'active player should still be able to discard when no tile is selected yet',
  )
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.phase = 'discard'
  state.activePlayerIndex = 0
  state.players[0].concealed = [
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3), dragonTile('red', 4),
    suitTile('dots', 1, 1), suitTile('dots', 4, 1), suitTile('dots', 7, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 5, 1), suitTile('bamboo', 8, 1),
    suitTile('characters', 1, 1), suitTile('characters', 5, 1), suitTile('characters', 9, 1),
    windTile('east', 1),
  ]

  assert.deepEqual(
    availableMahjongControlActions(state, 'p1', 'red-1'),
    ['declareKong', 'discard'],
    'active player should be able to declare a concealed kong from four matching tiles',
  )
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.phase = 'discard'
  state.activePlayerIndex = 0
  state.players[0].exposedMelds = [{
    kind: 'pong',
    tiles: [suitTile('dots', 7, 1), suitTile('dots', 7, 2), suitTile('dots', 7, 3)],
    claimedFromPlayerId: 'p3',
    claimedTileId: 'dots-7-3',
  }]
  state.players[0].concealed = [
    suitTile('dots', 7, 4),
    suitTile('bamboo', 1, 1), suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1),
  ]

  assert.deepEqual(
    availableMahjongControlActions(state, 'p1', 'dots-7-4'),
    ['declareKong', 'discard'],
    'active player should be able to upgrade an exposed pong with the fourth matching tile',
  )
}

console.log('Mahjong UI behavior tests passed')
