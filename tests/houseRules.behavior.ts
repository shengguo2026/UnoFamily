import assert from 'node:assert/strict'
import { createConfig, createGame, playCard } from '../src/game/classic'
import type { Card, GameState, GameVariant, UnoColor } from '../src/game/types'

const addOns = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function card(id: string, kind: Card['kind'], color: UnoColor | 'wild', label: string, points: number, value?: number): Card {
  return { id, kind, color, label, points, value }
}

function houseRulesState(): GameState {
  return {
    ...createGame(createConfig('houseRules' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('d1', 'number', 'green', '1', 1, 1),
      card('d2', 'number', 'blue', '2', 2, 2),
      card('d3', 'number', 'yellow', '3', 3, 3),
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
  const state = houseRulesState()
  state.players[0].hand = [card('p1-draw2', 'draw2', 'red', '+2', 20)]
  state.players[1].hand = [card('p2-draw2', 'draw2', 'blue', '+2', 20)]

  const first = playCard(state, 'p1-draw2').state
  const second = playCard(first, 'p2-draw2').state

  assert.equal(second.pendingDraw?.amount, 4, 'House Rules should let +2 stack onto a pending +2')
  assert.equal(second.activePlayerIndex, 2, 'stacked draw penalty should pass to the next player')
}

{
  const state = houseRulesState()
  state.players[0].hand = [
    card('seven', 'number', 'red', '7', 7, 7),
    card('keeper', 'number', 'green', '4', 4, 4),
  ]
  state.players[1].hand = [card('target-card', 'number', 'yellow', '9', 9, 9)]

  const next = playCard(state, 'seven', { targetPlayerId: 'p2' }).state

  assert.deepEqual(next.players[0].hand.map((entry) => entry.id), ['target-card'], 'playing a 7 should swap hands with the chosen player')
  assert.deepEqual(next.players[1].hand.map((entry) => entry.id), ['keeper'], 'the chosen player should receive the source hand')
}

{
  const state = houseRulesState()
  state.players[0].hand = [
    card('zero', 'number', 'red', '0', 0, 0),
    card('p1-keep', 'number', 'green', '4', 4, 4),
  ]
  state.players[1].hand = [card('p2-card', 'number', 'yellow', '9', 9, 9)]
  state.players[2].hand = [card('p3-card', 'number', 'blue', '2', 2, 2)]
  state.players[3].hand = [card('p4-card', 'number', 'green', '6', 6, 6)]

  const next = playCard(state, 'zero').state

  assert.deepEqual(next.players[0].hand.map((entry) => entry.id), ['p4-card'], '0 should pass hands in the current direction')
  assert.deepEqual(next.players[1].hand.map((entry) => entry.id), ['p1-keep'], '0 should pass the source hand after the zero is discarded')
  assert.deepEqual(next.players[2].hand.map((entry) => entry.id), ['p2-card'], '0 should rotate each hand once')
  assert.deepEqual(next.players[3].hand.map((entry) => entry.id), ['p3-card'], '0 should rotate each hand once')
}

console.log('House Rules behavior tests passed')
