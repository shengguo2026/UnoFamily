import assert from 'node:assert/strict'
import { createConfig, createGame, playCard } from '../src/game/classic.ts'
import { buildRobotoDeck } from '../src/game/deck.ts'
import type { AddOnPack, Card, GameState, GameVariant, UnoColor } from '../src/game/types.ts'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function card(id: string, kind: Card['kind'], color: UnoColor | 'wild', label: string, points: number, value?: number): Card {
  return { id, kind, color, label, points, value }
}

function robotoState(): GameState {
  return {
    ...createGame(createConfig('roboto' as GameVariant, 'hotseat', 4, 'medium', addOns)),
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
      card('draw-5', 'number', 'green', '5', 5, 5),
      card('draw-6', 'number', 'blue', '6', 6, 6),
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
    robotoEvent: null,
  }
}

{
  const deck = buildRobotoDeck()

  assert.equal(deck.length, 112, 'UNO Roboto should use a 112-card simulator deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildRoboto').length, 4, 'UNO Roboto should include four Wild Roboto cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Roboto keeps four Wild +4 cards')
}

{
  const state = createGame(createConfig('roboto' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.config.game, 'roboto')
  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Roboto deals seven cards to each player')
  assert.equal(state.robotoEvent, null, 'UNO Roboto starts without a robot command')
}

{
  const state = robotoState()
  state.players[0].hand = [card('red-7', 'number', 'red', '7', 7, 7), card('green-9', 'number', 'green', '9', 9, 9)]

  const result = playCard(state, 'red-7', { robotoRoll: 0.99 }).state

  assert.equal(result.robotoEvent, null, 'a safe robot roll leaves the robot quiet')
  assert.equal(result.activePlayerIndex, 1, 'turn advances normally when Roboto stays quiet')
  assert.equal(result.players[0].hand.length, 1, 'the played card leaves the hand')
}

{
  const state = robotoState()
  state.players[0].hand = [card('robot', 'wildRoboto', 'wild', 'Wild Roboto', 50)]

  const result = playCard(state, 'robot', { color: 'blue', robotoCommand: 'nextDraw2' }).state

  assert.equal(result.activeColor, 'blue', 'Wild Roboto chooses the active color')
  assert.equal(result.robotoEvent?.command, 'nextDraw2', 'Wild Roboto records the forced robot command')
  assert.equal(result.robotoEvent?.forced, true, 'Wild Roboto forces the robot to speak')
  assert.equal(result.players[1].hand.length, 2, 'the next player draws two cards from the robot command')
  assert.equal(result.activePlayerIndex, 2, 'the penalized player loses the turn')
}

{
  const state = robotoState()
  state.players[0].hand = [card('robot', 'wildRoboto', 'wild', 'Wild Roboto', 50)]

  const result = playCard(state, 'robot', { color: 'green', robotoCommand: 'sourceDraw2' }).state

  assert.equal(result.robotoEvent?.command, 'sourceDraw2', 'the event exposes the exact robot command')
  assert.equal(result.players[0].hand.length, 2, 'a final-card robot penalty can put cards back into the source hand')
  assert.equal(result.winnerId, null, 'the round does not end when Roboto makes the source draw cards')
}

console.log('UNO Roboto behavior tests passed')
