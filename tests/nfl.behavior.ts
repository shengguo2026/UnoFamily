import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildNflDeck } from '../src/game/deck'
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

function nflState(): GameState {
  return {
    ...createGame(createConfig('nfl' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'AI 2', type: 'ai', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'AI 3', type: 'ai', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'AI 4', type: 'ai', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [],
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
  const deck = buildNflDeck()

  assert.equal(deck.length, 112, 'UNO NFL should use a 112-card playable deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildTouchdown').length, 4, 'UNO NFL should include four Touchdown cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO NFL should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('nfl' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO NFL should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildTouchdown'), true, 'created games should use the NFL deck')
}

{
  const state = nflState()
  state.players[0].hand = [
    card('touchdown', 'wildTouchdown', 'wild', 'Touchdown', 50),
    card('source-keep', 'number', 'green', '9', 9, 9),
  ]
  state.drawPile = [
    card('penalty-1', 'number', 'red', '1', 1, 1),
    card('penalty-2', 'number', 'yellow', '2', 2, 2),
    card('penalty-3', 'number', 'blue', '3', 3, 3),
    card('penalty-4', 'number', 'green', '4', 4, 4),
    card('drive-green', 'number', 'green', '8', 8, 8),
  ]

  const missingTarget = playCard(state, 'touchdown', { color: 'green' })
  assert.equal(missingTarget.needsChoice?.type, 'target', 'Touchdown should ask for a target after active color is chosen')

  const result = playCard(state, 'touchdown', { color: 'green', targetPlayerId: 'p2' }).state

  assert.equal(result.activeColor, 'green', 'Touchdown should choose the next active color')
  assert.equal(result.activePlayerIndex, 2, 'successful Touchdown should skip the next-player target')
  assert.equal(result.players[1].hand.length, 4, 'target should draw 4 on a successful drive')
  assert.equal(result.drawPile[0].id, 'drive-green', 'revealed drive card should return to the bottom of the draw pile')
  assert.equal(result.touchdownEvent?.sourcePlayerName, 'Player 1', 'Touchdown should publish an animation source player')
  assert.equal(result.touchdownEvent?.targetPlayerName, 'AI 2', 'Touchdown should publish an animation target player')
  assert.equal(result.touchdownEvent?.revealedCard.cardLabel, 'Green 8', 'Touchdown animation should include the drive card')
  assert.equal(result.touchdownEvent?.success, true, 'Touchdown animation should include success result')
  assert.equal(result.touchdownEvent?.cardsDrawn, 4, 'Touchdown animation should include draw count')

  const logText = result.log.map((entry) => entry.text).join('\n')
  assert.match(logText, /Touchdown drive revealed Green 8\./, 'Touchdown should log the drive card')
  assert.match(logText, /Touchdown! AI 2 drew 4 and lost the turn\./, 'Touchdown should log the successful penalty')
}

{
  const state = nflState()
  state.players[0].hand = [
    card('touchdown', 'wildTouchdown', 'wild', 'Touchdown', 50),
    card('source-keep', 'number', 'green', '9', 9, 9),
  ]
  state.drawPile = [
    card('draw-1', 'number', 'red', '1', 1, 1),
    card('drive-red', 'number', 'red', '2', 2, 2),
  ]

  const result = playCard(state, 'touchdown', { color: 'green', targetPlayerId: 'p2' }).state

  assert.equal(result.activeColor, 'green', 'Touchdown miss should still choose the next active color')
  assert.equal(result.activePlayerIndex, 1, 'missed Touchdown should advance normally')
  assert.equal(result.players[1].hand.length, 0, 'target should not draw on a missed drive')
  assert.equal(result.drawPile[0].id, 'drive-red', 'missed drive card should return to the bottom of the draw pile')
  assert.equal(result.touchdownEvent?.success, false, 'Touchdown animation should include miss result')

  const logText = result.log.map((entry) => entry.text).join('\n')
  assert.match(logText, /Touchdown drive revealed Red 2\./, 'Touchdown miss should log the drive card')
  assert.match(logText, /Touchdown missed\. No penalty was applied\./, 'Touchdown should log the missed drive')
}

{
  const appSource = readFileSync('src/App.tsx', 'utf8')
  const monsterHighIndex = appSource.indexOf("36: 'monsterHigh'")
  const nflIndex = appSource.indexOf("37: 'nfl'")
  const skyjoIndex = appSource.indexOf("38: 'skyjo'")
  assert.ok(monsterHighIndex >= 0 && nflIndex > monsterHighIndex && skyjoIndex > nflIndex, 'UNO NFL should sit between UNO Monster High and Skyjo')
  assert.match(appSource, /game === 'nfl' \? Math\.min\(currentConfig\.playerCount, 4\)/, 'UNO NFL should be limited to 2-4 players in setup selection')
  assert.match(appSource, /playableGame && !isGuoExclusiveGame\(playableGame\) \? 'green-edition'/, 'UNO NFL should inherit the shared green selection tile for non-Guo games')
}

console.log('UNO NFL behavior tests passed')
