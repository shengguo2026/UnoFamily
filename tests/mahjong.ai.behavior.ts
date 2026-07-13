import assert from 'node:assert/strict'
import { chooseMahjongAiAction, chooseMahjongDiscard } from '../src/game/mahjong/ai'
import { getMahjongHint } from '../src/game/mahjong/hints'
import { createMahjongGame } from '../src/game/mahjong/rules'
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

function completeHand(): MahjongTile[] {
  return [
    suitTile('dots', 1, 1), suitTile('dots', 2, 1), suitTile('dots', 3, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 7, 1), suitTile('characters', 8, 1), suitTile('characters', 9, 1),
    dragonTile('red', 1), dragonTile('red', 2), dragonTile('red', 3),
    windTile('east', 1), windTile('east', 2),
  ]
}

function heuristicHand(): MahjongTile[] {
  return [
    suitTile('dots', 2, 1), suitTile('dots', 3, 1), suitTile('dots', 4, 1),
    suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1), suitTile('bamboo', 5, 1),
    suitTile('characters', 6, 1), suitTile('characters', 7, 1), suitTile('characters', 8, 1),
    dragonTile('red', 1), dragonTile('red', 2),
    suitTile('dots', 7, 1), suitTile('dots', 8, 1),
    windTile('north', 1),
  ]
}

function isolatedHonorVsSuitHand(): MahjongTile[] {
  return [
    suitTile('dots', 2, 1), suitTile('dots', 3, 1), suitTile('dots', 4, 1),
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('characters', 3, 1), suitTile('characters', 4, 1), suitTile('characters', 5, 1),
    dragonTile('red', 1), dragonTile('red', 2),
    suitTile('dots', 9, 1),
    suitTile('bamboo', 8, 1),
    windTile('north', 1),
  ]
}

function isolatedTerminalVsMiddleHand(): MahjongTile[] {
  return [
    suitTile('bamboo', 2, 1), suitTile('bamboo', 3, 1), suitTile('bamboo', 4, 1),
    suitTile('bamboo', 5, 1), suitTile('bamboo', 6, 1), suitTile('bamboo', 7, 1),
    suitTile('characters', 2, 1), suitTile('characters', 3, 1), suitTile('characters', 4, 1),
    dragonTile('red', 1), dragonTile('red', 2),
    suitTile('dots', 5, 1),
    suitTile('dots', 9, 1),
  ]
}

function player(id: string, concealed: MahjongTile[], index: number): MahjongPlayerState {
  const winds = ['east', 'south', 'west', 'north'] as const
  return {
    id,
    name: `Player ${index + 1}`,
    type: 'ai',
    aiDifficulty: 'medium',
    concealed,
    exposedMelds: [],
    flowers: [],
    discardRiver: [],
    score: 0,
    wind: winds[index],
  }
}

