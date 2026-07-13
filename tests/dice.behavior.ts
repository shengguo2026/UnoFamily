import assert from 'node:assert/strict'
import { callUno, catchUno, createConfig, createGame, drawOne, isPlayable, playCard } from '../src/game/classic'
import { buildDiceSet } from '../src/game/deck'
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

function diceState(): GameState {
  return {
    ...createGame(createConfig('dice' as GameVariant, 'hotseat', 2, 'medium', addOns, 5, 200)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
    ],
    drawPile: [],
    discardPile: [card('line-1', 'number', 'yellow', '1', 1, 1), card('line-top', 'number', 'red', '3', 3, 3)],
    activePlayerIndex: 0,
    activeColor: 'red',
    direction: 1,
    pendingDraw: null,
    drewThisTurn: false,
    drawnCardIdThisTurn: null,
    winnerId: null,
    gameWinnerId: null,
    targetScore: 200,
  }
}

{
  const dice = buildDiceSet()

  assert.equal(dice.length, 11, 'UNO Dice uses eleven dice')
  assert.equal(dice.every((entry) => entry.kind === 'number' || entry.kind === 'draw1' || entry.kind === 'draw2' || entry.kind === 'wild'), true, 'UNO Dice faces should use number, Draw One, Draw Two, and Wild faces')
}

{
  const state = createGame(createConfig('dice' as GameVariant, 'single', 4, 'medium', addOns, 7, 500))

  assert.equal(state.config.game, 'dice')
  assert.equal(state.players.length, 2, 'UNO Dice is always a two-player game')
  assert.equal(state.players.every((player) => player.hand.length === 5), true, 'each player starts with five dice')
  assert.equal(state.discardPile.length, 1, 'one extra die starts the center line')
  assert.equal(state.discardPile[0].kind, 'number', 'the opening center die is rolled until it shows a number')
  assert.equal(state.targetScore, 200, 'UNO Dice sessions use 200 points')
}

{
  const state = diceState()
  const redFive = card('red-5', 'number', 'red', '5', 5, 5)
  const blueThree = card('blue-3', 'number', 'blue', '3', 3, 3)
  const blueFour = card('blue-4', 'number', 'blue', '4', 4, 4)
  const wild = card('wild', 'wild', 'wild', 'Wild', 50)
  const redDrawOne = card('red-draw-one', 'draw1', 'red', '+1', 20)
  state.players[0].hand = [redFive, blueThree, blueFour, wild, redDrawOne]

  assert.equal(isPlayable(redFive, state), true, 'matching the active color is playable')
  assert.equal(isPlayable(blueThree, state), true, 'matching the number is playable')
  assert.equal(isPlayable(blueFour, state), false, 'a die matching neither color nor number is not playable')
  assert.equal(isPlayable(wild, state), true, 'Wild is always playable')
  assert.equal(isPlayable(redDrawOne, state), true, 'a colored action die can match by active color')
}

{
  const state = diceState()
  state.players[0].hand = [card('red-5', 'number', 'red', '5', 5, 5), card('blue-4', 'number', 'blue', '4', 4, 4)]

  const result = playCard(state, 'red-5').state

  assert.equal(result.discardPile.at(-1)?.id, 'red-5', 'played dice are appended to the center line')
  assert.equal(result.players[0].hand.length, 1, 'the played die leaves the hand')
  assert.equal(result.activePlayerIndex, 1, 'normal dice play advances to the opponent')
}

{
  const state = diceState()
  state.players[0].hand = [card('red-draw-two', 'draw2', 'red', '+2', 20), card('green-4', 'number', 'green', '4', 4, 4)]
  state.players[1].hand = [card('opp-1', 'number', 'blue', '1', 1, 1)]

  const result = playCard(state, 'red-draw-two').state

  assert.equal(result.discardPile.length, 1, 'Draw Two must leave at least one die in the center line')
  assert.equal(result.players[1].hand.length, 3, 'opponent takes two center dice when enough are available')
  assert.equal(result.activePlayerIndex, 0, 'the opponent loses the turn after Draw Two')
}

{
  const state = diceState()
  state.players[0].hand = [card('green-4', 'number', 'green', '4', 4, 4)]

  const result = drawOne(state)

  assert.equal(result.discardPile.length, 1, 'drawing from the line keeps one center die visible')
  assert.equal(result.players[0].hand.length, 2, 'taking from the center line adds one die before rerolling the hand')
}

{
  const state = diceState()
  state.discardPile = [card('line-1', 'number', 'yellow', '1', 1, 1), card('line-top', 'number', 'red', '3', 3, 3)]
  state.players[0].hand = [card('red-draw-one', 'draw1', 'red', '+1', 20)]
  state.players[1].hand = [card('opp-5', 'number', 'blue', '5', 5, 5)]

  const result = playCard(state, 'red-draw-one').state

  assert.equal(result.winnerId, 'p1', 'a final Draw One can still win after the opponent takes dice')
  assert.equal(result.players[1].hand.length, 2, 'the Draw One penalty is applied before scoring')
}

{
  const state = diceState()
  state.players[0].hand = [card('red-5', 'number', 'red', '5', 5, 5), card('blue-3', 'number', 'blue', '3', 3, 3)]

  const called = callUno(state, 'p1')
  assert.equal(called.unoDeclaredPlayerId, 'p1', 'UNO Dice supports calling UNO before playing the penultimate die')

  const missed = playCard(state, 'red-5').state
  assert.equal(missed.catchableUnoPlayerId, 'p1', 'missing UNO with one die left opens a catch window')
  const caught = catchUno(missed)
  assert.equal(caught.players[0].hand.length >= 2, true, 'a caught UNO Dice player receives a dice penalty')
}

console.log('UNO Dice behavior tests passed')
