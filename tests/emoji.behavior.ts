import assert from 'node:assert/strict'
import { createConfig, createGame, playCard, resolvePendingEmoji } from '../src/game/classic'
import { buildEmojiDeck } from '../src/game/deck'
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

function emojiState(): GameState {
  return {
    ...createGame(createConfig('emoji' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: Array.from({ length: 20 }, (_, index) => card(`draw-${index}`, 'number', 'blue', '1', 1, 1)),
    discardPile: [card('top', 'number', 'red', '5', 5, 5)],
    activePlayerIndex: 0,
    activeColor: 'red',
    direction: 1,
    pendingDraw: null,
    pendingEmoji: null,
    drewThisTurn: false,
    drawnCardIdThisTurn: null,
    winnerId: null,
    gameWinnerId: null,
  }
}

{
  const deck = buildEmojiDeck()

  assert.equal(deck.length, 112, 'UNO Emoji should use a 112-card deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildEmoji').length, 4, 'UNO Emoji should include four Wild Emoji cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Emoji keeps four Wild +4 cards')
}

{
  const state = createGame(createConfig('emoji' as GameVariant, 'single', 4, 'medium', addOns))

  assert.equal(state.config.game, 'emoji')
  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Emoji deals seven cards')
  assert.equal(state.drawPile.some((entry) => entry.kind === 'wildEmoji') || state.players.some((player) => player.hand.some((entry) => entry.kind === 'wildEmoji')), true, 'Wild Emoji cards are present in the session')
}

{
  const state = emojiState()
  state.players[0].hand = [card('emoji', 'wildEmoji', 'wild', 'Wild Emoji 😂', 50)]

  const result = playCard(state, 'emoji', { color: 'green' }).state

  assert.equal(result.activeColor, 'green', 'Wild Emoji chooses the active color')
  assert.equal(result.activePlayerIndex, 1, 'Wild Emoji prompts the next player')
  assert.equal(result.pendingEmoji?.targetPlayerId, 'p2', 'next player must resolve the emoji challenge')
  assert.equal(result.pendingEmoji?.sourcePlayerId, 'p1', 'source player is tracked for logs')
}

{
  const state = emojiState()
  state.players[0].hand = [card('emoji', 'wildEmoji', 'wild', 'Wild Emoji 😎', 50)]
  state.players[0].hand.push(card('extra-yellow', 'number', 'yellow', '2', 2, 2))
  const prompted = playCard(state, 'emoji', { color: 'yellow' }).state

  const resolved = resolvePendingEmoji(prompted, 'madeFace')

  assert.equal(resolved.pendingEmoji, null, 'making the face clears the pending emoji challenge')
  assert.equal(resolved.players[1].hand.length, 0, 'making the face avoids the card penalty')
  assert.equal(resolved.activePlayerIndex, 1, 'the challenged player continues their turn after making the face')
}

{
  const state = emojiState()
  state.players[0].hand = [card('emoji', 'wildEmoji', 'wild', 'Wild Emoji 😮', 50)]
  state.players[0].hand.push(card('extra-blue', 'number', 'blue', '2', 2, 2))
  const prompted = playCard(state, 'emoji', { color: 'blue' }).state

  const penalized = resolvePendingEmoji(prompted, 'draw4')

  assert.equal(penalized.pendingEmoji, null, 'drawing clears the pending emoji challenge')
  assert.equal(penalized.players[1].hand.length, 4, 'refusing or failing the face challenge draws 4')
  assert.equal(penalized.activePlayerIndex, 2, 'drawing the penalty skips the challenged player')
}

{
  const state = emojiState()
  state.players[0].hand = [card('emoji', 'wildEmoji', 'wild', 'Wild Emoji Face', 50)]
  state.players[1].hand = [card('target', 'number', 'green', '7', 7, 7)]

  const prompted = playCard(state, 'emoji', { color: 'green' }).state

  assert.equal(prompted.winnerId, null, 'a last-card Wild Emoji waits for the face challenge before ending the round')
  assert.equal(prompted.pendingEmoji?.targetPlayerId, 'p2', 'the next player still receives the emoji challenge')

  const resolved = resolvePendingEmoji(prompted, 'draw4')

  assert.equal(resolved.winnerId, 'p1', 'the Wild Emoji player wins after the challenge is resolved')
  assert.equal(resolved.players[1].hand.length, 5, 'the emoji penalty is included before scoring the round')
}

console.log('UNO Emoji behavior tests passed')
