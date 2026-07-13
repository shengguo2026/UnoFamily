import assert from 'node:assert/strict'
import { createConfig, createGame, playCard } from '../src/game/classic.ts'
import { buildWildJackpotDeck } from '../src/game/deck.ts'
import type { AddOnPack, Card, GameState, GameVariant, UnoColor } from '../src/game/types.ts'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function card(id: string, kind: Card['kind'], color: UnoColor | 'wild', label: string, points: number, value?: number): Card {
  return { id, kind, color, label, points, value }
}

function wildJackpotState(): GameState {
  return {
    ...createGame(createConfig('wildJackpot' as GameVariant, 'hotseat', 4, 'medium', addOns)),
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
      card('draw-4', 'number', 'red', '4', 4, 4),
      card('draw-5', 'number', 'green', '5', 5, 5),
      card('draw-6', 'number', 'blue', '6', 6, 6),
      card('draw-7', 'number', 'yellow', '7', 7, 7),
      card('draw-8', 'number', 'red', '8', 8, 8),
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
    wildJackpotEvent: null,
  }
}

{
  const deck = buildWildJackpotDeck()

  assert.equal(deck.length, 112, 'UNO Wild Jackpot should use the 112-card simulator deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildJackpot').length, 4, 'Wild Jackpot should include four Wild Jackpot cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'Wild Jackpot keeps four Wild Draw 4 cards')
}

{
  const state = createGame(createConfig('wildJackpot' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.config.game, 'wildJackpot')
  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'Wild Jackpot deals seven cards to each player')
}

{
  const state = wildJackpotState()
  state.players[0].hand = [card('jackpot', 'wildJackpot', 'wild', 'Wild Jackpot', 50)]

  const result = playCard(state, 'jackpot', { color: 'green', jackpotRule: 'draw4' }).state

  assert.equal(result.players[1].hand.length, 4, 'Wild Jackpot Draw 4 should make the next player draw four cards')
  assert.equal(result.activePlayerIndex, 2, 'Wild Jackpot Draw 4 skips the penalized player')
  assert.equal(result.activeColor, 'green', 'Wild Jackpot still sets the chosen active color')
  assert.equal(result.wildJackpotEvent?.rule, 'draw4', 'Wild Jackpot records the simulated roller result')
}

{
  const state = wildJackpotState()
  state.players[0].hand = [card('jackpot', 'wildJackpot', 'wild', 'Wild Jackpot', 50)]

  const result = playCard(state, 'jackpot', { color: 'blue', jackpotRule: 'allDraw1' }).state

  assert.equal(result.players[0].hand.length, 0, 'the roller does not make the source player draw')
  assert.equal(result.players[1].hand.length, 1, 'all other players draw one card')
  assert.equal(result.players[2].hand.length, 1, 'all other players draw one card')
  assert.equal(result.players[3].hand.length, 1, 'all other players draw one card')
  assert.equal(result.activePlayerIndex, 1, 'All Draw 1 continues to the next player')
}

{
  const state = wildJackpotState()
  state.players[0].hand = [card('jackpot', 'wildJackpot', 'wild', 'Wild Jackpot', 50)]

  const result = playCard(state, 'jackpot', { color: 'yellow', jackpotRule: 'playAgain' }).state

  assert.equal(result.activePlayerIndex, 0, 'Play Again keeps the turn with the roller player')
  assert.equal(result.wildJackpotEvent?.rule, 'playAgain', 'the event exposes the exact roller result')
}

console.log('UNO Wild Jackpot behavior tests passed')
