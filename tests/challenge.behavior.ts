import assert from 'node:assert/strict'
import { createConfig, createGame, playCard, resolvePendingDare } from '../src/game/classic'
import type { AddOnPack, Card, GameState, UnoColor } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function card(id: string, kind: Card['kind'], color: UnoColor | 'wild', label: string, points: number, value?: number): Card {
  return { id, kind, color, label, points, value }
}

function challengeState(): GameState {
  return {
    ...createGame(createConfig('challenge', 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [card('p2-keep', 'number', 'yellow', '6', 6, 6)], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [card('p3-keep', 'number', 'blue', '7', 7, 7)], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [card('p4-keep', 'number', 'green', '8', 8, 8)], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('d1', 'number', 'green', '1', 1, 1),
      card('d2', 'number', 'blue', '2', 2, 2),
      card('d3', 'number', 'yellow', '3', 3, 3),
      card('d4', 'number', 'red', '4', 4, 4),
    ],
    discardPile: [card('top', 'number', 'red', '5', 5, 5)],
    activePlayerIndex: 0,
    activeColor: 'red',
    direction: 1,
    pendingDraw: null,
    pendingDare: null,
    drewThisTurn: false,
    drawnCardIdThisTurn: null,
    winnerId: null,
    gameWinnerId: null,
  }
}

{
  const state = challengeState()
  state.players[0].hand = [card('dare', 'dare', 'red', 'Dare', 20), card('keep', 'number', 'green', '8', 8, 8)]

  const next = playCard(state, 'dare').state

  assert.equal(next.pendingDare?.sourcePlayerId, 'p1', 'Dare should create a pending dare from the source player')
  assert.equal(next.activePlayerIndex, 1, 'Dare should target the next player')
}

{
  const state = challengeState()
  state.players[0].hand = [card('dare', 'dare', 'red', 'Dare', 20), card('keep', 'number', 'green', '8', 8, 8)]
  const pending = playCard(state, 'dare').state

  const resolved = resolvePendingDare(pending, 'draw')

  assert.equal(resolved.players[1].hand.length, 3, 'accepting a Dare should draw 2')
  assert.equal(resolved.pendingDare, null, 'accepting a Dare should clear the pending dare')
  assert.equal(resolved.activePlayerIndex, 2, 'accepting a Dare should lose the turn')
}

{
  const state = challengeState()
  state.players[0].hand = [card('wild-dare', 'wildDare', 'wild', 'Wild Dare', 50), card('keep', 'number', 'green', '8', 8, 8)]

  const next = playCard(state, 'wild-dare', { color: 'blue' }).state

  assert.equal(next.activeColor, 'blue', 'Wild Dare should choose the active color')
  assert.equal(next.pendingDare?.sourcePlayerId, 'p1', 'Wild Dare should create a pending dare')
}

{
  const state = challengeState()
  state.players[0].hand = [card('wild-dare', 'wildDare', 'wild', 'Wild Dare', 50)]
  const pending = playCard(state, 'wild-dare', { color: 'blue' }).state

  const resolved = resolvePendingDare(pending, 'dare', 6)

  assert.equal(resolved.winnerId, 'p2', 'rolling a winner side should immediately make the roller win the round')
  assert.equal(resolved.pendingDare, null, 'rolling the dare die should clear the pending dare')
}

{
  const state = challengeState()
  state.players[0].hand = [
    card('wild-dare', 'wildDare', 'wild', 'Wild Dare', 50),
    card('p1-a', 'number', 'red', '1', 1, 1),
    card('p1-b', 'number', 'yellow', '2', 2, 2),
    card('p1-c', 'number', 'green', '3', 3, 3),
    card('p1-d', 'number', 'blue', '4', 4, 4),
    card('p1-e', 'number', 'red', '5', 5, 5),
  ]
  state.players[1].hand = [card('p2-a', 'number', 'red', '1', 1, 1), card('p2-b', 'number', 'yellow', '2', 2, 2), card('p2-c', 'number', 'green', '3', 3, 3), card('p2-d', 'number', 'blue', '4', 4, 4)]
  state.players[2].hand = [card('p3-a', 'number', 'red', '1', 1, 1), card('p3-b', 'number', 'yellow', '2', 2, 2), card('p3-c', 'number', 'green', '3', 3, 3), card('p3-d', 'number', 'blue', '4', 4, 4), card('p3-e', 'number', 'red', '5', 5, 5)]
  state.players[3].hand = [card('p4-a', 'number', 'red', '1', 1, 1), card('p4-b', 'number', 'yellow', '2', 2, 2), card('p4-c', 'number', 'green', '3', 3, 3), card('p4-d', 'number', 'blue', '4', 4, 4), card('p4-e', 'number', 'red', '5', 5, 5)]
  const pending = playCard(state, 'wild-dare', { color: 'blue' }).state

  const resolved = resolvePendingDare(pending, 'dare', 2)

  assert.equal(resolved.winnerId, null, 'rolling all-other-drop-four should not end the round when every other player has more than 4 cards')
  assert.equal(resolved.players[0].hand.length, 1, 'the source player should drop 4 from the all-other result')
  assert.equal(resolved.players[2].hand.length, 1, 'other players should drop 4 from the all-other result')
  assert.equal(resolved.players[3].hand.length, 1, 'all other players should be included in game direction')
  assert.equal(resolved.activePlayerIndex, 1, 'the roller should continue the turn when no other player wins')
  assert.equal(resolved.discardPile.at(-1)?.id, 'wild-dare', 'dropping cards should not change the active top discard')
}

{
  const state = challengeState()
  state.players[0].hand = [
    card('wild-dare', 'wildDare', 'wild', 'Wild Dare', 50),
    card('p1-a', 'number', 'red', '1', 1, 1),
    card('p1-b', 'number', 'yellow', '2', 2, 2),
    card('p1-c', 'number', 'green', '3', 3, 3),
    card('p1-d', 'number', 'blue', '4', 4, 4),
    card('p1-e', 'number', 'red', '5', 5, 5),
  ]
  state.players[2].hand = [card('p3-a', 'number', 'red', '1', 1, 1), card('p3-b', 'number', 'yellow', '2', 2, 2), card('p3-c', 'number', 'green', '3', 3, 3), card('p3-d', 'number', 'blue', '4', 4, 4), card('p3-e', 'number', 'red', '5', 5, 5)]
  state.players[3].hand = [card('p4-a', 'number', 'red', '1', 1, 1), card('p4-b', 'number', 'yellow', '2', 2, 2), card('p4-c', 'number', 'green', '3', 3, 3), card('p4-d', 'number', 'blue', '4', 4, 4)]
  const pending = playCard(state, 'wild-dare', { color: 'blue' }).state

  const resolved = resolvePendingDare(pending, 'dare', 2)

  assert.equal(resolved.winnerId, 'p4', 'side 2 should make the first other player with 4 or fewer cards win in game direction')
  assert.equal(resolved.players[2].hand.length, 1, 'players before the side-2 winner should still drop 4 cards')
  assert.equal(resolved.players[3].hand.length, 0, 'the side-2 winner should drop all remaining cards')
  assert.equal(resolved.players[0].hand.length, 5, 'players after the side-2 winner should not drop cards')
}

{
  const state = challengeState()
  state.players[0].hand = [card('wild-dare', 'wildDare', 'wild', 'Wild Dare', 50), card('keep', 'number', 'green', '8', 8, 8)]
  const pending = playCard(state, 'wild-dare', { color: 'blue' }).state

  const resolved = resolvePendingDare(pending, 'dare', 3)

  assert.equal(resolved.winnerId, 'p3', 'rolling next-player-drop-all should make the next player win')
  assert.equal(resolved.players[2].hand.length, 0, 'next player should drop all cards')
}

{
  const state = challengeState()
  state.players[0].hand = [card('wild-dare', 'wildDare', 'wild', 'Wild Dare', 50), card('keep', 'number', 'green', '8', 8, 8)]
  state.players[2].hand = [card('p3-normal', 'number', 'blue', '7', 7, 7)]
  state.players[3].hand = [card('p4-a', 'number', 'green', '8', 8, 8), card('p4-b', 'number', 'yellow', '9', 9, 9)]
  const pending = playCard(state, 'wild-dare', { color: 'blue' }).state
  const armed = resolvePendingDare(pending, 'dare', 4)

  const resolved = playCard(armed, 'p3-normal').state

  assert.equal(resolved.winnerId, 'p4', 'rolling over-next-drop-all should let the over-next player win after one normal turn')
  assert.equal(resolved.players[3].hand.length, 0, 'over-next player should drop all cards when their turn arrives')
}

{
  const state = challengeState()
  state.players[0].hand = [card('wild-dare', 'wildDare', 'wild', 'Wild Dare', 50), card('keep', 'number', 'green', '8', 8, 8)]
  state.players[2].hand = [card('p3-skip', 'skip', 'blue', 'Skip', 20), card('p3-keep', 'number', 'red', '1', 1, 1)]
  const pending = playCard(state, 'wild-dare', { color: 'blue' }).state
  const armed = resolvePendingDare(pending, 'dare', 4)

  const resolved = playCard(armed, 'p3-skip').state

  assert.equal(resolved.winnerId, null, 'over-next-drop-all chance should be cancelled when the next player skips the target')
  assert.equal(resolved.players[3].hand.length, 1, 'cancelled over-next target should keep their hand')
}

{
  const state = challengeState()
  state.players[0].hand = [card('wild-dare', 'wildDare', 'wild', 'Wild Dare', 50), card('keep', 'number', 'green', '8', 8, 8)]
  state.players[1].hand = [card('p2-a', 'number', 'red', '1', 1, 1), card('p2-b', 'number', 'yellow', '2', 2, 2), card('p2-c', 'number', 'green', '3', 3, 3), card('p2-d', 'number', 'blue', '4', 4, 4), card('p2-e', 'number', 'red', '5', 5, 5)]
  state.drawPile = [
    card('action', 'skip', 'red', 'Skip', 20),
    card('draw-2', 'number', 'green', '2', 2, 2),
    card('draw-1', 'number', 'blue', '1', 1, 1),
  ]
  const pending = playCard(state, 'wild-dare', { color: 'blue' }).state

  const resolved = resolvePendingDare(pending, 'dare', 5)

  assert.equal(resolved.players[1].hand.length, 8, 'get-action-card should draw until the roller gets an action card')
  assert.equal(resolved.players[1].hand.at(-1)?.kind, 'skip', 'the final drawn card should be the action card')
  assert.equal(resolved.activePlayerIndex, 2, 'turn should continue after drawing to an action card')
}

console.log('Challenge behavior tests passed')
