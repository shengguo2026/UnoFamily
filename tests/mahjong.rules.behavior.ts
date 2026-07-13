import assert from 'node:assert/strict'
import {
  createMahjongGame,
  mahjongClaim,
  mahjongDeclareKong,
  mahjongDeclareWin,
  mahjongDiscard,
  mahjongDraw,
  mahjongLegalClaimOptions,
  mahjongPassClaim,
  mahjongStartNextRound,
} from '../src/game/mahjong/rules'
import { standardMahjongRuleProfile } from '../src/game/mahjong/scoring'
import type { MahjongPlayerState, MahjongState, MahjongTile } from '../src/game/mahjong/types'

function suitTile(suit: 'dots' | 'bamboo' | 'characters', rank: number, copy: number): MahjongTile {
  return { id: `${suit}-${rank}-${copy}`, category: 'suit', suit, rank, copy, key: `${suit}-${rank}` }
}

function windTile(wind: 'east' | 'south' | 'west' | 'north', copy: number): MahjongTile {
  return { id: `${wind}-${copy}`, category: 'wind', wind, copy, key: `wind-${wind}` }
}

function dragonTile(dragon: 'red' | 'green' | 'white', copy: number): MahjongTile {
  return { id: `${dragon}-${copy}`, category: 'dragon', dragon, copy, key: `dragon-${dragon}` }
}

function flowerTile(): MahjongTile {
  return { id: 'flower-plum-1', category: 'flower', flower: 'plum', copy: 1, key: 'flower-plum' }
}

function player(id: string, concealed: MahjongTile[], index: number): MahjongPlayerState {
  const winds = ['east', 'south', 'west', 'north'] as const
  return {
    id,
    name: `Player ${index + 1}`,
    type: 'human',
    concealed,
    exposedMelds: [],
    flowers: [],
    discardRiver: [],
    score: 0,
    wind: winds[index],
  }
}

function claimState(discarderIndex = 0): MahjongState {
  const discard = suitTile('dots', 5, 4)
  return {
    players: [
      player('p1', [], 0),
      player('p2', [suitTile('dots', 3, 1), suitTile('dots', 4, 1), suitTile('bamboo', 8, 1)], 1),
      player('p3', [suitTile('dots', 5, 1), suitTile('dots', 5, 2), suitTile('characters', 1, 1)], 2),
      player('p4', [
        suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1),
        suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
        suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
        dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
        suitTile('dots', 5, 3),
      ], 3),
    ],
    wall: [],
    deadWall: [],
    activePlayerIndex: discarderIndex,
    dealerIndex: 0,
    prevailingWind: 'east',
    phase: 'claim',
    claimWindow: {
      discard,
      discarderId: 'p1',
      eligiblePlayerIds: ['p2', 'p3', 'p4'],
      responses: {},
    },
    winnerId: null,
    ruleProfile: standardMahjongRuleProfile,
    roundResult: null,
    currentRound: 1,
    log: [],
    nextLogId: 1,
  }
}

function kongClaimState(): MahjongState {
  const state = claimState()
  state.players[2].concealed = [suitTile('dots', 5, 1), suitTile('dots', 5, 2), suitTile('dots', 5, 3), suitTile('characters', 1, 1)]
  state.deadWall = [suitTile('bamboo', 9, 1)]
  state.wall = [suitTile('characters', 9, 1)]
  return state
}

