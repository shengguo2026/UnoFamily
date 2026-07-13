import assert from 'node:assert/strict'
import { createConfig, createGame, playCard, skipBoDiscardToPile, skipBoDrawToFive } from '../src/game/classic'
import { buildSkipBoDeck } from '../src/game/deck'
import { recommendMove } from '../src/game/recommendation'
import { playableReason } from '../src/i18n'
import type { AddOnPack, Card, GameState, GameVariant, UnoColor } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function numberCard(id: string, value: number): Card {
  const color: UnoColor = value <= 3 ? 'green' : value <= 6 ? 'yellow' : value <= 9 ? 'blue' : 'red'
  return { id, kind: 'number', color, label: String(value), points: value, value }
}

function skipBoWild(id: string): Card {
  return { id, kind: 'wild', color: 'wild', label: 'Skip-Bo', points: 0 }
}

function skipBoState(): GameState {
  const state = createGame(createConfig('skipBo' as GameVariant, 'hotseat', 4, 'medium', addOns))
  state.players[0].skipBoStockPile = [numberCard('stock1', 1)]
  state.players[0].hand = [numberCard('hand2', 2), numberCard('hand9', 9)]
  state.players[0].skipBoDiscardPiles = [[numberCard('discard3', 3)], [], [], []]
  state.skipBoBuildPiles = [[], [], [], []]
  state.drawPile = [numberCard('draw5', 5), numberCard('draw4', 4), numberCard('draw3', 3)]
  state.activePlayerIndex = 0
  state.drewThisTurn = true
  return state
}

{
  const deck = buildSkipBoDeck()

  assert.equal(deck.length, 162, 'Skip-Bo should use a 162-card deck')
  assert.equal(deck.filter((card) => card.kind === 'wild').length, 18, 'Skip-Bo should include 18 Skip-Bo wild cards')
  for (let value = 1; value <= 12; value += 1) {
    assert.equal(deck.filter((card) => card.kind === 'number' && card.value === value).length, 12, `Skip-Bo should include twelve ${value} cards`)
  }
}

{
  const state = createGame(createConfig('skipBo' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.config.game, 'skipBo')
  assert.equal(state.players[0].skipBoStockPile?.length, 30, 'Skip-Bo uses 30-card stock piles for 2-4 players')
  assert.equal(state.players[0].hand.length, 0, 'players draw to five at the start of each turn')
  assert.equal(state.players[0].skipBoDiscardPiles?.length, 4, 'each player has four discard piles')
  assert.equal(state.skipBoBuildPiles?.length, 4, 'the table has four building piles')
}

{
  const state = skipBoState()
  state.players[0].hand = [numberCard('kept', 8)]
  state.drawPile = [numberCard('draw5', 5), numberCard('draw4', 4), numberCard('draw3', 3), numberCard('draw2', 2)]
  state.drewThisTurn = false

  const drawn = skipBoDrawToFive(state)

  assert.equal(drawn.players[0].hand.length, 5, 'Skip-Bo draw fills the hand to five cards')
  assert.equal(drawn.drewThisTurn, true, 'drawing to five opens the play step')
}

{
  const state = skipBoState()
  state.players[0].hand = []
  state.skipBoBuildPiles = [[], [], [], []]
  state.discardPile = []
  state.drawPile = [
    numberCard('draw12', 12),
    numberCard('draw10', 10),
    numberCard('draw7', 7),
    numberCard('draw4', 4),
    numberCard('draw1', 1),
  ]
  state.drewThisTurn = false

  const drawn = skipBoDrawToFive(state)

  assert.doesNotThrow(() => recommendMove(drawn), 'Skip-Bo recommendation should not require a classic UNO top discard after drawing')
  assert.doesNotThrow(() => playableReason('en', drawn.players[0].hand[0], drawn), 'Skip-Bo tooltip reasons should not require a classic UNO top discard after drawing')
}

{
  const played = playCard(skipBoState(), 'skipbo:stock:p1').state

  assert.equal(played.players[0].skipBoStockPile?.length, 0, 'playing from stock removes the top stock card')
  assert.equal(played.skipBoBuildPiles?.[0].at(-1)?.value, 1, 'a 1 starts an empty building pile')
  assert.equal(played.winnerId, 'p1', 'emptying the stock pile wins the Skip-Bo round')
}

{
  const state = skipBoState()
  state.skipBoBuildPiles = [[numberCard('b1', 1)], [], [], []]
  const played = playCard(state, 'hand2').state

  assert.equal(played.players[0].hand.some((card) => card.id === 'hand2'), false, 'playing from hand removes the card')
  assert.equal(played.skipBoBuildPiles?.[0].at(-1)?.value, 2, 'a hand card can continue a building pile')
}

{
  const state = skipBoState()
  state.players[0].hand = [numberCard('hand2', 2)]
  state.skipBoBuildPiles = [[numberCard('b1', 1)], [], [], []]
  state.drawPile = [numberCard('draw9', 9), numberCard('draw8', 8), numberCard('draw7', 7), numberCard('draw6', 6), numberCard('draw5', 5)]

  const played = playCard(state, 'hand2').state

  assert.equal(played.players[0].hand.length, 5, 'emptying a Skip-Bo hand immediately refills it to five')
  assert.equal(played.activePlayerIndex, 0, 'refilling an empty Skip-Bo hand keeps the same turn active')
}

{
  const state = skipBoState()
  state.players[0].skipBoStockPile = [skipBoWild('wildStock')]
  const played = playCard(state, 'skipbo:stock:p1').state

  assert.equal(played.skipBoBuildPiles?.[0].at(-1)?.value, 1, 'a Skip-Bo wild acts as the next needed number')
}

{
  const state = skipBoState()
  state.players[0].hand = [numberCard('hand12', 12)]
  state.skipBoBuildPiles = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((value) => numberCard(`b${value}`, value)), [], [], []]

  const played = playCard(state, 'hand12').state

  assert.equal(played.skipBoBuildPiles?.[0].length, 0, 'a completed 1-12 building pile clears from the table')
}

{
  const state = skipBoState()
  const discarded = skipBoDiscardToPile(state, 'hand9', 2)

  assert.equal(discarded.players[0].hand.some((card) => card.id === 'hand9'), false, 'discarding removes a hand card')
  assert.equal(discarded.players[0].skipBoDiscardPiles?.[2].at(-1)?.id, 'hand9', 'discarding places the card on the chosen discard pile')
  assert.equal(discarded.activePlayerIndex, 1, 'discarding ends the turn')
}

console.log('Skip-Bo behavior tests passed')
