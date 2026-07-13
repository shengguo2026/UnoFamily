import assert from 'node:assert/strict'
import { createConfig, createGame, isPlayable, playCard, triplePlayLegalPileIndexes } from '../src/game/classic'
import { decideAiMove } from '../src/game/ai'
import { buildTriplePlayDeck } from '../src/game/deck'
import { recommendMove } from '../src/game/recommendation'
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

function triplePlayState(): GameState {
  return {
    ...createGame(createConfig('triplePlay' as GameVariant, 'hotseat', 4, 'medium', addOns)),
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
    triplePlayPiles: [
      { cards: [card('pile-0', 'number', 'red', '5', 5, 5)], activeColor: 'red', overload: 0, limit: 3, active: true },
      { cards: [card('pile-1', 'number', 'blue', '9', 9, 9)], activeColor: 'blue', overload: 2, limit: 3, active: true },
      { cards: [card('pile-2', 'number', 'green', '7', 7, 7)], activeColor: 'green', overload: 0, limit: 3, active: false },
    ],
  }
}

{
  const deck = buildTriplePlayDeck()

  assert.equal(deck.length, 116, 'UNO Triple Play should use the expanded 116-card simulator deck')
  assert.equal(deck.filter((entry) => entry.kind === 'triplePlayDiscardTwo').length, 4, 'Triple Play should include one Discard Two card in each color')
  assert.equal(deck.filter((entry) => entry.kind === 'wildClear').length, 4, 'Triple Play should include Wild Clear cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildGiveAway').length, 4, 'Triple Play should include Wild Give Away cards')
}

{
  const state = createGame(createConfig('triplePlay' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.triplePlayPiles?.length, 3, 'Triple Play starts with three discard piles')
  assert.equal(state.triplePlayPiles?.every((pile) => pile.cards.length === 1), true, 'each Triple Play pile starts with one face-up card')
  assert.equal(state.triplePlayPiles?.some((pile) => pile.active), true, 'at least one Triple Play pile should be lit')
}

{
  const state = triplePlayState()
  const blue = card('blue-card', 'number', 'blue', '2', 2, 2)
  const green = card('green-card', 'number', 'green', '8', 8, 8)

  state.players[0].hand = [blue, green]

  assert.equal(isPlayable(blue, state), true, 'a card matching a lit pile should be playable')
  assert.deepEqual(triplePlayLegalPileIndexes(state, blue), [1], 'legal pile indexes should include only matching lit piles')
  assert.equal(isPlayable(green, state), false, 'a card matching only an unlit pile should not be playable')
}

{
  const state = triplePlayState()
  state.players[0].hand = [card('blue-card', 'number', 'blue', '2', 2, 2)]

  const result = playCard(state, 'blue-card', { discardPileIndex: 1 }).state

  assert.equal(result.triplePlayPiles?.[1].cards.at(-1)?.id, 'blue-card', 'played card should land on the chosen Triple Play pile')
  assert.equal(result.players[0].hand.length, 3, 'overloading a pile should make the player draw its overload limit')
  assert.equal(result.triplePlayPiles?.[1].overload, 0, 'overloaded pile should reset after firing')
  assert.equal(result.activePlayerIndex, 1, 'turn should advance after resolving the Triple Play unit')
}

{
  const state = triplePlayState()
  state.triplePlayPiles![1].overload = 2
  state.players[0].hand = [card('clear', 'wildClear', 'wild', 'Wild Clear', 50)]

  const result = playCard(state, 'clear', { color: 'yellow', discardPileIndex: 1 }).state

  assert.equal(result.triplePlayPiles?.[1].overload, 0, 'Wild Clear should reset the chosen pile overload meter')
  assert.equal(result.activeColor, 'yellow', 'Wild Clear should still choose the next color')
}

{
  const state = triplePlayState()
  state.players[0].type = 'ai'
  state.players[0].hand = [
    card('clear', 'wildClear', 'wild', 'Wild Clear', 50),
    card('blue-card', 'number', 'blue', '2', 2, 2),
  ]
  state.pendingDraw = { amount: 4, cardValue: 4, sourcePlayerId: 'p4', sourceColor: 'green', canChallenge: true }

  assert.equal(isPlayable(state.players[0].hand[0], state), false, 'Wild Clear should not answer a pending draw penalty')
  assert.equal(isPlayable(state.players[0].hand[1], state), false, 'lit pile matches should wait until the draw penalty is resolved')
  assert.equal(recommendMove(state).action, 'acceptPenalty', 'the hint should recommend resolving the draw penalty, not playing a Triple Play card')
  assert.equal(decideAiMove(state).card, null, 'AI should not choose an unplayable Triple Play card while a draw penalty is pending')
}

console.log('UNO Triple Play behavior tests passed')
