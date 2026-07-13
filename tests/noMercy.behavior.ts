import assert from 'node:assert/strict'
import { createConfig, createGame, drawOne, endTurn, playCard, resolvePendingDraw } from '../src/game/classic'
import { buildNoMercyDeck } from '../src/game/deck'
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

function noMercyState(): GameState {
  return {
    ...createGame(createConfig('noMercy' as GameVariant, 'hotseat', 4, 'medium', addOns, 7, 1000)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [],
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
  const deck = buildNoMercyDeck()

  assert.equal(deck.length, 168, "UNO Show 'em No Mercy should use the large 168-card deck")
  assert.equal(deck.filter((entry) => entry.kind === 'draw4').length, 8, 'No Mercy deck should include colored +4 cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw6').length, 8, 'No Mercy deck should include Wild +6 cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw10').length, 4, 'No Mercy deck should include Wild +10 cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildColorRoulette').length, 4, 'No Mercy deck should include Wild Color Roulette cards')
}

{
  const state = noMercyState()
  state.players[0].hand = [card('p1-draw2', 'draw2', 'red', '+2', 20)]
  state.players[1].hand = [card('p2-draw4', 'draw4', 'blue', '+4', 20)]

  const pending = playCard(state, 'p1-draw2').state
  const stacked = playCard(pending, 'p2-draw4').state

  assert.equal(stacked.pendingDraw?.amount, 6, 'No Mercy should stack draw penalties cumulatively')
  assert.equal(stacked.activePlayerIndex, 2, 'stacked penalty should pass to the next player')
}

{
  const state = noMercyState()
  state.players[0].hand = [card('p1-draw4', 'draw4', 'red', '+4', 20)]
  state.players[1].hand = [card('p2-draw2', 'draw2', 'blue', '+2', 20)]

  const pending = playCard(state, 'p1-draw4').state
  const rejected = playCard(pending, 'p2-draw2')

  assert.equal(rejected.sound, 'error', 'No Mercy should reject a lower draw card against a higher pending penalty')
  assert.equal(rejected.state.pendingDraw?.amount, 4)
}

{
  const state = noMercyState()
  state.players[0].hand = [card('p1-blue9', 'number', 'blue', '9', 9, 9)]
  state.drawPile = [
    card('draw-bottom', 'number', 'yellow', '1', 1, 1),
    card('playable', 'number', 'red', '6', 6, 6),
    card('unplayable', 'number', 'blue', '2', 2, 2),
  ]

  const drawn = drawOne(state)

  assert.deepEqual(drawn.players[0].hand.map((entry) => entry.id), ['p1-blue9', 'unplayable', 'playable'], 'No Mercy should draw until the first playable card appears')
  assert.equal(drawn.drawnCardIdThisTurn, 'playable', 'the playable drawn card should be the only card that can be played before passing')
  assert.equal(drawn.activePlayerIndex, 0)
}

{
  const state = noMercyState()
  state.players[0].hand = [card('zero', 'number', 'red', '0', 0, 0)]
  state.players[1].hand = [card('p2', 'number', 'blue', '1', 1, 1)]
  state.players[2].hand = [card('p3', 'number', 'green', '2', 2, 2)]
  state.players[3].hand = [card('p4', 'number', 'yellow', '3', 3, 3)]

  const passed = playCard(state, 'zero').state

  assert.deepEqual(passed.players.map((player) => player.hand[0]?.id), ['p4', undefined, 'p2', 'p3'], '0 should pass remaining hands in the current direction')
}

{
  const state = noMercyState()
  state.players[0].hand = [card('seven', 'number', 'red', '7', 7, 7), card('p1-extra', 'number', 'blue', '1', 1, 1)]
  state.players[2].hand = [card('p3-card', 'number', 'green', '3', 3, 3)]

  const result = playCard(state, 'seven', { targetPlayerId: 'p3' })

  assert.equal(result.needsChoice, undefined)
  assert.deepEqual(result.state.players[0].hand.map((entry) => entry.id), ['p3-card'], '7 should swap the active hand with a chosen player')
  assert.deepEqual(result.state.players[2].hand.map((entry) => entry.id), ['p1-extra'], 'the chosen player should receive the remaining active hand')
}

{
  const state = noMercyState()
  state.players[0].hand = [card('roulette', 'wildColorRoulette', 'wild', 'Color Roulette', 50)]
  state.players[1].hand = [card('p2-old', 'number', 'red', '3', 3, 3)]
  state.drawPile = [
    card('bottom', 'number', 'yellow', '9', 9, 9),
    card('green-stop', 'number', 'green', '6', 6, 6),
    card('blue-miss', 'number', 'blue', '8', 8, 8),
  ]

  const result = playCard(state, 'roulette', { color: 'green' }).state

  assert.deepEqual(result.players[1].hand.map((entry) => entry.id), ['p2-old', 'blue-miss', 'green-stop'], 'Color Roulette should draw until the chosen color appears')
  assert.equal(result.activePlayerIndex, 2, 'the roulette target should lose the turn')
}

{
  const state = noMercyState()
  state.players[0].hand = [card('draw10', 'wildDraw10', 'wild', '+10', 50)]
  state.players[1].hand = Array.from({ length: 24 }, (_, index) => card(`p2-${index}`, 'number', 'blue', String(index % 10), index % 10, index % 10))
  state.drawPile = Array.from({ length: 10 }, (_, index) => card(`draw-${index}`, 'number', 'green', String(index % 10), index % 10, index % 10))

  const pending = playCard(state, 'draw10', { color: 'red' }).state
  const resolved = resolvePendingDraw(pending, false)

  assert.equal(resolved.players.some((player) => player.id === 'p2'), false, 'a player with 25 or more cards should be eliminated')
  assert.equal(resolved.winnerId, null, 'with more than one player remaining, the round should continue')
  assert.equal(resolved.activePlayerIndex, 1, 'after elimination, play should continue at the next surviving player')
}

{
  const state = noMercyState()
  state.players = state.players.slice(0, 2)
  state.players[0].hand = [card('draw10', 'wildDraw10', 'wild', '+10', 50)]
  state.players[1].hand = Array.from({ length: 24 }, (_, index) => card(`p2-${index}`, 'number', 'blue', String(index % 10), index % 10, index % 10))
  state.drawPile = Array.from({ length: 10 }, (_, index) => card(`draw-${index}`, 'number', 'green', String(index % 10), index % 10, index % 10))

  const pending = playCard(state, 'draw10', { color: 'red' }).state
  const resolved = resolvePendingDraw(pending, false)

  assert.equal(resolved.winnerId, 'p1', 'if all other players are eliminated, the source player should win the round')
}

{
  const state = noMercyState()
  state.players[0].hand = [card('blue9', 'number', 'blue', '9', 9, 9)]
  state.drawPile = [card('red6', 'number', 'red', '6', 6, 6)]

  const drawn = drawOne(state)
  const ended = endTurn(drawn)

  assert.equal(ended.activePlayerIndex, 1, 'the active player may pass after drawing a playable No Mercy card')
}

console.log("UNO Show 'em No Mercy behavior tests passed")