{
  const state = createMahjongGame({ mode: 'single', aiDifficulty: 'hard' })

  assert.equal(state.ruleProfile.variant, 'standard', 'Mahjong should start with the standard rule profile')
  assert.equal(state.players.length, 4, 'Mahjong should always create four seats')
  assert.equal(state.players[0].type, 'human', 'single player keeps the first seat human')
  assert.equal(state.players.slice(1).every((seat) => seat.type === 'ai' && seat.aiDifficulty === 'hard'), true, 'single player should fill the other seats with configured AI')
  assert.equal(state.players[0].concealed.length, 14, 'dealer should begin with 14 concealed playable tiles')
  assert.equal(state.players[1].concealed.length, 13, 'non-dealers should begin with 13 concealed playable tiles')
  assert.equal(state.phase, 'discard', 'dealer starts by discarding')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.activePlayerIndex = 1
  state.players[1].concealed = Array.from({ length: 13 }, (_, index) => suitTile('bamboo', (index % 9) + 1, index + 1))
  state.players[1].flowers = []
  state.wall = [flowerTile()]
  state.deadWall = [suitTile('characters', 9, 1)]
  state.phase = 'draw'

  const drawn = mahjongDraw(state)

  assert.equal(drawn.players[1].concealed.length, 14, 'drawing a flower should expose it and draw a replacement tile')
  assert.equal(drawn.players[1].flowers.length, 1, 'drawn flower should be exposed')
  assert.equal(drawn.players[1].concealed.some((tile) => tile.category === 'flower'), false, 'flowers should not stay concealed')
  assert.equal(drawn.players[1].concealed.some((tile) => tile.id === 'characters-9-1'), true, 'replacement should enter the concealed hand')
  assert.equal(drawn.phase, 'discard', 'drawing opens the discard step')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  const discardedTile = suitTile('dots', 5, 1)
  state.players[0].concealed = [discardedTile, suitTile('bamboo', 1, 1)]
  state.phase = 'discard'

  const discarded = mahjongDiscard(state, discardedTile.id)

  assert.equal(discarded.players[0].concealed.some((tile) => tile.id === discardedTile.id), false, 'discarding removes the tile from the concealed hand')
  assert.equal(discarded.players[0].discardRiver.at(-1)?.id, discardedTile.id, 'discarding adds the tile to the discard river')
  assert.equal(discarded.phase, 'claim', 'discarding opens a claim window')
  assert.deepEqual(discarded.claimWindow?.eligiblePlayerIds, ['p2', 'p3', 'p4'], 'all other players should be eligible to respond to a discard')
}

{
  const state = claimState()

  assert.deepEqual(mahjongLegalClaimOptions(state, 'p2').map((option) => option.action), ['chow'], 'only the next player should be able to chow')
  assert.deepEqual(mahjongLegalClaimOptions(state, 'p3').map((option) => option.action), ['pong'], 'any other player with a pair can pong')
  assert.deepEqual(mahjongLegalClaimOptions(state, 'p4').map((option) => option.action), ['win'], 'a player with a completed hand can claim win')
}

{
  const state = claimState()
  const afterIllegalChow = mahjongClaim(state, 'p3', 'chow', ['dots-3-1', 'dots-4-1'])

  assert.equal(afterIllegalChow, state, 'non-next players cannot claim chow')
}

{
  const state = claimState()
  const afterChow = mahjongClaim(state, 'p2', 'chow', ['dots-3-1', 'dots-4-1'])

  assert.equal(afterChow.phase, 'claim', 'lower-priority chow should wait for higher-priority claim responders')
  assert.equal(afterChow.claimWindow?.responses.p2?.action, 'chow', 'pending chow response should be recorded')
}

{
  let state = claimState()
  state = mahjongClaim(state, 'p2', 'chow', ['dots-3-1', 'dots-4-1'])
  state = mahjongPassClaim(state, 'p4')
  const afterPong = mahjongClaim(state, 'p3', 'pong', ['dots-5-1', 'dots-5-2'])

  assert.equal(afterPong.players[2].exposedMelds[0].kind, 'pong', 'higher-priority pong should beat pending chow')
  assert.equal(afterPong.activePlayerIndex, 2, 'pong claimant should take the turn')
  assert.equal(afterPong.phase, 'discard', 'pong claimant must discard next')
}

{
  let state = claimState()
  state = mahjongClaim(state, 'p2', 'chow', ['dots-3-1', 'dots-4-1'])
  state = mahjongPassClaim(state, 'p3')
  const afterChow = mahjongPassClaim(state, 'p4')

  assert.equal(afterChow.players[1].concealed.some((tile) => tile.id === 'dots-3-1'), false, 'claiming chow removes selected hand tiles')
  assert.equal(afterChow.players[1].exposedMelds[0].kind, 'chow', 'claiming chow exposes a chow meld')
  assert.equal(afterChow.activePlayerIndex, 1, 'claiming a discard makes the claimant active')
  assert.equal(afterChow.phase, 'discard', 'claiming a discard requires the claimant to discard next')
  assert.equal(afterChow.claimWindow, null, 'claiming closes the claim window')
}

{
  let state = claimState()
  state = mahjongPassClaim(state, 'p4')
  const afterPong = mahjongClaim(state, 'p3', 'pong', ['dots-5-1', 'dots-5-2'])

  assert.equal(afterPong.players[2].exposedMelds[0].kind, 'pong', 'claiming pong exposes a pong meld')
  assert.equal(afterPong.players[2].exposedMelds[0].tiles.length, 3, 'pong meld should include the discarded tile')
  assert.equal(afterPong.activePlayerIndex, 2, 'pong claimant takes the turn')
}

