import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildStarTrekDeck } from '../src/game/deck'
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

function starTrekState(): GameState {
  return {
    ...createGame(createConfig('starTrek' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('draw-2', 'number', 'blue', '2', 2, 2),
      card('draw-3', 'number', 'yellow', '3', 3, 3),
      card('replacement', 'number', 'green', '1', 1, 1),
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
  const deck = buildStarTrekDeck()

  assert.equal(deck.length, 112, 'UNO Star Trek should use a 112-card playable deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildBeamMeUp').length, 4, 'UNO Star Trek should include four Beam Me Up cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Star Trek should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('starTrek' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Star Trek should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildBeamMeUp'), true, 'created games should use the Star Trek deck')
}

{
  const state = starTrekState()
  state.players[0].hand = [
    card('beam', 'wildBeamMeUp', 'wild', 'Beam Me Up', 50),
    card('source-keep', 'number', 'red', '9', 9, 9),
  ]
  state.players[2].hand = [
    card('target-low', 'number', 'green', '2', 2, 2),
    card('target-beamed', 'wildDraw4', 'wild', '+4', 50),
  ]

  const missingTarget = playCard(state, 'beam', { color: 'blue' })
  assert.equal(missingTarget.needsChoice?.type, 'target', 'Beam Me Up should ask for a target after active color is chosen')

  const result = playCard(state, 'beam', { color: 'blue', targetPlayerId: 'p3' }).state

  assert.equal(result.activeColor, 'blue', 'Beam Me Up should choose the next active color')
  assert.equal(result.activePlayerIndex, 1, 'turn should continue normally after Beam Me Up')
  assert.deepEqual(result.players[2].hand.map((entry) => entry.id).sort(), ['replacement', 'target-low'], 'target should lose the strongest card and draw one replacement')
  assert.equal(result.drawPile.some((entry) => entry.id === 'target-beamed'), true, 'beamed card should be returned to the draw pile')
  assert.equal(result.drawPile.some((entry) => entry.id === 'replacement'), false, 'replacement card should be drawn by the target')
  assert.equal(result.beamMeUpEvent?.sourcePlayerName, 'Player 1', 'Beam Me Up should publish an animation source player')
  assert.equal(result.beamMeUpEvent?.targetPlayerName, 'Player 3', 'Beam Me Up should publish an animation target player')
  assert.equal(result.beamMeUpEvent?.beamedCard.cardLabel, '+4', 'Beam Me Up animation should include the beamed card')
  assert.equal(result.beamMeUpEvent?.replacementCard?.cardLabel, 'Green 1', 'Beam Me Up animation should include the replacement card')

  const logText = result.log.map((entry) => entry.text).join('\n')
  assert.match(logText, /Beam Me Up: Player 3 revealed \+4\./, 'Beam Me Up should log the revealed card')
  assert.match(logText, /Beam Me Up: \+4 was beamed into the draw pile\./, 'Beam Me Up should log the beamed card')
  assert.match(logText, /Player 3 drew the replacement card Green 1\./, 'Beam Me Up should log the named replacement card')
}

{
  const appSource = readFileSync('src/App.tsx', 'utf8')
  const dcIndex = appSource.indexOf("33: 'dc'")
  const starTrekIndex = appSource.indexOf("34: 'starTrek'")
  const avatarIndex = appSource.indexOf("35: 'avatar'")
  assert.ok(dcIndex >= 0 && starTrekIndex > dcIndex && avatarIndex > starTrekIndex, 'UNO Star Trek should sit between UNO DC and UNO Avatar')
  assert.match(appSource, /game === 'starTrek' \? Math\.min\(currentConfig\.playerCount, 4\)/, 'UNO Star Trek should be limited to 2-4 players in setup selection')
  assert.match(appSource, /playableGame && !isGuoExclusiveGame\(playableGame\) \? 'green-edition'/, 'UNO Star Trek should inherit the shared green selection tile for non-Guo games')
}

console.log('UNO Star Trek behavior tests passed')
