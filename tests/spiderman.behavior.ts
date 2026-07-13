import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildSpiderManDeck } from '../src/game/deck'
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

function spiderManState(): GameState {
  return {
    ...createGame(createConfig('spiderman' as GameVariant, 'hotseat', 4, 'medium', addOns)),
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
  const deck = buildSpiderManDeck()

  assert.equal(deck.length, 112, 'UNO Spider-Man should use a 112-card playable deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildWebSwing').length, 4, 'UNO Spider-Man should include four Web Swing cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Spider-Man should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('spiderman' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Spider-Man should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildWebSwing'), true, 'created games should use the Spider-Man deck')
}

{
  const state = spiderManState()
  state.players[0].hand = [
    card('web', 'wildWebSwing', 'wild', 'Web Swing', 50),
    card('source-low', 'number', 'yellow', '1', 1, 1),
    card('source-wild', 'wild', 'wild', 'Wild', 50),
  ]
  state.players[2].hand = [
    card('target-low', 'number', 'green', '2', 2, 2),
    card('target-high', 'wildDraw4', 'wild', '+4', 50),
  ]

  const missingTarget = playCard(state, 'web', { color: 'blue' })
  assert.equal(missingTarget.needsChoice?.type, 'target', 'Web Swing should ask for a target after active color is chosen')

  const result = playCard(state, 'web', { color: 'blue', targetPlayerId: 'p3' }).state

  assert.equal(result.activeColor, 'blue', 'Web Swing should choose the next active color')
  assert.equal(result.activePlayerIndex, 1, 'turn should continue normally after Web Swing')
  assert.deepEqual(result.players[0].hand.map((entry) => entry.id).sort(), ['source-wild', 'target-high'], 'source should receive the target high-value card')
  assert.deepEqual(result.players[2].hand.map((entry) => entry.id).sort(), ['source-low', 'target-low'], 'target should receive the source low-value card')
  assert.equal(result.webSwingEvent?.sourcePlayerName, 'Player 1', 'Web Swing should publish an animation source player')
  assert.equal(result.webSwingEvent?.targetPlayerName, 'Player 3', 'Web Swing should publish an animation target player')
  assert.equal(result.webSwingEvent?.capturedCard.cardLabel, '+4', 'Web Swing animation should include the card swung from the target')
  assert.equal(result.webSwingEvent?.returnedCard.cardLabel, 'Yellow 1', 'Web Swing animation should include the returned card')

  const logText = result.log.map((entry) => entry.text).join('\n')
  assert.match(logText, /Web Swing: Player 1 sent Yellow 1 to Player 3\./, 'Web Swing should log the source-to-target card')
  assert.match(logText, /Web Swing: Player 3 sent \+4 to Player 1\./, 'Web Swing should log the target-to-source card')
}

{
  const appSource = readFileSync('src/App.tsx', 'utf8')
  const tmntIndex = appSource.indexOf("31: 'tmnt'")
  const spiderManIndex = appSource.indexOf("32: 'spiderman'")
  const dcIndex = appSource.indexOf("33: 'dc'")
  assert.ok(tmntIndex >= 0 && spiderManIndex > tmntIndex && dcIndex > spiderManIndex, 'UNO Spider-Man should sit between TMNT and UNO DC')
  assert.match(appSource, /game === 'spiderman' \? Math\.min\(currentConfig\.playerCount, 4\)/, 'UNO Spider-Man should be limited to 2-4 players in setup selection')
  assert.match(appSource, /playableGame && !isGuoExclusiveGame\(playableGame\) \? 'green-edition'/, 'UNO Spider-Man should inherit the shared green selection tile for non-Guo games')
}

console.log('UNO Spider-Man behavior tests passed')
