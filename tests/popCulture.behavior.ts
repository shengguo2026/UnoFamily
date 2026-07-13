import assert from 'node:assert/strict'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildPopCultureDeck } from '../src/game/deck'
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

function popState(): GameState {
  return {
    ...createGame(createConfig('popCulture' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('d1', 'number', 'green', '8', 8, 8),
      card('d2', 'number', 'blue', '4', 4, 4),
      card('d3', 'number', 'yellow', '2', 2, 2),
      card('d4', 'number', 'red', '1', 1, 1),
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
  const deck = buildPopCultureDeck()

  assert.equal(deck.length, 116, 'Pop-Culture UNO should combine the four themed wild sets into one 116-card deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildSortingHat').length, 4, 'Pop-Culture deck should include Sorting Hat wilds')
  assert.equal(deck.filter((entry) => entry.kind === 'wildTheForce').length, 4, 'Pop-Culture deck should include The Force wilds')
  assert.equal(deck.filter((entry) => entry.kind === 'wildAvengersAssemble').length, 4, 'Pop-Culture deck should include Avengers Assemble wilds')
  assert.equal(deck.filter((entry) => entry.kind === 'wildTrexAttack').length, 4, 'Pop-Culture deck should include T-Rex Attack wilds')
}

{
  const state = popState()
  state.players[0].hand = [card('hat', 'wildSortingHat', 'wild', 'Sorting Hat', 50)]
  state.players[1].hand = [card('p2-old', 'number', 'blue', '9', 9, 9)]
  state.drawPile = [
    card('non-gryff-1', 'number', 'blue', '8', 8, 8),
    card('gryffindor', 'number', 'red', '3', 3, 3),
  ]

  const result = playCard(state, 'hat', { color: 'green', targetPlayerId: 'p2' })

  assert.equal(result.state.activeColor, 'green', 'Sorting Hat should set the declared color')
  assert.deepEqual(result.state.players[1].hand.map((entry) => entry.id), ['p2-old', 'gryffindor'], 'Sorting Hat should draw until a Gryffindor-number card appears')
  assert.equal(result.state.activePlayerIndex, 1, 'normal order should continue after Sorting Hat')
}

{
  const state = popState()
  state.players[0].hand = [card('force', 'wildTheForce', 'wild', 'The Force', 50)]
  state.players[2].hand = [card('green-match', 'number', 'green', '6', 6, 6)]

  const result = playCard(state, 'force', { color: 'green', targetPlayerId: 'p3' })

  assert.equal(result.state.players[2].hand.length, 3, 'The Force should make a target draw 2 when they hold the declared color')
  assert.equal(result.state.activeColor, 'green')
  assert.equal(result.state.activePlayerIndex, 1)
}

{
  const state = popState()
  state.players[0].hand = [card('draw2', 'draw2', 'red', '+2', 20)]
  state.players[1].hand = [card('shield', 'wildAvengersAssemble', 'wild', 'Avengers Assemble', 50)]

  const pending = playCard(state, 'draw2').state
  const reflected = playCard(pending, 'shield', { color: 'blue' }).state

  assert.equal(reflected.pendingDraw, null, 'Avengers Assemble should clear the pending draw penalty')
  assert.equal(reflected.players[0].hand.length, 2, 'Avengers Assemble should reflect the draw penalty to the source player')
  assert.equal(reflected.players[1].hand.length, 0, 'the shield player should discard Avengers Assemble')
  assert.equal(reflected.activeColor, 'blue')
  assert.equal(reflected.activePlayerIndex, 2, 'play should continue after the shielded player')
}

{
  const state = popState()
  state.players[0].hand = [card('trex', 'wildTrexAttack', 'wild', 'T-Rex Attack', 50)]
  state.players[1].hand = [card('no-green', 'number', 'blue', '7', 7, 7)]

  const result = playCard(state, 'trex', { color: 'green' })

  assert.equal(result.state.players[1].hand.length, 6, 'T-Rex Attack should make the next player draw 5 if they cannot match the declared color')
  assert.equal(result.state.activeColor, 'green')
  assert.equal(result.state.activePlayerIndex, 1)
}

console.log('Pop-Culture behavior tests passed')
