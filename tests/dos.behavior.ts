import assert from 'node:assert/strict'
import { callUno, catchUno, createConfig, createGame, drawOne, playCard, playableCards } from '../src/game/classic'
import { buildDosDeck } from '../src/game/deck'
import { recommendMove } from '../src/game/recommendation'
import { playableReason } from '../src/i18n'
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

function dosState(): GameState {
  const state = createGame(createConfig('dos' as GameVariant, 'hotseat', 4, 'medium', addOns))
  state.players[0].hand = [card('r3', 3, 'red'), card('b4', 4, 'blue'), card('g9', 9, 'green')]
  state.players[1].hand = [card('p2', 2, 'yellow')]
  state.players[2].hand = [card('p3', 3, 'yellow')]
  state.players[3].hand = [card('p4', 4, 'yellow')]
  state.dosCenterRow = [card('target7', 7, 'green'), card('target5', 5, 'yellow')]
  state.drawPile = [card('bonus', 8, 'blue'), card('refill', 6, 'red'), card('penalty1', 1, 'green'), card('penalty2', 1, 'blue'), card('penalty3', 1, 'yellow')]
  state.discardPile = []
  return state
}

{
  const deck = buildDosDeck()

  assert.equal(deck.length, 108, 'DOS should use a 108-card deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDos').length, 12, 'DOS should include twelve Wild DOS cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildNumber').length, 8, 'DOS should include two Wild # cards in each color')
  assert.equal(deck.filter((entry) => entry.kind === 'number' && entry.value === 2).length, 0, 'DOS uses Wild DOS cards instead of colored 2 cards')
}

{
  const state = createGame(createConfig('dos' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.config.game, 'dos')
  assert.equal(state.targetScore, 200, 'DOS sessions should score to 200 points')
  assert.equal(state.players[0].hand.length, 7, 'DOS starts each player with seven cards')
  assert.equal(state.dosCenterRow?.length, 2, 'DOS starts with a two-card center row')
  assert.equal(state.discardPile.length, 0, 'DOS starts without a single top discard card')
}

{
  const state = dosState()

  assert.deepEqual(playableCards(state.players[0], state).map((entry) => entry.id).sort(), ['b4', 'r3'], 'cards that can form a DOS match should be marked playable')
  assert.doesNotThrow(() => recommendMove(state), 'DOS recommendation should not require a classic top discard')
  assert.doesNotThrow(() => playableReason('en', state.players[0].hand[0], state), 'DOS card tooltips should not require a classic top discard')

  const result = playCard(state, 'r3', { secondCardId: 'b4' })
  assert.equal(result.sound, 'play')
  assert.equal(result.state.players[0].hand.some((entry) => entry.id === 'r3' || entry.id === 'b4'), false, 'a two-card DOS match removes both played cards')
  assert.equal(result.state.dosCenterRow?.length, 2, 'the DOS center row should refill to two cards after a match')
  assert.equal(result.state.discardPile.some((entry) => entry.id === 'target7'), true, 'the matched center card moves to discard')
  assert.equal(result.state.activePlayerIndex, 1, 'play passes after a DOS match')
}

{
  const state = dosState()
  state.players[0].hand = [card('r5', 5, 'red'), card('extra', 6, 'blue')]
  state.dosCenterRow = [card('target5', 5, 'yellow'), card('target8', 8, 'green')]
  state.drawPile = [card('refill', 1, 'red')]

  const result = playCard(state, 'r5')
  assert.equal(result.state.players[0].hand.some((entry) => entry.id === 'r5'), false, 'a single-card DOS match removes the played card')
  assert.equal(result.state.discardPile.some((entry) => entry.id === 'target5'), true, 'the single matched center card moves to discard')
  assert.equal(result.state.activePlayerIndex, 1, 'single DOS matches also pass the turn')
}

{
  const state = dosState()
  state.players[0].hand = [card('r3', 3, 'red'), card('r4', 4, 'red'), card('bonusPlace', 9, 'blue')]
  state.dosCenterRow = [card('target7', 7, 'red'), card('target8', 8, 'green')]
  const beforeOtherHandSizes = state.players.slice(1).map((player) => player.hand.length)

  const result = playCard(state, 'r3', { secondCardId: 'r4' })
  assert.deepEqual(result.state.players.slice(1).map((player) => player.hand.length), beforeOtherHandSizes.map((size) => size + 1), 'a double color match makes every other player draw one card')
  assert.equal(result.state.dosCenterRow?.some((entry) => entry.id === 'bonusPlace'), true, 'a DOS color bonus places one extra card from hand into the center row')
}

{
  const state = dosState()
  state.players[0].hand = [card('r9', 9, 'red')]
  state.dosCenterRow = [card('target4', 4, 'green'), card('target6', 6, 'yellow')]
  state.drawPile = [card('drawn', 10, 'blue')]

  const afterDraw = drawOne(state)
  assert.equal(afterDraw.players[0].hand.some((entry) => entry.id === 'drawn'), true, 'DOS draw adds one card when no match is available')
  assert.equal(afterDraw.activePlayerIndex, 1, 'DOS draw passes when the drawn card cannot match the center row')
}

{
  const state = dosState()
  state.players[0].hand = [card('r3', 3, 'red'), card('r4', 4, 'blue')]
  state.catchableUnoPlayerId = 'p1'

  const called = callUno(state, 'p1')
  assert.equal(called.unoDeclaredPlayerId, 'p1', 'DOS calls use the shared declaration window')
  assert.equal(called.catchableUnoPlayerId, null, 'calling DOS should close the catch window')

  const caught = catchUno(state)
  assert.equal(caught.players[0].hand.length, 4, 'missing a DOS call should draw two penalty cards')
  assert.equal(caught.log[0].text.includes('DOS'), true, 'DOS catch logs should use DOS wording')
}

console.log('DOS behavior tests passed')
