import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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

function baseState(colorConstrained = false, anchor = 5, direction: 'higher' | 'lower' = 'higher'): GameState {
  const state = createGame(createConfig('guoHiLo' as GameVariant, 'hotseat', 4, 'medium', addOns, 7, 500, 2, 0, false, 'easy', 'number', 2, false, colorConstrained))
  return {
    ...state,
    activeColor: 'yellow',
    hiLoAnchor: anchor,
    hiLoDirection: direction,
    discardPile: [card('top-y5', 'number', 'yellow', String(anchor), anchor, anchor)],
    players: state.players.map((player, index) => index === 0
      ? {
          ...player,
          hand: [
            card('blue-4', 'number', 'blue', '4', 4, 4),
            card('yellow-4', 'number', 'yellow', '4', 4, 4),
            card('blue-6', 'number', 'blue', '6', 6, 6),
            card('yellow-6', 'number', 'yellow', '6', 6, 6),
            card('green-9', 'number', 'green', '9', 9, 9),
            card('yellow-skip', 'skip', 'yellow', 'Skip', 20),
            card('wild', 'wild', 'wild', 'Wild', 50),
          ],
        }
      : player),
  }
}

{
  const state = baseState(false, 5, 'higher')
  const player = state.players[0]

  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'blue-6')!, state), true, 'higher mode should allow a higher number in any color')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'green-9')!, state), true, 'higher mode should allow any higher number up to 9')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'blue-4')!, state), false, 'higher mode should reject lower numbers')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'yellow-skip')!, state), true, 'actions should remain playable by active color')

  const result = playCard(state, 'blue-6')
  assert.equal(result.state.activeColor, 'blue', 'number-only mode should allow a different-color number to change active color')
  assert.equal(result.state.hiLoAnchor, 6, 'played number should become the next active Hi-Lo number')
  assert.match(result.state.hiLoDirection ?? '', /higher|lower/, 'indicator should reroll after a valid play')
}

{
  const state = baseState(false, 5, 'lower')
  const player = state.players[0]

  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'blue-4')!, state), true, 'lower mode should allow a lower number')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'blue-6')!, state), false, 'lower mode should reject higher numbers')
}

{
  const state = baseState(true, 5, 'higher')
  const player = state.players[0]

  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'blue-6')!, state), false, 'color-constrained mode should reject correct numbers in the wrong color')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'yellow-6')!, state), true, 'color-constrained mode should allow correct numbers in the active color')
}

{
  const state = baseState(false, 9, 'higher')
  const player = state.players[0]

  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'blue-4')!, state), false, '9 higher should not wrap to lower numbers')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'yellow-skip')!, state), true, 'edge states should still allow matching action cards')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'wild')!, state), true, 'edge states should still allow Wild cards')
}

{
  const state = baseState(false, 0, 'lower')
  const player = state.players[0]

  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'blue-4')!, state), false, '0 lower should not wrap to higher numbers')
  assert.equal(isPlayable(player.hand.find((entry) => entry.id === 'wild')!, state), true, '0 lower should still allow Wild cards')
}

{
  const state = baseState(false, 5, 'higher')
  const noChoice = playCard(state, 'wild')
  assert.equal(noChoice.needsChoice?.type, 'hiLoWild', 'Hi-Lo Wild should request color and active number')
  const colorOnly = playCard(state, 'wild', { color: 'red' })
  assert.equal(colorOnly.needsChoice?.type, 'hiLoWild', 'Hi-Lo Wild should still ask if active number is missing')
  const complete = playCard(state, 'wild', { color: 'red', hiLoAnchor: 9 })
  assert.equal(complete.needsChoice, undefined)
  assert.equal(complete.state.activeColor, 'red')
  assert.equal(complete.state.hiLoAnchor, 9)
  assert.match(complete.state.hiLoDirection ?? '', /higher|lower/)
}

console.log("Guo's Exclusive Uno Hi-Lo behavior tests passed")

const appSource = readFileSync('src/App.tsx', 'utf8')
const widePlayerBody = appSource.match(/function usesWidePlayerOptions\(game: GameVariant\): boolean \{([\s\S]*?)\n}/)?.[1] ?? ''
assert.equal(widePlayerBody.includes('guoHiLo'), false, 'Hi-Lo should use the normal 2-4 player selector')
