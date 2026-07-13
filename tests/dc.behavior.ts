import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildDcDeck } from '../src/game/deck'
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

function dcState(): GameState {
  return {
    ...createGame(createConfig('dc' as GameVariant, 'hotseat', 4, 'medium', addOns)),
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
  const deck = buildDcDeck()

  assert.equal(deck.length, 112, 'UNO DC should use a 112-card playable deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildJusticeLeague').length, 4, 'UNO DC should include four Justice League cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO DC should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('dc' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO DC should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildJusticeLeague'), true, 'created games should use the DC deck')
}

{
  const state = dcState()
  state.players[0].hand = [
    card('justice', 'wildJusticeLeague', 'wild', 'Justice League', 50),
    card('source-return', 'number', 'green', '1', 1, 1),
    card('source-keep', 'number', 'red', '9', 9, 9),
  ]
  state.players[1].hand = [card('p2-reveal', 'number', 'yellow', '8', 8, 8), card('p2-keep', 'number', 'blue', '2', 2, 2)]
  state.players[2].hand = [card('target-capture', 'wildDraw4', 'wild', '+4', 50), card('target-keep', 'number', 'green', '3', 3, 3)]
  state.players[3].hand = [card('p4-reveal', 'skip', 'red', 'Skip', 20), card('p4-keep', 'number', 'red', '4', 4, 4)]

  const result = playCard(state, 'justice', { color: 'blue' }).state

  assert.equal(result.activeColor, 'blue', 'Justice League should choose the next active color')
  assert.equal(result.activePlayerIndex, 1, 'turn should continue normally after Justice League')
  assert.deepEqual(result.players[0].hand.map((entry) => entry.id).sort(), ['source-keep', 'target-capture'], 'source should capture the strongest revealed card and return a low card')
  assert.deepEqual(result.players[2].hand.map((entry) => entry.id).sort(), ['source-return', 'target-keep'], 'target should lose the captured card and receive the return card')
  assert.deepEqual(result.players[1].hand.map((entry) => entry.id).sort(), ['p2-keep', 'p2-reveal'], 'other revealed hands should stay unchanged')
  assert.deepEqual(result.players[3].hand.map((entry) => entry.id).sort(), ['p4-keep', 'p4-reveal'], 'other revealed hands should stay unchanged')
  assert.equal(result.justiceLeagueEvent?.sourcePlayerName, 'Player 1', 'Justice League should publish an animation source player')
  assert.equal(result.justiceLeagueEvent?.targetPlayerName, 'Player 3', 'Justice League should publish an animation target player')
  assert.deepEqual(result.justiceLeagueEvent?.revealedCards.map((entry) => `${entry.playerName}:${entry.cardLabel}`), ['Player 2:Yellow 8', 'Player 3:+4', 'Player 4:Red Skip'], 'Justice League animation should include all revealed cards')
  assert.equal(result.justiceLeagueEvent?.capturedCard.cardLabel, '+4', 'Justice League animation should include the captured card')
  assert.equal(result.justiceLeagueEvent?.returnedCard?.cardLabel, 'Green 1', 'Justice League animation should include the returned card')

  const logText = result.log.map((entry) => entry.text).join('\n')
  assert.match(logText, /Justice League: Player 2 revealed Yellow 8\./, 'Justice League should log Player 2 revealed card')
  assert.match(logText, /Justice League: Player 3 revealed \+4\./, 'Justice League should log Player 3 revealed card')
  assert.match(logText, /Justice League: Player 4 revealed Red Skip\./, 'Justice League should log Player 4 revealed card')
  assert.match(logText, /Justice League: Player 1 captured \+4 from Player 3\./, 'Justice League should log the captured card')
  assert.match(logText, /Justice League: Player 1 returned Green 1 to Player 3\./, 'Justice League should log the returned card')
}

{
  const appSource = readFileSync('src/App.tsx', 'utf8')
  const spiderManIndex = appSource.indexOf("32: 'spiderman'")
  const dcIndex = appSource.indexOf("33: 'dc'")
  const starTrekIndex = appSource.indexOf("34: 'starTrek'")
  assert.ok(spiderManIndex >= 0 && dcIndex > spiderManIndex && starTrekIndex > dcIndex, 'UNO DC should sit between Spider-Man and UNO Star Trek')
  assert.match(appSource, /game === 'dc' \? Math\.min\(currentConfig\.playerCount, 4\)/, 'UNO DC should be limited to 2-4 players in setup selection')
  assert.match(appSource, /playableGame && !isGuoExclusiveGame\(playableGame\) \? 'green-edition'/, 'UNO DC should inherit the shared green selection tile for non-Guo games')
}

console.log('UNO DC behavior tests passed')