{
  let state = kongClaimState()
  state = mahjongPassClaim(state, 'p4')
  const afterKong = mahjongClaim(state, 'p3', 'kong', ['dots-5-1', 'dots-5-2', 'dots-5-3'])

  assert.equal(afterKong.players[2].exposedMelds[0].kind, 'kong', 'claiming with three matching tiles should expose a kong')
  assert.equal(afterKong.players[2].concealed.some((tile) => tile.id === 'bamboo-9-1'), true, 'claimed kong should draw a replacement from the dead wall')
  assert.equal(afterKong.deadWall.length, 0, 'claimed kong replacement should consume the dead wall')
  assert.equal(afterKong.wall.length, 1, 'claimed kong replacement should not consume the live wall')
  assert.equal(afterKong.phase, 'discard', 'claimed kong replacement should leave claimant ready to discard')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.activePlayerIndex = 0
  state.phase = 'discard'
  state.players[0].concealed = [
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3), dragonTile('red', 4),
    suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
    windTile('east', 1),
  ]
  state.deadWall = [suitTile('bamboo', 9, 1)]

  const afterKong = mahjongDeclareKong(state, 'dragon-red-1')

  assert.equal(afterKong.players[0].exposedMelds[0].kind, 'kong', 'concealed kong should create a kong meld')
  assert.equal(afterKong.players[0].exposedMelds[0].concealed, true, 'self-declared four-of-a-kind should stay marked as concealed')
  assert.equal(afterKong.players[0].concealed.some((tile) => tile.key === 'dragon-red'), false, 'concealed kong should remove all four matching tiles from hand')
  assert.equal(afterKong.players[0].concealed.some((tile) => tile.id === 'bamboo-9-1'), true, 'concealed kong should draw a replacement from the dead wall')
  assert.equal(afterKong.phase, 'discard', 'concealed kong replacement should keep player in discard phase')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.activePlayerIndex = 0
  state.phase = 'discard'
  state.players[0].exposedMelds = [{
    kind: 'pong',
    tiles: [suitTile('dots', 7, 1), suitTile('dots', 7, 2), suitTile('dots', 7, 3)],
    claimedFromPlayerId: 'p3',
    claimedTileId: 'dots-7-3',
  }]
  state.players[0].concealed = [
    suitTile('dots', 7, 4),
    suitTile('bamboo', 1, 1), suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1),
    suitTile('characters', 4, 1), suitTile('characters', 5, 1), suitTile('characters', 6, 1),
    windTile('east', 1), windTile('east', 2),
  ]
  state.deadWall = [suitTile('characters', 9, 1)]

  let afterKong = mahjongDeclareKong(state, 'dots-7-4')
  afterKong = mahjongPassClaim(afterKong, 'p2')
  afterKong = mahjongPassClaim(afterKong, 'p3')
  afterKong = mahjongPassClaim(afterKong, 'p4')

  assert.equal(afterKong.players[0].exposedMelds[0].kind, 'kong', 'drawn fourth tile should upgrade an exposed pong to a kong')
  assert.equal(afterKong.players[0].exposedMelds[0].tiles.length, 4, 'added kong should contain the drawn fourth tile')
  assert.equal(afterKong.players[0].concealed.some((tile) => tile.id === 'dots-7-4'), false, 'added kong should remove the fourth tile from hand')
  assert.equal(afterKong.players[0].concealed.some((tile) => tile.id === 'characters-9-1'), true, 'added kong should draw a replacement from the dead wall')
  assert.equal(afterKong.players[0].exposedMelds[0].concealed, false, 'added kong remains an exposed meld')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.activePlayerIndex = 0
  state.phase = 'discard'
  state.players[0].exposedMelds = [{
    kind: 'pong',
    tiles: [suitTile('dots', 7, 1), suitTile('dots', 7, 2), suitTile('dots', 7, 3)],
    claimedFromPlayerId: 'p3',
    claimedTileId: 'dots-7-3',
  }]
  state.players[0].concealed = [suitTile('dots', 7, 4), windTile('north', 1)]
  state.players[1].concealed = [
    suitTile('bamboo', 1, 1), suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1),
    suitTile('characters', 4, 1), suitTile('characters', 5, 1), suitTile('characters', 6, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    windTile('east', 1), windTile('east', 2), suitTile('dots', 7, 1), suitTile('dots', 7, 2),
  ]
  state.deadWall = [suitTile('characters', 9, 1)]

  const robWindow = mahjongDeclareKong(state, 'dots-7-4')

  assert.equal(robWindow.phase, 'claim', 'added kong should open a rob-kong claim window before replacement')
  assert.deepEqual(mahjongLegalClaimOptions(robWindow, 'p2').map((option) => option.action), ['win'], 'rob-kong window should allow a completing player to claim win')
  assert.deepEqual(mahjongLegalClaimOptions(robWindow, 'p3').map((option) => option.action), [], 'rob-kong window should not allow non-winning pong or chow claims')

  const robbed = mahjongClaim(robWindow, 'p2', 'win')
  assert.equal(robbed.winnerId, 'p2', 'player should be able to rob an added kong for the win')
  assert.equal(robbed.roundResult?.wonFromPlayerId, 'p1', 'added-kong declarer should be treated as the discarder for payment')
  assert.equal(robbed.roundResult?.selfDraw, false, 'robbing a kong is scored as a discard win')
  assert.equal(robbed.players[0].concealed.some((tile) => tile.id === 'dots-7-4'), false, 'robbed kong tile should leave the declarer hand')
  assert.equal(robbed.players[0].exposedMelds[0].kind, 'pong', 'robbed added kong should leave the original meld as a pong')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.activePlayerIndex = 0
  state.phase = 'discard'
  state.players[0].exposedMelds = [{
    kind: 'pong',
    tiles: [suitTile('dots', 7, 1), suitTile('dots', 7, 2), suitTile('dots', 7, 3)],
    claimedFromPlayerId: 'p3',
    claimedTileId: 'dots-7-3',
  }]
  state.players[0].concealed = [suitTile('dots', 7, 4), windTile('north', 1)]
  state.deadWall = [suitTile('characters', 9, 1)]

  let robWindow = mahjongDeclareKong(state, 'dots-7-4')
  robWindow = mahjongPassClaim(robWindow, 'p2')
  robWindow = mahjongPassClaim(robWindow, 'p3')
  const afterPasses = mahjongPassClaim(robWindow, 'p4')

  assert.equal(afterPasses.players[0].exposedMelds[0].kind, 'kong', 'added kong should complete after every opponent passes')
  assert.equal(afterPasses.players[0].concealed.some((tile) => tile.id === 'dots-7-4'), false, 'completed added kong should remove the fourth tile')
  assert.equal(afterPasses.players[0].concealed.some((tile) => tile.id === 'characters-9-1'), true, 'completed added kong should draw the replacement after passes')
  assert.equal(afterPasses.phase, 'discard', 'completed added kong should return to discard phase')
}

