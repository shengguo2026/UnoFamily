import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildTmntDeck } from '../src/game/deck'
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

function tmntState(direction: 1 | -1 = 1): GameState {
  return {
    ...createGame(createConfig('tmnt' as GameVariant, 'hotseat', 4, 'medium', addOns)),
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
    direction,
    pendingDraw: null,
    drewThisTurn: false,
    drawnCardIdThisTurn: null,
    winnerId: null,
    gameWinnerId: null,
  }
}

{
  const deck = buildTmntDeck()

  assert.equal(deck.length, 112, 'UNO TMNT should use a 112-card playable deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildTurtlePower').length, 4, 'UNO TMNT should include four Turtle Power cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO TMNT should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('tmnt' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO TMNT should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildTurtlePower'), true, 'created games should use the TMNT deck')
}

{
  const state = tmntState(1)
  state.players[0].hand = [
    card('turtle', 'wildTurtlePower', 'wild', 'Turtle Power', 50),
    card('p1-pass', 'number', 'yellow', '1', 1, 1),
    card('p1-keep', 'wild', 'wild', 'Wild', 50),
  ]
  state.players[1].hand = [card('p2-pass', 'number', 'blue', '2', 2, 2), card('p2-keep', 'wildDraw4', 'wild', '+4', 50)]
  state.players[2].hand = [card('p3-pass', 'number', 'green', '3', 3, 3), card('p3-keep', 'draw2', 'red', '+2', 20)]
  state.players[3].hand = [card('p4-pass', 'number', 'red', '4', 4, 4), card('p4-keep', 'skip', 'blue', 'Skip', 20)]

  const result = playCard(state, 'turtle', { color: 'green' }).state

  assert.equal(result.activeColor, 'green', 'Turtle Power should choose the next active color')
  assert.equal(result.activePlayerIndex, 1, 'turn should continue to the next player after Turtle Power')
  assert.deepEqual(result.players.map((player) => player.hand.map((entry) => entry.id).sort()), [
    ['p1-keep', 'p4-pass'],
    ['p1-pass', 'p2-keep'],
    ['p2-pass', 'p3-keep'],
    ['p3-pass', 'p4-keep'],
  ], 'Turtle Power should pass the selected low-value card one seat in game direction')
  assert.equal(result.turtlePowerEvent?.direction, 1, 'Turtle Power should publish the animation direction')
  assert.deepEqual(
    result.turtlePowerEvent?.passedCards.map((entry) => `${entry.sourcePlayerName}->${entry.targetPlayerName}:${entry.cardLabel}`),
    ['Player 1->Player 2:Yellow 1', 'Player 2->Player 3:Blue 2', 'Player 3->Player 4:Green 3', 'Player 4->Player 1:Red 4'],
    'Turtle Power animation should include every passed card',
  )
  const logText = result.log.map((entry) => entry.text).join('\n')
  assert.match(logText, /Player 1 passed Yellow 1 to Player 2/, 'Turtle Power should log Player 1 pass detail')
  assert.match(logText, /Player 2 passed Blue 2 to Player 3/, 'Turtle Power should log Player 2 pass detail')
  assert.match(logText, /Player 3 passed Green 3 to Player 4/, 'Turtle Power should log Player 3 pass detail')
  assert.match(logText, /Player 4 passed Red 4 to Player 1/, 'Turtle Power should log Player 4 pass detail')
}

{
  const state = tmntState(-1)
  state.players[0].hand = [card('turtle', 'wildTurtlePower', 'wild', 'Turtle Power', 50), card('p1-pass', 'number', 'yellow', '1', 1, 1)]
  state.players[1].hand = [card('p2-pass', 'number', 'blue', '2', 2, 2)]
  state.players[2].hand = [card('p3-pass', 'number', 'green', '3', 3, 3)]
  state.players[3].hand = [card('p4-pass', 'number', 'red', '4', 4, 4)]

  const result = playCard(state, 'turtle', { color: 'blue' }).state

  assert.deepEqual(result.players.map((player) => player.hand.map((entry) => entry.id).sort()), [
    ['p2-pass'],
    ['p3-pass'],
    ['p4-pass'],
    ['p1-pass'],
  ], 'Turtle Power should respect reversed direction')
  assert.equal(result.activePlayerIndex, 3, 'turn should continue in reversed direction')
}

{
  const appSource = readFileSync('src/App.tsx', 'utf8')
  const motuIndex = appSource.indexOf("30: 'motu'")
  const tmntIndex = appSource.indexOf("31: 'tmnt'")
  const spiderManIndex = appSource.indexOf("32: 'spiderman'")
  assert.ok(motuIndex >= 0 && tmntIndex > motuIndex && spiderManIndex > tmntIndex, 'UNO TMNT should sit between MOTU and Spider-Man')
  assert.match(appSource, /game === 'tmnt' \? Math\.min\(currentConfig\.playerCount, 4\)/, 'UNO TMNT should be limited to 2-4 players in setup selection')
  assert.match(appSource, /playableGame && !isGuoExclusiveGame\(playableGame\) \? 'green-edition'/, 'UNO TMNT should inherit the shared green selection tile for non-Guo games')
}

console.log('UNO TMNT behavior tests passed')
