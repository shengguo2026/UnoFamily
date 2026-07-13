import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildMonsterHighDeck } from '../src/game/deck'
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

function monsterHighState(): GameState {
  return {
    ...createGame(createConfig('monsterHigh' as GameVariant, 'hotseat', 4, 'medium', addOns)),
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
  const deck = buildMonsterHighDeck()

  assert.equal(deck.length, 112, 'UNO Monster High should use a 112-card playable deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildCreepyCool').length, 4, 'UNO Monster High should include four Creepy Cool cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Monster High should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('monsterHigh' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Monster High should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildCreepyCool'), true, 'created games should use the Monster High deck')
}

{
  const state = monsterHighState()
  state.players[0].hand = [
    card('creepy', 'wildCreepyCool', 'wild', 'Creepy Cool', 50),
    card('source-keep', 'number', 'green', '9', 9, 9),
  ]
  state.players[1].hand = [card('p2-blue', 'number', 'blue', '7', 7, 7)]
  state.players[2].hand = [card('p3-red-skip', 'skip', 'red', 'Skip', 20)]
  state.players[3].hand = [card('p4-blue', 'number', 'blue', '2', 2, 2)]

  const result = playCard(state, 'creepy', { color: 'blue' }).state

  assert.equal(result.activeColor, 'blue', 'Creepy Cool should choose the next active color')
  assert.equal(result.activePlayerIndex, 1, 'turn should continue normally after Creepy Cool')
  assert.deepEqual(result.players[1].hand.map((entry) => entry.id), [], 'matching revealed card should be discarded from AI 2')
  assert.deepEqual(result.players[2].hand.map((entry) => entry.id), ['p3-red-skip'], 'non-matching revealed card should stay with AI 3')
  assert.deepEqual(result.players[3].hand.map((entry) => entry.id), [], 'matching revealed card should be discarded from AI 4')
  assert.deepEqual(result.discardPile.map((entry) => entry.id).slice(-2), ['p2-blue', 'p4-blue'], 'matching revealed cards should go to the discard pile')
  assert.equal(result.creepyCoolEvent?.sourcePlayerName, 'Player 1', 'Creepy Cool should publish an animation source player')
  assert.deepEqual(
    result.creepyCoolEvent?.revealedCards.map((entry) => `${entry.playerName}:${entry.cardLabel}:${entry.discarded ? 'discarded' : 'kept'}`),
    ['AI 2:Blue 7:discarded', 'AI 3:Red Skip:kept', 'AI 4:Blue 2:discarded'],
    'Creepy Cool animation should include each reveal and result',
  )

  const logText = result.log.map((entry) => entry.text).join('\n')
  assert.match(logText, /Creepy Cool: AI 2 revealed Blue 7 and discarded it\./, 'Creepy Cool should log discarded matching cards')
  assert.match(logText, /Creepy Cool: AI 3 revealed Red Skip and kept it\./, 'Creepy Cool should log kept non-matching cards')
  assert.match(logText, /Creepy Cool: AI 4 revealed Blue 2 and discarded it\./, 'Creepy Cool should log all opponents')
}

{
  const appSource = readFileSync('src/App.tsx', 'utf8')
  const avatarIndex = appSource.indexOf("35: 'avatar'")
  const monsterHighIndex = appSource.indexOf("36: 'monsterHigh'")
  const nflIndex = appSource.indexOf("37: 'nfl'")
  assert.ok(avatarIndex >= 0 && monsterHighIndex > avatarIndex && nflIndex > monsterHighIndex, 'UNO Monster High should sit between UNO Avatar and UNO NFL')
  assert.match(appSource, /game === 'monsterHigh' \? Math\.min\(currentConfig\.playerCount, 4\)/, 'UNO Monster High should be limited to 2-4 players in setup selection')
  assert.match(appSource, /playableGame && !isGuoExclusiveGame\(playableGame\) \? 'green-edition'/, 'UNO Monster High should inherit the shared green selection tile for non-Guo games')
}

console.log('UNO Monster High behavior tests passed')
