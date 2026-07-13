import assert from 'node:assert/strict'
import { createConfig, createGame, playCard } from '../src/game/classic.ts'
import { buildBlastDeck } from '../src/game/deck.ts'
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

function blastState(): GameState {
  return {
    ...createGame(createConfig('blast' as GameVariant, 'hotseat', 4, 'medium', addOns)),
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
    blastChamber: 0,
    blastEvent: null,
  }
}

{
  const deck = buildBlastDeck()

  assert.equal(deck.length, 112, 'UNO Blast should use a 112-card simulator deck')
  assert.equal(deck.filter((entry) => entry.kind === 'blast').length, 4, 'UNO Blast should include four Blast cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Blast keeps four Wild +4 cards')
}

{
  const state = createGame(createConfig('blast' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.config.game, 'blast')
  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Blast deals seven cards to each player')
  assert.equal(state.blastChamber, 0, 'UNO Blast starts with an empty Blast unit')
}

{
  const state = blastState()
  state.players[0].hand = [card('red-7', 'number', 'red', '7', 7, 7), card('green-9', 'number', 'green', '9', 9, 9)]

  const result = playCard(state, 'red-7', { blastRoll: 0.99 }).state

  assert.equal(result.blastChamber, 1, 'a safe play loads one pressure card into the Blast unit')
  assert.equal(result.blastEvent?.previousPressure, 0, 'the event exposes the previous pressure before the played card loads')
  assert.equal(result.blastEvent?.playedCardPressure, 1, 'the event exposes the played card pressure contribution')
  assert.equal(result.blastEvent?.pressureAfter, 1, 'the event exposes the pressure after a quiet load')
  assert.equal(result.blastEvent?.fired, false, 'the event records that the unit stayed quiet')
  assert.equal(result.activePlayerIndex, 1, 'turn advances normally when the Blast unit does not fire')
  assert.equal(result.players[0].hand.length, 1, 'the played card leaves the hand when the unit stays quiet')
}

{
  const state = blastState()
  state.players[0].hand = [card('red-7', 'number', 'red', '7', 7, 7)]
  state.blastChamber = 3

  const result = playCard(state, 'red-7', { blastRoll: 0 }).state

  assert.equal(result.blastChamber, 0, 'a firing Blast unit empties its chamber')
  assert.equal(result.blastEvent?.fired, true, 'the event records the exact firing result')
  assert.equal(result.blastEvent?.previousPressure, 3, 'the event exposes the pressure before the final played card')
  assert.equal(result.blastEvent?.playedCardPressure, 1, 'the fired formula always adds one for the played card')
  assert.equal(result.blastEvent?.pressureAfter, 0, 'the event exposes the reset pressure after firing')
  assert.equal(result.blastEvent?.cardsDrawn, 4, 'the current player draws one card for each loaded pressure card')
  assert.equal(result.players[0].hand.length, 4, 'a final-card blast makes the player take cards instead of winning')
  assert.equal(result.winnerId, null, 'the round does not end when the final card triggers the Blast unit')
}

{
  const state = blastState()
  state.players[0].hand = [card('blast', 'blast', 'wild', 'Blast', 50)]
  state.blastChamber = 1

  const result = playCard(state, 'blast', { color: 'blue', blastRoll: 0.99 }).state

  assert.equal(result.activeColor, 'blue', 'Blast acts as a wild card and keeps the chosen color')
  assert.equal(result.blastEvent?.fired, true, 'Blast cards force the unit to fire even when the random roll is safe')
  assert.equal(result.blastEvent?.forced, true, 'the event records that a Blast card forced the fire')
  assert.equal(result.blastEvent?.previousPressure, 1, 'forced fire still reports the previous chamber pressure')
  assert.equal(result.blastEvent?.cardsDrawn, 2, 'the forced fire includes the Blast card pressure')
}

console.log('UNO Blast behavior tests passed')
