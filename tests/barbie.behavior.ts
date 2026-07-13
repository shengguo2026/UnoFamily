import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildBarbieDeck } from '../src/game/deck'
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

function barbieState(): GameState {
  return {
    ...createGame(createConfig('barbie' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('draw-1', 'number', 'green', '1', 1, 1),
      card('draw-2', 'number', 'blue', '2', 2, 2),
      card('draw-3', 'number', 'red', '3', 3, 3),
      card('draw-4', 'number', 'green', '4', 4, 4),
      card('draw-5', 'number', 'blue', '5', 5, 5),
      card('draw-6', 'number', 'red', '6', 6, 6),
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
  const deck = buildBarbieDeck()

  assert.equal(deck.length, 112, 'UNO Barbie should use a 112-card playable deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildPlayedTooMuch').length, 4, 'UNO Barbie should include four Played With Too Much cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Barbie should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('barbie' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Barbie should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildPlayedTooMuch'), true, 'created games should use the Barbie deck')
}

{
  const state = barbieState()
  state.players[0].hand = [
    card('barbie', 'wildPlayedTooMuch', 'wild', 'Played With Too Much', 50),
    card('p1-yellow', 'number', 'yellow', '7', 7, 7),
    card('p1-red', 'number', 'red', '9', 9, 9),
  ]
  state.players[1].hand = [
    card('p2-yellow-a', 'number', 'yellow', '1', 1, 1),
    card('p2-yellow-b', 'number', 'yellow', '2', 2, 2),
    card('p2-blue', 'number', 'blue', '5', 5, 5),
  ]
  state.players[2].hand = [card('p3-green', 'number', 'green', '4', 4, 4)]
  state.players[3].hand = [card('p4-yellow', 'reverse', 'yellow', 'Reverse', 20)]

  const missingChoice = playCard(state, 'barbie', { color: 'blue' })
  assert.equal(missingChoice.needsChoice?.type, 'barbieColors', 'Played With Too Much should ask for active and discard colors')

  const result = playCard(state, 'barbie', { color: 'blue', barbieDiscardColor: 'yellow' }).state

  assert.equal(result.activeColor, 'blue', 'Played With Too Much should choose the next active color')
  assert.deepEqual(result.players.map((player) => player.hand.some((entry) => entry.color === 'yellow')), [false, false, false, false], 'chosen-color cards should be discarded before redraw')
  assert.deepEqual(result.players.map((player) => player.hand.length), [2, 3, 1, 1], 'each player should redraw exactly as many chosen-color cards as they discarded')
  assert.equal(result.activePlayerIndex, 1, 'turn should continue to the next player after Played With Too Much')
}

{
  const appSource = readFileSync('src/App.tsx', 'utf8')
  const playableBlock = appSource.match(/const playableGames:[\s\S]*?\n}/)?.[0] ?? ''
  const playableGames = [...playableBlock.matchAll(/:\s*'([^']+)'/g)].map((match) => match[1])
  const sonicIndex = playableGames.indexOf('sonic')
  const barbieIndex = playableGames.indexOf('barbie')
  const skyjoIndex = playableGames.indexOf('skyjo')
  assert.ok(sonicIndex >= 0 && barbieIndex > sonicIndex && skyjoIndex > barbieIndex, 'UNO Barbie should sit between Sonic and Skyjo')
  assert.match(appSource, /game === 'barbie' \? Math\.min\(currentConfig\.playerCount, 4\)/, 'UNO Barbie should be limited to 2-4 players in setup selection')
  assert.match(appSource, /playableGame && !isGuoExclusiveGame\(playableGame\) \? 'green-edition'/, 'UNO Barbie should inherit the shared green selection tile for non-Guo games')
  assert.match(appSource, /request\.type === 'barbieColors'[\s\S]*onPartialAnswer\(\{ color \}\)[\s\S]*onPartialAnswer\(\{ barbieDiscardColor: color \}\)[\s\S]*disabled=\{!pending\.partial\.color \|\| !pending\.partial\.barbieDiscardColor\}/, 'UNO Barbie mobile choice should collect both colors locally before submitting')
}

console.log('UNO Barbie behavior tests passed')
