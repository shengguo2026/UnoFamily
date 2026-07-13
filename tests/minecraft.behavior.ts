import assert from 'node:assert/strict'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildMinecraftDeck } from '../src/game/deck'
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

function minecraftState(): GameState {
  return {
    ...createGame(createConfig('minecraft' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('draw-1', 'number', 'green', '1', 1, 1),
      card('draw-2', 'number', 'blue', '2', 2, 2),
      card('draw-3', 'number', 'yellow', '3', 3, 3),
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
  const deck = buildMinecraftDeck()

  assert.equal(deck.length, 112, 'UNO Minecraft should use a 112-card deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildCreeper').length, 4, 'UNO Minecraft should include four Wild Creeper cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Minecraft should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('minecraft' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Minecraft should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildCreeper'), true, 'created games should use the Minecraft deck')
}

{
  const state = minecraftState()
  state.players[0].hand = [card('creeper', 'wildCreeper', 'wild', 'Creeper', 50)]

  const result = playCard(state, 'creeper', { color: 'green' }).state

  assert.equal(result.players[1].hand.length, 3, 'Wild Creeper should make the next player draw 3 cards')
  assert.equal(result.activePlayerIndex, 2, 'Wild Creeper should skip the player who drew 3 cards')
  assert.equal(result.activeColor, 'green', 'Wild Creeper should choose the active color')
}

console.log('UNO Minecraft behavior tests passed')
