import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildMastersOfTheUniverseDeck } from '../src/game/deck'
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

function motuState(): GameState {
  return {
    ...createGame(createConfig('motu' as GameVariant, 'hotseat', 4, 'medium', addOns)),
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
  const deck = buildMastersOfTheUniverseDeck()

  assert.equal(deck.length, 112, 'UNO Masters of the Universe should use a 112-card playable deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildPowerOfGrayskull').length, 4, 'MOTU should include four Power of Grayskull cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'MOTU should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('motu' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'MOTU should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildPowerOfGrayskull'), true, 'created games should use the MOTU deck')
}

{
  const state = motuState()
  state.players[0].hand = [
    card('power', 'wildPowerOfGrayskull', 'wild', 'Power of Grayskull', 50),
    card('green-7', 'number', 'green', '7', 7, 7),
    card('red-9', 'number', 'red', '9', 9, 9),
  ]

  const result = playCard(state, 'power', { color: 'green' }).state

  assert.equal(result.activeColor, 'green', 'Power of Grayskull should choose the next active color')
  assert.equal(result.activePlayerIndex, 0, 'player should keep the turn when they still hold the chosen color')
  assert.equal(result.players[0].hand.length, 2, 'the source player should discard only Power of Grayskull before the bonus play')
}

{
  const state = motuState()
  state.players[0].hand = [
    card('power', 'wildPowerOfGrayskull', 'wild', 'Power of Grayskull', 50),
    card('red-9', 'number', 'red', '9', 9, 9),
  ]

  const result = playCard(state, 'power', { color: 'green' }).state

  assert.equal(result.activeColor, 'green', 'Power of Grayskull should still choose the next active color')
  assert.equal(result.activePlayerIndex, 1, 'turn should advance normally when no chosen-color follow-up remains')
}

{
  const appSource = readFileSync('src/App.tsx', 'utf8')
  const playableBlock = appSource.match(/const playableGames:[\s\S]*?\n}/)?.[0] ?? ''
  const playableGames = [...playableBlock.matchAll(/:\s*'([^']+)'/g)].map((match) => match[1])
  const barbieIndex = playableGames.indexOf('barbie')
  const motuIndex = playableGames.indexOf('motu')
  const skyjoIndex = playableGames.indexOf('skyjo')
  assert.ok(barbieIndex >= 0 && motuIndex > barbieIndex && skyjoIndex > motuIndex, 'MOTU should sit between Barbie and Skyjo')
  assert.match(appSource, /game === 'motu' \? Math\.min\(currentConfig\.playerCount, 4\)/, 'MOTU should be limited to 2-4 players in setup selection')
  assert.match(appSource, /playableGame && !isGuoExclusiveGame\(playableGame\) \? 'green-edition'/, 'MOTU should inherit the shared green selection tile for non-Guo games')
}

console.log('UNO Masters of the Universe behavior tests passed')
