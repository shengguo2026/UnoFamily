import assert from 'node:assert/strict'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildLordOfTheRingsDeck } from '../src/game/deck'
import { cardEffect, cardName } from '../src/i18n'
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

function lotrState(): GameState {
  return {
    ...createGame(createConfig('lotr' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [card('p2-keep', 'number', 'yellow', '6', 6, 6)], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [card('p3-keep', 'number', 'blue', '7', 7, 7)], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [card('p4-keep', 'number', 'green', '8', 8, 8)], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('d1', 'number', 'green', '1', 1, 1),
      card('d2', 'number', 'blue', '2', 2, 2),
      card('d3', 'number', 'yellow', '3', 3, 3),
      card('d4', 'number', 'red', '4', 4, 4),
    ],
    discardPile: [card('top', 'number', 'red', '5', 5, 5)],
    activePlayerIndex: 0,
    activeColor: 'red',
    direction: 1,
    winnerId: null,
    gameWinnerId: null,
  }
}

{
  const huntCard = card('hunt-text', 'wildHuntRing', 'wild', 'Hunt for the Ring', 50)

  assert.notEqual(cardName('zh', huntCard), 'Hunt for the Ring', 'Chinese card name should not fall back to English')
  assert.ok(cardEffect('zh', huntCard).includes('持戒者'), 'Chinese card effect should describe the Ring-bearer')
}

{
  const deck = buildLordOfTheRingsDeck()

  assert.equal(deck.length, 112, 'Lord of the Rings UNO should use the standard 112-card themed deck size')
  assert.equal(deck.filter((entry) => entry.kind === 'wildHuntRing').length, 4, 'Lord of the Rings UNO should include 4 Hunt for the Ring wild cards')
}

{
  const state = lotrState()
  state.players[0].hand = [
    card('hunt', 'wildHuntRing', 'wild', 'Hunt for the Ring', 50),
    card('keep', 'number', 'green', '8', 8, 8),
  ]

  const result = playCard(state, 'hunt', { color: 'blue', targetPlayerId: 'p3' })

  assert.equal(result.needsChoice, undefined, 'Hunt for the Ring should resolve after choosing a color and target')
  assert.equal(result.state.activeColor, 'blue', 'Hunt for the Ring should choose the next active color')
  assert.equal(result.state.players[2].hand.length, 4, 'the chosen Ring-bearer should draw 3 cards')
  assert.equal(result.state.activePlayerIndex, 1, 'normal turn order should continue after the Ring hunt')
}

console.log('Lord of the Rings behavior tests passed')
