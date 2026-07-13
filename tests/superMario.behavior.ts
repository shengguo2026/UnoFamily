import assert from 'node:assert/strict'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildSuperMarioDeck } from '../src/game/deck'
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

function superMarioState(): GameState {
  return {
    ...createGame(createConfig('superMario' as GameVariant, 'hotseat', 4, 'medium', addOns)),
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
  const deck = buildSuperMarioDeck()

  assert.equal(deck.length, 112, 'UNO Super Mario should use a 112-card deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildSuperStar').length, 4, 'UNO Super Mario should include four Super Star cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Super Mario should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('superMario' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Super Mario should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildSuperStar'), true, 'created games should use the Super Mario deck')
}

{
  const state = superMarioState()
  state.players[0].hand = [card('draw2', 'draw2', 'red', '+2', 20)]
  state.players[1].hand = [card('star', 'wildSuperStar', 'wild', 'Super Star', 50)]

  const pending = playCard(state, 'draw2').state
  const reflected = playCard(pending, 'star', { color: 'yellow' }).state

  assert.equal(reflected.pendingDraw, null, 'Super Star should clear an incoming draw penalty')
  assert.equal(reflected.players[0].hand.length, 2, 'Super Star should reflect the penalty to the source player')
  assert.equal(reflected.players[1].hand.length, 0, 'the defending player should discard Super Star')
  assert.equal(reflected.activeColor, 'yellow')
  assert.equal(reflected.activePlayerIndex, 2, 'play should continue after the defended player')
}

{
  const state = superMarioState()
  state.players[0].hand = [card('star', 'wildSuperStar', 'wild', 'Super Star', 50)]

  const result = playCard(state, 'star', { color: 'blue' }).state

  assert.equal(result.activeColor, 'blue', 'Super Star should also work as a normal Wild on the player turn')
  assert.equal(result.activePlayerIndex, 1, 'normal Super Star play should advance to the next player')
}

console.log('UNO Super Mario behavior tests passed')
