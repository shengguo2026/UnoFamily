import assert from 'node:assert/strict'
import { createConfig, createGame, isPlayable, playCard } from '../src/game/classic'
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

function baseState(colorConstrained = false, anchor = 5): GameState {
  const state = createGame(createConfig('guoNeighborMatch' as GameVariant, 'hotseat', 4, 'medium', addOns, 7, 500, 2, 0, false, 'easy', 'number', 2, colorConstrained))
  return {
    ...state,
    activeColor: 'yellow',
    neighborAnchor: anchor,
    discardPile: [card('top-y5', 'number', 'yellow', String(anchor), anchor, anchor)],
    players: state.players.map((player, index) => index === 0
      ? {
          ...player,
          hand: [
            card('blue-4', 'number', 'blue', '4', 4, 4),
            card('yellow-4', 'number', 'yellow', '4', 4, 4),
            card('green-5', 'number', 'green', '5', 5, 5),
            card('red-7', 'number', 'red', '7', 7, 7),
            card('yellow-skip', 'skip', 'yellow', 'Skip', 20),
            card('red-skip', 'skip', 'red', 'Skip', 20),
            card('wild', 'wild', 'wild', 'Wild', 50),
          ],
        }
      : player),
  }
}

{
  const state = baseState(false, 5)
  const player = state.players[0]

  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'blue-4')!, state), true, 'number-only mode should allow neighbor numbers in any color')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'green-5')!, state), true, 'same number should be playable')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'red-7')!, state), false, 'non-neighbor number should not be playable')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'yellow-skip')!, state), true, 'actions should play by active color')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'red-skip')!, state), false, 'same action symbol with wrong color should not be playable')

  const result = playCard(state, 'blue-4')
  assert.equal(result.state.activeColor, 'blue', 'number-only mode should allow a different-color number to change active color')
  assert.equal(result.state.neighborAnchor, 4, 'played number should become the next anchor')
}

{
  const state = baseState(true, 5)
  const player = state.players[0]

  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'blue-4')!, state), false, 'color-constrained mode should reject neighbor number with wrong color')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'yellow-4')!, state), true, 'color-constrained mode should allow matching color neighbor')
}

{
  const state = baseState(false, 0)
  const wrapped = {
    ...state,
    players: state.players.map((player, index) => index === 0
      ? { ...player, hand: [card('blue-9', 'number', 'blue', '9', 9, 9), card('green-1', 'number', 'green', '1', 1, 1), card('red-8', 'number', 'red', '8', 8, 8)] }
      : player),
  }
  const player = wrapped.players[0]

  assert.equal(isPlayable(player.hand[0], wrapped), true, '0 should neighbor 9')
  assert.equal(isPlayable(player.hand[1], wrapped), true, '0 should neighbor 1')
  assert.equal(isPlayable(player.hand[2], wrapped), false, '0 should not neighbor 8')
}

{
  const state = baseState(false, 5)
  const noChoice = playCard(state, 'wild')
  assert.equal(noChoice.needsChoice?.type, 'neighborWild', 'Neighbor Wild should request color and anchor')
  const colorOnly = playCard(state, 'wild', { color: 'red' })
  assert.equal(colorOnly.needsChoice?.type, 'neighborWild', 'Neighbor Wild should still ask if anchor is missing')
  const complete = playCard(state, 'wild', { color: 'red', neighborAnchor: 9 })
  assert.equal(complete.needsChoice, undefined)
  assert.equal(complete.state.activeColor, 'red')
  assert.equal(complete.state.neighborAnchor, 9)
}

console.log("Guo's Exclusive Uno Neighbor Match behavior tests passed")