{
  const state = claimState()
  const afterWin = mahjongClaim(state, 'p4', 'win')

  assert.equal(afterWin.winnerId, 'p4', 'claiming a winning discard ends the round')
  assert.equal(afterWin.phase, 'roundOver', 'winning should put the round into round-over phase')
  assert.equal(afterWin.roundResult?.kind, 'win', 'discard win should produce a round result')
  assert.equal(afterWin.roundResult?.selfDraw, false, 'discard win should not be marked as self-draw')
  assert.deepEqual(afterWin.roundResult?.payments, [
    { playerId: 'p1', delta: -16 },
    { playerId: 'p4', delta: 16 },
  ], 'dealer discarder should pay double for a standard discard win')
  assert.equal(afterWin.players[0].score, -16, 'dealer discarder score should decrease by the doubled payment')
  assert.equal(afterWin.players[3].score, 16, 'winner score should increase by the doubled dealer payment')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.activePlayerIndex = 1
  state.phase = 'discard'
  state.players[1].exposedMelds = [{
    kind: 'chow',
    tiles: [suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1)],
    claimedFromPlayerId: 'p1',
    claimedTileId: 'dots-3-1',
  }]
  state.players[1].concealed = [
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    windTile('east', 1), windTile('east', 2),
  ]

  const afterWin = mahjongDeclareWin(state)

  assert.equal(afterWin.winnerId, 'p2', 'active player should be able to self-draw win after exposing a meld')
  assert.equal(afterWin.roundResult?.selfDraw, true, 'exposed-meld self-draw should still be marked as self-draw')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.activePlayerIndex = 1
  state.phase = 'discard'
  state.players[1].concealed = [
    suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    windTile('east', 1), windTile('east', 2),
  ]

  const afterWin = mahjongDeclareWin(state)

  assert.equal(afterWin.winnerId, 'p2', 'active player should be able to declare self-draw win with a complete hand')
  assert.equal(afterWin.roundResult?.selfDraw, true, 'self-draw win should be marked as self-draw')
  assert.deepEqual(afterWin.roundResult?.payments, [
    { playerId: 'p1', delta: -16 },
    { playerId: 'p2', delta: 32 },
    { playerId: 'p3', delta: -8 },
    { playerId: 'p4', delta: -8 },
  ], 'dealer should pay double when a non-dealer wins by self-draw')
  assert.equal(afterWin.players[1].score, 32, 'self-draw winner should receive the doubled dealer payment plus normal opponent payments')
}

