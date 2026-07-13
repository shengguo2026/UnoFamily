import assert from 'node:assert/strict'
import { createConfig, createGame, drawOne, playCard } from '../src/game/classic'
import type { AddOnPack, Card, CardFace, GameState, GameVariant, UnoColor } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function face(kind: Card['kind'], color: UnoColor | 'wild', label: string, points: number, value?: number): CardFace {
  return { kind, color, label, points, value }
}

function card(id: string, kind: Card['kind'], color: UnoColor | 'wild', label: string, points: number, value?: number, dark?: CardFace): Card {
  const light = face(kind, color, label, points, value)
  return { id, ...light, flipFaces: dark ? { light, dark } : undefined }
}

function flipExtremeState(): GameState {
  return {
    ...createGame(createConfig('flipExtreme' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [card('p2-keep', 'number', 'yellow', '6', 6, 6, face('number', 'pink', '6', 6, 6))], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [card('p3-keep', 'number', 'blue', '7', 7, 7, face('number', 'teal', '7', 7, 7))], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [card('p4-keep', 'number', 'green', '8', 8, 8, face('number', 'purple', '8', 8, 8))], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('d1', 'number', 'green', '1', 1, 1, face('number', 'teal', '1', 1, 1)),
      card('d2', 'number', 'blue', '2', 2, 2, face('number', 'pink', '2', 2, 2)),
      card('d3', 'number', 'yellow', '3', 3, 3, face('number', 'purple', '3', 3, 3)),
      card('d4', 'number', 'red', '4', 4, 4, face('number', 'orange', '4', 4, 4)),
    ],
    discardPile: [card('top', 'number', 'red', '5', 5, 5, face('number', 'teal', '5', 5, 5))],
    activePlayerIndex: 0,
    activeColor: 'red',
    direction: 1,
    flipSide: 'light',
    winnerId: null,
    gameWinnerId: null,
  }
}

{
  const state = flipExtremeState()

  const next = drawOne(state)

  assert.equal(next.launcherEvent?.targetPlayerId, 'p1', 'Flip Extreme draw action should press the launcher for the active player')
  assert.equal(next.launcherEvent?.presses, 1, 'manual draw should press the launcher once')
  assert.equal(next.activePlayerIndex, 1, 'pressing the launcher as a draw action should end the turn')
}

{
  const state = flipExtremeState()
  state.players[0].hand = [
    card('flip', 'flip', 'red', 'Flip', 20, undefined, face('flip', 'purple', 'Dark Flip', 20)),
    card('keep', 'number', 'green', '8', 8, 8, face('number', 'orange', '8', 8, 8)),
  ]

  const result = playCard(state, 'flip')
  const top = result.state.discardPile.at(-1)

  assert.equal(result.state.flipSide, 'dark', 'Flip Extreme should reuse Flip side switching')
  assert.equal(top?.label, 'Dark Flip', 'the played Flip card should switch to its dark face')
  assert.equal(result.state.players[0].hand[0].color, 'orange', 'hands should switch to dark faces')
}

{
  const state = flipExtremeState()
  state.players[0].hand = [
    card('launcher-attack', 'wildExtremeHit', 'wild', 'Launcher Attack', 50, undefined, face('wildHitFire', 'wild', 'Extreme Hit', 60)),
    card('keep', 'number', 'green', '8', 8, 8, face('number', 'orange', '8', 8, 8)),
  ]

  const result = playCard(state, 'launcher-attack', { color: 'blue' })

  assert.equal(result.needsChoice, undefined, 'Flip Extreme Wild Launcher Attack should not ask for a target')
  assert.equal(result.state.launcherEvent?.targetPlayerId, 'p2', 'Wild Launcher Attack should target the next player')
  assert.equal(result.state.launcherEvent?.presses, 2, 'Wild Launcher Attack should press twice')
  assert.equal(result.state.activePlayerIndex, 2, 'the targeted next player should lose the turn')
}

console.log('Flip Extreme behavior tests passed')
