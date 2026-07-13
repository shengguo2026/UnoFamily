import assert from 'node:assert/strict'
import { buildMahjongTileSet, dealMahjongRound, mahjongTileSortValue, shuffleMahjongTiles, sortMahjongTiles } from '../src/game/mahjong/tiles'
import { standardMahjongRuleProfile } from '../src/game/mahjong/scoring'
import type { MahjongClaimWindow, MahjongMeld, MahjongPlayerState, MahjongState } from '../src/game/mahjong/types'

{
  const tiles = buildMahjongTileSet()

  assert.equal(tiles.length, 144, 'Chinese Mahjong should use a 144-tile set')
  assert.equal(tiles.filter((tile) => tile.category === 'suit' && tile.suit === 'dots').length, 36, 'dots should have 36 tiles')
  assert.equal(tiles.filter((tile) => tile.category === 'suit' && tile.suit === 'bamboo').length, 36, 'bamboo should have 36 tiles')
  assert.equal(tiles.filter((tile) => tile.category === 'suit' && tile.suit === 'characters').length, 36, 'characters should have 36 tiles')
  assert.equal(tiles.filter((tile) => tile.category === 'wind').length, 16, 'winds should have 16 tiles')
  assert.equal(tiles.filter((tile) => tile.category === 'dragon').length, 12, 'dragons should have 12 tiles')
  assert.equal(tiles.filter((tile) => tile.category === 'flower').length, 4, 'flowers should have 4 tiles')
  assert.equal(tiles.filter((tile) => tile.category === 'season').length, 4, 'seasons should have 4 tiles')

  for (const tile of tiles) {
    assert.equal(tiles.filter((candidate) => candidate.id === tile.id).length, 1, `tile id ${tile.id} should be unique`)
  }
}

{
  const sorted = sortMahjongTiles([
    { id: 'bamboo-2-1', category: 'suit', suit: 'bamboo', rank: 2, copy: 1, key: 'bamboo-2' },
    { id: 'dots-1-1', category: 'suit', suit: 'dots', rank: 1, copy: 1, key: 'dots-1' },
    { id: 'east-1', category: 'wind', wind: 'east', copy: 1, key: 'wind-east' },
    { id: 'characters-9-1', category: 'suit', suit: 'characters', rank: 9, copy: 1, key: 'characters-9' },
  ])

  assert.deepEqual(sorted.map((tile) => tile.id), ['dots-1-1', 'bamboo-2-1', 'characters-9-1', 'east-1'], 'tiles should sort by suit, rank, then honors')
  assert.ok(mahjongTileSortValue(sorted[0]) < mahjongTileSortValue(sorted[3]), 'sort values should increase across normal tile order')
}

{
  let calls = 0
  const shuffled = shuffleMahjongTiles(buildMahjongTileSet(), () => {
    calls += 1
    return 0
  })

  assert.notEqual(shuffled[0].id, buildMahjongTileSet()[0].id, 'shuffle should change the front of the wall')
  assert.equal(shuffled.length, 144, 'shuffle should preserve tile count')
  assert.equal(new Set(shuffled.map((tile) => tile.id)).size, 144, 'shuffle should preserve unique tile ids')
  assert.equal(calls > 0, true, 'shuffle should use the supplied random source')
}

{
  const wall = [
    ...buildMahjongTileSet().filter((tile) => tile.category === 'flower' || tile.category === 'season'),
    ...buildMahjongTileSet().filter((tile) => tile.category !== 'flower' && tile.category !== 'season'),
  ]
  const round = dealMahjongRound(wall, ['p1', 'p2', 'p3', 'p4'], 0)

  assert.equal(round.players.length, 4, 'Mahjong should deal four player states')
  assert.equal(round.players[0].concealed.length, 14, 'dealer should start with 14 concealed playable tiles after flower replacement')
  assert.equal(round.players[1].concealed.length, 13, 'non-dealer should start with 13 concealed playable tiles after flower replacement')
  assert.equal(round.players[0].flowers.length > 0, true, 'flowers dealt to the dealer should be exposed and replaced')
  assert.equal(round.players[0].concealed.some((tile) => tile.category === 'flower' || tile.category === 'season'), false, 'concealed hands should not keep flowers or seasons after replacement')
  assert.equal(round.wall.length + round.deadWall.length + round.players.reduce((sum, player) => sum + player.concealed.length + player.flowers.length, 0), 144, 'dealing should preserve every tile')
}

{
  const exposedMeld: MahjongMeld = {
    kind: 'pong',
    tiles: [
      { id: 'red-1', category: 'dragon', dragon: 'red', copy: 1, key: 'dragon-red' },
      { id: 'red-2', category: 'dragon', dragon: 'red', copy: 2, key: 'dragon-red' },
      { id: 'red-3', category: 'dragon', dragon: 'red', copy: 3, key: 'dragon-red' },
    ],
    claimedFromPlayerId: 'p4',
    claimedTileId: 'red-3',
  }
  const player: MahjongPlayerState = {
    id: 'p1',
    name: 'Player 1',
    type: 'human',
    concealed: [],
    exposedMelds: [exposedMeld],
    flowers: [],
    discardRiver: [],
    score: 0,
    wind: 'east',
  }
  const claimWindow: MahjongClaimWindow = {
    discard: exposedMeld.tiles[2],
    discarderId: 'p4',
    eligiblePlayerIds: ['p1', 'p2'],
    responses: {},
  }
  const state: MahjongState = {
    players: [player],
    wall: [],
    deadWall: [],
    activePlayerIndex: 0,
    dealerIndex: 0,
    prevailingWind: 'east',
    phase: 'claim',
    claimWindow,
    winnerId: null,
    ruleProfile: standardMahjongRuleProfile,
    roundResult: null,
    currentRound: 1,
    log: [],
    nextLogId: 1,
  }

  assert.equal(state.claimWindow?.discard.key, 'dragon-red', 'type model should support claimable discards')
  assert.equal(state.players[0].exposedMelds[0].claimedFromPlayerId, 'p4', 'type model should support exposed claimed melds')
}

console.log('Mahjong tile behavior tests passed')
