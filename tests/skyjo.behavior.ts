import assert from 'node:assert/strict'
import { createConfig, createGame, drawOne, zeroDiscardDrawn, zeroDrawnCardCanBeDiscarded, zeroSwapDrawnIntoGrid, zeroTakeDiscard } from '../src/game/classic'
import { buildSkyjoDeck } from '../src/game/deck'
import type { AddOnPack, Card, GameState, GameVariant, UnoColor } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function card(id: string, value: number, color: UnoColor = 'red'): Card {
  return { id, kind: 'number', color, label: String(value), points: value, value }
}

function skyjoState(): GameState {
  return {
    ...createGame(createConfig('skyjo' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [card('draw-low', -2)],
    discardPile: [card('top', 8)],
    activePlayerIndex: 0,
    activeColor: 'red',
    zeroTurn: { drawnCard: null, source: null },
    winnerId: null,
    gameWinnerId: null,
  }
}

function setGrid(state: GameState, playerIndex: number, values: number[], faceUpIndexes: number[] = []): void {
  state.players[playerIndex].zeroGrid = values.map((value, index) => ({
    card: card(`p${playerIndex + 1}-${index}-${value}`, value),
    faceUp: faceUpIndexes.includes(index),
    knownByPlayerIds: [],
  }))
}

{
  const deck = buildSkyjoDeck()

  assert.equal(deck.length, 150, 'Skyjo should use a 150-card deck')
  assert.equal(deck.filter((entry) => entry.value === -2).length, 5, 'Skyjo should include five -2 cards')
  assert.equal(deck.filter((entry) => entry.value === 0).length, 15, 'Skyjo should include fifteen 0 cards')
  assert.equal(deck.filter((entry) => entry.value === 12).length, 10, 'Skyjo should include ten 12 cards')
}

{
  const state = createGame(createConfig('skyjo' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.config.game, 'skyjo')
  assert.equal(state.targetScore, 100, 'Skyjo sessions should end when someone reaches 100 points')
  assert.equal(state.players[0].hand.length, 0, 'Skyjo players should not receive UNO hands')
  assert.equal(state.players[0].zeroGrid?.length, 12, 'Skyjo should deal a 3x4 grid')
  assert.equal(state.players[0].zeroGrid?.filter((slot) => slot.card).length, 12, 'all Skyjo grid slots should contain cards')
  assert.equal(state.players[0].zeroGrid?.filter((slot) => slot.faceUp).length, 2, 'players should reveal two Skyjo cards at setup')
  assert.equal(state.discardPile.length, 1, 'Skyjo should start with one discard card')
}

{
  const state = skyjoState()
  setGrid(state, 0, [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1], [0, 1])
  const drawn = state.drawPile[state.drawPile.length - 1]
  const replaced = state.players[0].zeroGrid?.[2].card

  const afterDraw = drawOne(state)
  assert.equal(afterDraw.zeroTurn?.drawnCard?.id, drawn.id, 'drawing should stage a Skyjo card')
  assert.equal(zeroDrawnCardCanBeDiscarded(afterDraw), true, 'a freshly drawn Skyjo card may be discarded')

  const afterSwap = zeroSwapDrawnIntoGrid(afterDraw, 2)
  assert.equal(afterSwap.players[0].zeroGrid?.[2].card?.id, drawn.id, 'the drawn card should replace the chosen Skyjo slot')
  assert.equal(afterSwap.players[0].zeroGrid?.[2].faceUp, true, 'the swapped-in Skyjo card should be face up')
  assert.equal(afterSwap.discardPile[afterSwap.discardPile.length - 1]?.id, replaced?.id, 'the replaced Skyjo card should move to discard')
  assert.equal(afterSwap.activePlayerIndex, 1, 'play should pass after a Skyjo replacement')
}

{
  const state = skyjoState()
  setGrid(state, 0, [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1], [0, 1])

  const afterDiscard = zeroDiscardDrawn(drawOne(state))
  assert.equal(afterDiscard.zeroTurn?.source, 'reveal', 'discarding a drawn Skyjo card should enter reveal mode')
  assert.equal(afterDiscard.discardPile[afterDiscard.discardPile.length - 1]?.id, 'draw-low', 'the discarded draw should become the top discard')

  const afterReveal = zeroSwapDrawnIntoGrid(afterDiscard, 2)
  assert.equal(afterReveal.players[0].zeroGrid?.[2].faceUp, true, 'reveal mode should flip one chosen face-down Skyjo card')
  assert.equal(afterReveal.activePlayerIndex, 1, 'play should pass after the reveal')
}

{
  const state = skyjoState()
  setGrid(state, 0, [5, 9, 8, 7, 5, 4, 3, 2, 5, 1, 0, -1], [0, 4, 8])
  state.discardPile = [card('take-1', 1)]
  const afterTake = zeroTakeDiscard(state)
  const afterSwap = zeroSwapDrawnIntoGrid(afterTake, 1)

  assert.equal(afterSwap.players[0].zeroGrid?.[0].card, null, 'three matching face-up cards in a Skyjo column should clear')
  assert.equal(afterSwap.players[0].zeroGrid?.[4].card, null, 'the cleared Skyjo column should remove the middle card')
  assert.equal(afterSwap.players[0].zeroGrid?.[8].card, null, 'the cleared Skyjo column should remove the bottom card')
}

{
  const state = skyjoState()
  setGrid(state, 0, [5, 9, 8, 7, 5, 4, 3, 2, 5, 1, 0, -1], [0, 4, 8])
  state.discardPile = [card('take-1', 1)]
  const cleared = zeroSwapDrawnIntoGrid(zeroTakeDiscard(state), 1)
  const refillAttempt = {
    ...cleared,
    activePlayerIndex: 0,
    zeroTurn: { drawnCard: card('refill', -2), source: 'draw' as const },
  }
  const rejected = zeroSwapDrawnIntoGrid(refillAttempt, 0)

  assert.equal(cleared.players[0].zeroGrid?.[0].card, null, 'test setup should have an empty cleared Skyjo slot')
  assert.equal(rejected.players[0].zeroGrid?.[0].card, null, 'cleared Skyjo slots should stay removed and cannot be refilled')
  assert.equal(rejected.zeroTurn?.drawnCard?.id, 'refill', 'invalid refilling a cleared slot should keep the staged drawn card')
}

{
  const state = skyjoState()
  setGrid(state, 0, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  const afterDiscard = zeroDiscardDrawn(drawOne(state))
  const afterReveal = zeroSwapDrawnIntoGrid(afterDiscard, 11)

  assert.equal(afterReveal.caboCallerPlayerId, 'p1', 'revealing the last Skyjo card should mark the round closer')
  assert.equal(afterReveal.caboFinalTurnsRemaining, 3, 'each other Skyjo player should get one final turn')
  assert.equal(afterReveal.activePlayerIndex, 1, 'final turns should start with the next player')
}

console.log('Skyjo behavior tests passed')
