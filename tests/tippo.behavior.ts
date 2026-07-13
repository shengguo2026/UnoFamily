import assert from 'node:assert/strict'
import { createConfig, createGame, isPlayable, playCard, tippoLegalTrayIndexes } from '../src/game/classic'
import { decideAiMove } from '../src/game/ai'
import { buildTippoDeck } from '../src/game/deck'
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

function tippoState(): GameState {
  return {
    ...createGame(createConfig('tippo' as GameVariant, 'hotseat', 4, 'medium', addOns)),
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
    ],
    discardPile: [card('tray-0-top', 'number', 'red', '5', 5, 5), card('tray-1-top', 'number', 'blue', '9', 9, 9)],
    activePlayerIndex: 0,
    activeColor: 'red',
    direction: 1,
    pendingDraw: null,
    drewThisTurn: false,
    drawnCardIdThisTurn: null,
    winnerId: null,
    gameWinnerId: null,
    tippoEvent: null,
    tippoTrays: [
      { cards: [card('tray-0-top', 'number', 'red', '5', 5, 5)], activeColor: 'red', load: 2, limit: 4 },
      { cards: [card('tray-1-top', 'number', 'blue', '9', 9, 9)], activeColor: 'blue', load: 0, limit: 4 },
    ],
  }
}

{
  const deck = buildTippoDeck()

  assert.equal(deck.length, 112, 'UNO Tippo should use a 112-card simulator deck')
  assert.equal(deck.filter((entry) => entry.kind === 'tippo').length, 4, 'UNO Tippo should include four Tippo cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Tippo keeps four Wild +4 cards')
}

{
  const state = createGame(createConfig('tippo' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.config.game, 'tippo')
  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Tippo deals seven cards to each player')
  assert.equal(state.tippoTrays?.length, 2, 'UNO Tippo starts with two balance trays')
  assert.equal(state.tippoTrays?.every((tray) => tray.cards.length === 1), true, 'each Tippo tray starts with one face-up card')
}

{
  const state = tippoState()
  const blue = card('blue-card', 'number', 'blue', '2', 2, 2)
  const green = card('green-card', 'number', 'green', '8', 8, 8)
  state.players[0].hand = [blue, green]

  assert.equal(isPlayable(blue, state), true, 'a card matching either Tippo tray should be playable')
  assert.deepEqual(tippoLegalTrayIndexes(state, blue), [1], 'legal tray indexes should include only matching trays')
  assert.equal(isPlayable(green, state), false, 'a card matching no tray should not be playable')
}

{
  const state = tippoState()
  state.players[0].hand = [card('blue-card', 'number', 'blue', '2', 2, 2)]

  const result = playCard(state, 'blue-card', { discardPileIndex: 1 }).state

  assert.equal(result.tippoTrays?.[1].cards.at(-1)?.id, 'blue-card', 'played card should land on the chosen Tippo tray')
  assert.equal(result.tippoTrays?.[1].load, 1, 'a quiet play increases the selected tray load by one')
  assert.equal(result.tippoEvent?.tipped, false, 'quiet plays still report the Tippo load for UI feedback')
  assert.equal(result.activePlayerIndex, 1, 'turn advances normally when the Tippo unit stays balanced')
}

{
  const state = tippoState()
  state.players[0].hand = [card('red-card', 'number', 'red', '7', 7, 7)]
  state.tippoTrays![0].load = 3

  const result = playCard(state, 'red-card', { discardPileIndex: 0 }).state

  assert.equal(result.tippoEvent?.tipped, true, 'reaching the tray limit tips the Tippo unit')
  assert.equal(result.tippoEvent?.cardsTaken, 2, 'the player takes the tray cards that tipped')
  assert.equal(result.players[0].hand.length, 2, 'a final-card tray tip puts the tray into the source hand instead of winning')
  assert.equal(result.winnerId, null, 'the round does not end when Tippo makes the source take cards')
  assert.equal(result.tippoTrays?.[0].load, 0, 'the tipped tray resets after cards are taken')
  assert.equal(result.tippoTrays?.[0].cards.length, 1, 'the tipped tray is reseeded with a new opening card')
}

{
  const state = tippoState()
  state.players[0].hand = [card('tippo', 'tippo', 'wild', 'Tippo', 50)]

  const result = playCard(state, 'tippo', { color: 'yellow', discardPileIndex: 1 }).state

  assert.equal(result.activeColor, 'yellow', 'Tippo cards choose the active color')
  assert.equal(result.tippoEvent?.forced, true, 'Tippo cards force the selected tray to tip')
  assert.equal(result.players[0].hand.length, 2, 'a Tippo card makes the source take the selected tray')
}

{
  const state = tippoState()
  state.players[0].type = 'ai'
  state.players[0].hand = [card('wild-card', 'wild', 'wild', 'Wild', 50)]
  state.tippoTrays![0].load = 3
  state.tippoTrays![1].load = 0

  assert.equal(decideAiMove(state).choice?.discardPileIndex, 1, 'AI should prefer the calmer legal Tippo tray')
}

console.log('UNO Tippo behavior tests passed')