function claimState(): MahjongState {
  const discard = suitTile('dots', 5, 4)
  return {
    players: [
      player('p1', [], 0),
      player('p2', [suitTile('dots', 3, 1), suitTile('dots', 4, 1), suitTile('bamboo', 8, 1)], 1),
      player('p3', [suitTile('dots', 5, 1), suitTile('dots', 5, 2), suitTile('characters', 1, 1)], 2),
      player('p4', [...completeHand().filter((tile) => tile.key !== 'wind-east'), suitTile('dots', 5, 3)], 3),
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

{
  const state = createMahjongGame({ mode: 'single' })
  state.activePlayerIndex = 1
  state.phase = 'draw'

  const action = chooseMahjongAiAction(state)

  assert.equal(action.type, 'draw', 'AI should draw when it is in the draw phase')
}

{
  const state = createMahjongGame({ mode: 'single' })
  state.activePlayerIndex = 1
  state.phase = 'discard'
  state.players[1].concealed = completeHand()

  const action = chooseMahjongAiAction(state)

  assert.equal(action.type, 'declareWin', 'AI should declare a complete self-draw hand before discarding')
}

{
  const state = claimState()
  const action = chooseMahjongAiAction(state, 'p4')

  assert.equal(action.type, 'claim', 'AI should claim a winning discard')
  assert.equal(action.claimAction, 'win', 'winning claim should outrank pong and chow')
}

{
  const state = claimState()
  state.players[2].aiDifficulty = 'easy'

  const action = chooseMahjongAiAction(state, 'p3')

  assert.equal(action.type, 'pass', 'easy AI should pass non-winning pong claims to keep claim behavior simple')
}

{
  const state = claimState()
  state.players[2].aiDifficulty = 'hard'

  const action = chooseMahjongAiAction(state, 'p3')

  assert.equal(action.type, 'claim', 'hard AI should claim useful non-winning pong opportunities')
  assert.equal(action.claimAction, 'pong', 'hard AI should prefer pong when it cannot win')
}

{
  const state = claimState()
  state.players[1].aiDifficulty = 'medium'

  const action = chooseMahjongAiAction(state, 'p2')

  assert.equal(action.type, 'pass', 'medium AI should pass non-winning chow claims')
}

{
  const state = claimState()
  state.players[1].aiDifficulty = 'hard'

  const action = chooseMahjongAiAction(state, 'p2')

  assert.equal(action.type, 'claim', 'hard AI should claim useful chow opportunities')
  assert.equal(action.claimAction, 'chow', 'hard AI can use chow to improve sequence shape')
}

{
  const discarded = chooseMahjongDiscard(heuristicHand(), 'hard')

  assert.equal(discarded.tile.id, 'north-1', 'hard AI should discard the isolated honor before breaking useful shapes')
  assert.equal(discarded.reasonKey, 'mahjong.reason.isolatedHonor', 'discard recommendation should explain isolated honor choice')
}

{
  const discarded = chooseMahjongDiscard(isolatedHonorVsSuitHand(), 'hard')

  assert.equal(discarded.tile.id, 'north-1', 'hard AI should discard an isolated honor before an isolated suit tile')
  assert.equal(discarded.reasonKey, 'mahjong.reason.isolatedHonor', 'honor-first discard should explain the isolated honor')
}

{
  const discarded = chooseMahjongDiscard(isolatedTerminalVsMiddleHand(), 'hard')

  assert.equal(discarded.tile.id, 'dots-9-1', 'hard AI should discard an isolated terminal before an isolated middle suit tile')
  assert.equal(discarded.reasonKey, 'mahjong.reason.isolatedTerminal', 'terminal discard should explain that 1/9 tiles have fewer sequence options')
}

{
  const state = createMahjongGame({ mode: 'hotseat' })
  state.activePlayerIndex = 0
  state.phase = 'discard'
  state.players[0].concealed = heuristicHand()
  state.players[1].concealed = completeHand()

  const hint = getMahjongHint(state, 'p1')

  assert.equal(hint.titleKey, 'mahjong.hint.discard')
  assert.equal(hint.suggestedAction.type, 'discard')
  assert.equal(hint.suggestedAction.tileId, 'north-1')
  assert.equal(hint.reasonKeys.includes('mahjong.reason.isolatedHonor'), true, 'hint should explain why the tile is suggested')
  assert.equal(hint.reasonKeys.includes('mahjong.reason.keepPair'), true, 'hint should explain that an existing pair is being preserved')
  assert.equal(hint.reasonKeys.includes('mahjong.reason.keepSequence'), true, 'hint should explain that complete sequences are being preserved')
  assert.equal(hint.reasonKeys.includes('mahjong.reason.keepNearSequence'), true, 'hint should explain that two-tile sequence waits are being preserved')
  assert.equal(hint.reasonKeys.some((reason) => reason.includes('p2') || reason.includes('Player 2')), false, 'hint should not reveal hidden opponent hand details')
}

{
  const hint = getMahjongHint(claimState(), 'p4')

  assert.equal(hint.titleKey, 'mahjong.hint.claimWin')
  assert.equal(hint.suggestedAction.type, 'claim')
  assert.equal(hint.suggestedAction.claimAction, 'win')
}

console.log('Mahjong AI and hint behavior tests passed')