{
  const state = createMahjongGame({ mode: 'hotseat', dealerIndex: 0 })
  state.activePlayerIndex = 0
  state.phase = 'discard'
  state.players[0].concealed = [
    suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    windTile('east', 1), windTile('east', 2),
  ]

  const afterWin = mahjongDeclareWin(state)

  assert.deepEqual(afterWin.roundResult?.payments, [
    { playerId: 'p1', delta: 48 },
    { playerId: 'p2', delta: -16 },
    { playerId: 'p3', delta: -16 },
    { playerId: 'p4', delta: -16 },
  ], 'dealer self-draw should collect double from every opponent')
}

{
  const discard = windTile('east', 3)
  const state: MahjongState = {
    players: [
      player('p1', [discard], 0),
      player('p2', [
        suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
        suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
        dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
        windTile('east', 1),
      ], 1),
      player('p3', [], 2),
      player('p4', [], 3),
    ],
    wall: [],
    deadWall: [],
    activePlayerIndex: 0,
    dealerIndex: 0,
    prevailingWind: 'east',
    phase: 'claim',
    claimWindow: {
      discard,
      discarderId: 'p1',
      eligiblePlayerIds: ['p2'],
      responses: {},
    },
    winnerId: null,
    ruleProfile: standardMahjongRuleProfile,
    roundResult: null,
    currentRound: 1,
    log: [],
    nextLogId: 1,
  }
  state.players[1].exposedMelds = [{
    kind: 'chow',
    tiles: [suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1)],
    claimedFromPlayerId: 'p4',
    claimedTileId: 'dots-3-1',
  }]

  assert.deepEqual(mahjongLegalClaimOptions(state, 'p2').map((option) => option.action), ['win'], 'discard can complete a hand with an exposed meld')
  const afterWin = mahjongClaim(state, 'p2', 'win')

  assert.equal(afterWin.winnerId, 'p2', 'player should be able to win on discard after exposing a meld')
  assert.equal(afterWin.roundResult?.selfDraw, false, 'exposed-meld discard win should be marked as discard win')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.activePlayerIndex = 0
  state.phase = 'draw'
  state.wall = []

  const exhausted = mahjongDraw(state)

  assert.equal(exhausted.phase, 'roundOver', 'empty wall should end the round')
  assert.equal(exhausted.roundResult?.kind, 'draw', 'empty wall should produce a drawn-round result')
  assert.equal(exhausted.roundResult?.payments.length, 0, 'drawn round should not create score payments')
}

{
  const state = createMahjongGame({ mode: 'hotseat', dealerIndex: 0 })
  state.activePlayerIndex = 1
  state.phase = 'discard'
  state.players[1].concealed = [
    suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    windTile('east', 1), windTile('east', 2),
  ]

  const afterWin = mahjongDeclareWin(state)
  const nextRound = mahjongStartNextRound(afterWin, { wall: Array.from({ length: 144 }, (_, index) => suitTile('dots', (index % 9) + 1, index + 1)) })

  assert.equal(nextRound.currentRound, 2, 'starting the next round should increment the round number')
  assert.equal(nextRound.dealerIndex, 1, 'dealer should rotate after a non-dealer win in the standard profile')
  assert.equal(nextRound.activePlayerIndex, 1, 'new dealer should become the active player')
}

{
  const state = createMahjongGame({ mode: 'hotseat', dealerIndex: 3 })
  state.prevailingWind = 'east'
  state.activePlayerIndex = 0
  state.phase = 'discard'
  state.players[0].concealed = [
    suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    windTile('east', 1), windTile('east', 2),
  ]

  const afterWin = mahjongDeclareWin(state)
  const nextRound = mahjongStartNextRound(afterWin, { wall: Array.from({ length: 144 }, (_, index) => suitTile('dots', (index % 9) + 1, index + 1)) })

  assert.equal(nextRound.dealerIndex, 0, 'dealer should wrap from fourth seat back to first seat')
  assert.equal(nextRound.prevailingWind, 'south', 'prevailing wind should advance after the dealer wraps back to first seat')
}

{
  let state = claimState()
  state = mahjongPassClaim(state, 'p2')
  state = mahjongPassClaim(state, 'p3')
  state = mahjongPassClaim(state, 'p4')

  assert.equal(state.claimWindow, null, 'claim window should close after every eligible player passes')
  assert.equal(state.activePlayerIndex, 1, 'if nobody claims, the next player becomes active')
  assert.equal(state.phase, 'draw', 'if nobody claims, the next player starts with a draw step')
}

console.log('Mahjong rule behavior tests passed')
