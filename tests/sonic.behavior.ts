import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildSonicDeck } from '../src/game/deck'
import type { AddOnPack, Card, GameState, GameVariant, UnoColor } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function card(id: string, kind: Card['kind'], color: UnoColor | 'wild', label: string, points: number, value?: number): Card {
  return { id, kind, color, label, points, value }
}

function sonicState(): GameState {
  return {
    ...createGame(createConfig('sonic' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('draw-1', 'number', 'green', '1', 1, 1),
      card('draw-2', 'number', 'blue', '2', 2, 2),
      card('draw-3', 'number', 'yellow', '3', 3, 3),
      card('draw-4', 'number', 'red', '4', 4, 4),
    ],
    discardPile: [card('top', 'number', 'red', '5', 5, 5)],
    activePlayerIndex: 0,
    activeColor: 'red',
    direction: 1,
    pendingDraw: null,
    drewThisTurn: false,
    drawnCardIdThisTurn: null,
    winnerId: null,
    gameWinnerId: null,
  }
}

{
  const deck = buildSonicDeck()

  assert.equal(deck.length, 112, 'UNO Sonic should use a 112-card playable deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildVictoryLap').length, 4, 'UNO Sonic should include four Victory Lap cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Sonic should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('sonic' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Sonic should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildVictoryLap'), true, 'created games should use the Sonic deck')
}

{
  const state = sonicState()
  state.players[0].hand = [card('lap', 'wildVictoryLap', 'wild', 'Victory Lap', 50)]

  const result = playCard(state, 'lap', { color: 'blue' }).state

  assert.equal(result.activeColor, 'blue', 'Victory Lap should choose the next active color')
  assert.equal(result.players[0].hand.length, 0, 'the source player should discard Victory Lap')
  assert.deepEqual(result.players.slice(1).map((player) => player.hand.length), [1, 1, 1], 'every other player should draw one card')
  assert.equal(result.activePlayerIndex, 1, 'turn should continue to the next player after Victory Lap')
}

{
  const appSource = readFileSync('src/App.tsx', 'utf8')
  const playableBlock = appSource.match(/const playableGames:[\s\S]*?\n}/)?.[0] ?? ''
  const playableGames = [...playableBlock.matchAll(/:\s*'([^']+)'/g)].map((match) => match[1])
  const superMarioIndex = playableGames.indexOf('superMario')
  const sonicIndex = playableGames.indexOf('sonic')
  const skyjoIndex = playableGames.indexOf('skyjo')
  assert.ok(superMarioIndex >= 0 && sonicIndex > superMarioIndex && skyjoIndex > sonicIndex, 'UNO Sonic should sit between Super Mario and Skyjo')
  assert.match(appSource, /game === 'sonic' \? Math\.min\(currentConfig\.playerCount, 4\)/, 'UNO Sonic should be limited to 2-4 players in setup selection')
  assert.match(appSource, /playableGame && !isGuoExclusiveGame\(playableGame\) \? 'green-edition'/, 'UNO Sonic should inherit the shared green selection tile for non-Guo games')
}

console.log('UNO Sonic behavior tests passed')
