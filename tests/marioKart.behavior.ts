import assert from 'node:assert/strict'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildMarioKartDeck } from '../src/game/deck'
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

function marioKartState(revealed: Card): GameState {
  return {
    ...createGame(createConfig('marioKart' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [card('box', 'wildItemBox', 'wild', 'Item Box', 50)], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [card('p2-card', 'number', 'green', '3', 3, 3)], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [card('p3-card', 'number', 'blue', '4', 4, 4)], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [card('p4-card', 'number', 'yellow', '5', 5, 5)], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('draw-a', 'number', 'blue', '1', 1, 1),
      card('draw-b', 'number', 'green', '2', 2, 2),
      revealed,
    ],
    discardPile: [card('top', 'number', 'red', '7', 7, 7)],
    activePlayerIndex: 0,
    activeColor: 'red',
    direction: 1,
    pendingDraw: null,
    drewThisTurn: false,
    drawnCardIdThisTurn: null,
    winnerId: null,
    gameWinnerId: null,
    marioKartEvent: null,
  }
}

{
  const deck = buildMarioKartDeck()

  assert.equal(deck.length, 112, 'UNO Mario Kart should use a 112-card deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildItemBox').length, 8, 'UNO Mario Kart should include eight Wild Item Box cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wild').length, 0, 'Wild Item Box replaces regular Wild cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Mario Kart keeps four Wild +4 cards')
}

{
  const state = createGame(createConfig('marioKart' as GameVariant, 'single', 4, 'medium', addOns))

  assert.equal(state.config.game, 'marioKart')
  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Mario Kart deals seven cards')
  assert.equal(state.drawPile.some((entry) => entry.kind === 'wildItemBox') || state.players.some((player) => player.hand.some((entry) => entry.kind === 'wildItemBox')), true, 'Wild Item Box cards are present')
}

{
  const state = marioKartState(card('mushroom', 'number', 'red', 'Mushroom 4', 4, 4))
  const result = playCard(state, 'box', { color: 'blue', targetPlayerId: 'p3' }).state

  assert.equal(result.activePlayerIndex, 0, 'Mushroom lets the Wild Item Box player take another turn')
  assert.equal(result.activeColor, 'red', 'the revealed Mushroom card becomes the color to match')
  assert.equal(result.discardPile.at(-1)?.id, 'mushroom', 'the revealed item card is placed on top of the discard pile')
  assert.equal(result.marioKartEvent?.item, 'mushroom')
}

{
  const state = marioKartState(card('banana', 'number', 'yellow', 'Banana 8', 8, 8))
  const result = playCard(state, 'box', { color: 'green', targetPlayerId: 'p3' }).state

  assert.equal(result.players[3].hand.length, 3, 'Banana Peel makes the previous player draw two cards')
  assert.equal(result.activePlayerIndex, 1, 'play continues to the next player after Banana Peel')
  assert.equal(result.marioKartEvent?.item, 'banana')
}

{
  const state = marioKartState(card('shell', 'number', 'green', 'Green Shell 2', 2, 2))
  const result = playCard(state, 'box', { color: 'red', targetPlayerId: 'p3' }).state

  assert.equal(result.players[2].hand.length, 2, 'Green Shell makes the chosen opponent draw one card')
  assert.equal(result.activePlayerIndex, 1, 'play continues to the next player after Green Shell')
  assert.equal(result.marioKartEvent?.targetPlayerId, 'p3')
}

{
  const state = marioKartState(card('lightning', 'number', 'blue', 'Lightning 6', 6, 6))
  const result = playCard(state, 'box', { color: 'yellow', targetPlayerId: 'p3' }).state

  assert.equal(result.players[1].hand.length, 2, 'Lightning makes player 2 draw one card')
  assert.equal(result.players[2].hand.length, 2, 'Lightning makes player 3 draw one card')
  assert.equal(result.players[3].hand.length, 2, 'Lightning makes player 4 draw one card')
  assert.equal(result.activePlayerIndex, 0, 'Lightning lets the Wild Item Box player take another turn')
  assert.equal(result.marioKartEvent?.item, 'lightning')
}

{
  const state = marioKartState(card('bobomb', 'wildDraw4', 'wild', '+4', 50))
  const result = playCard(state, 'box', { color: 'green', targetPlayerId: 'p3' }).state

  assert.equal(result.players[0].hand.length, 2, 'Bob-omb makes the Wild Item Box player draw two cards')
  assert.equal(result.activeColor, 'green', 'Bob-omb keeps the chosen Wild Item Box color')
  assert.equal(result.activePlayerIndex, 1, 'play continues after Bob-omb')
  assert.equal(result.marioKartEvent?.item, 'bobomb')
}

console.log('UNO Mario Kart behavior tests passed')
