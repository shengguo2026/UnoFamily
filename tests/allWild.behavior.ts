import assert from 'node:assert/strict'
import { createConfig, createGame, isPlayable, playCard } from '../src/game/classic'
import type { AddOnPack, Card, GameState } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function card(id: string, kind: Card['kind'], label: string, points: number): Card {
  return { id, kind, color: 'wild', label, points }
}

function allWildState(): GameState {
  return {
    ...createGame(createConfig('allWild', 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('d1', 'wild', 'Wild', 20),
      card('d2', 'wild', 'Wild', 20),
      card('d3', 'wild', 'Wild', 20),
      card('d4', 'wild', 'Wild', 20),
    ],
    discardPile: [card('top', 'wildReverse', 'Wild Reverse', 30)],
    activePlayerIndex: 0,
    activeColor: null,
    direction: 1,
    pendingDraw: null,
    drewThisTurn: false,
    drawnCardIdThisTurn: null,
    winnerId: null,
    gameWinnerId: null,
  }
}

{
  const state = allWildState()
  const wild = card('plain', 'wild', 'Wild', 20)
  const skipTwo = card('skip-two', 'wildSkipTwo', 'Wild Skip Two', 40)
  state.players[0].hand = [wild, skipTwo]

  assert.equal(isPlayable(wild, state), true, 'plain Wild should be playable on any All Wild turn')
  assert.equal(isPlayable(skipTwo, state), true, 'Wild Skip Two should be playable on any All Wild turn')
}

{
  const state = allWildState()
  state.players[0].hand = [card('skip-two', 'wildSkipTwo', 'Wild Skip Two', 40), card('keep', 'wild', 'Wild', 20)]

  const next = playCard(state, 'skip-two').state

  assert.equal(next.activePlayerIndex, 3, 'Wild Skip Two should skip the next two players')
}

{
  const state = allWildState()
  state.players[0].hand = [card('draw-four', 'wildDraw4', 'Wild +4', 50), card('keep', 'wild', 'Wild', 20)]

  const next = playCard(state, 'draw-four').state

  assert.equal(next.pendingDraw?.amount, 4, 'Wild Draw Four should create a 4-card penalty')
  assert.equal(next.pendingDraw?.canChallenge, false, 'All Wild Draw Four should not be challengeable')
}

{
  const state = allWildState()
  state.players[0].hand = [card('targeted', 'wildTargetDraw2', 'Target +2', 40), card('keep', 'wild', 'Wild', 20)]

  const next = playCard(state, 'targeted', { targetPlayerId: 'p3' }).state

  assert.equal(next.players[2].hand.length, 2, 'Wild Targeted Draw Two should make the chosen player draw 2')
  assert.equal(next.activePlayerIndex, 1, 'turn order should continue normally after targeted draw')
}

{
  const state = allWildState()
  state.players[0].hand = [card('swap', 'wildForcedSwap', 'Forced Swap', 40), card('source-card', 'wild', 'Wild', 20)]
  state.players[2].hand = [card('target-card', 'wild', 'Wild', 20)]

  const next = playCard(state, 'swap', { targetPlayerId: 'p3' }).state

  assert.deepEqual(next.players[0].hand.map((entry) => entry.id), ['target-card'], 'Wild Forced Swap should trade hands with the chosen player')
  assert.deepEqual(next.players[2].hand.map((entry) => entry.id), ['source-card'], 'chosen player should receive the source hand')
}

console.log('All Wild behavior tests passed')
