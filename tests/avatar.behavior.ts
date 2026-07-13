import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createConfig, createGame, playCard } from '../src/game/classic'
import { buildAvatarDeck } from '../src/game/deck'
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

function avatarState(): GameState {
  return {
    ...createGame(createConfig('avatar' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
      { id: 'p3', name: 'Player 3', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'magician', flexPowerActive: true },
      { id: 'p4', name: 'Player 4', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'builder', flexPowerActive: true },
    ],
    drawPile: [
      card('revealed-red-8', 'number', 'red', '8', 8, 8),
      card('revealed-yellow-skip', 'skip', 'yellow', 'Skip', 20),
      card('revealed-wild', 'wild', 'wild', 'Wild', 50),
    ],
    discardPile: [card('top', 'number', 'blue', '5', 5, 5)],
    activePlayerIndex: 0,
    activeColor: 'blue',
    direction: 1,
    pendingDraw: null,
    drewThisTurn: false,
    drawnCardIdThisTurn: null,
    winnerId: null,
    gameWinnerId: null,
  }
}

{
  const deck = buildAvatarDeck()

  assert.equal(deck.length, 112, 'UNO Avatar should use a 112-card playable deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wildAvatarState').length, 4, 'UNO Avatar should include four Avatar State cards')
  assert.equal(deck.filter((entry) => entry.kind === 'wildDraw4').length, 4, 'UNO Avatar should keep Wild +4 cards')
}

{
  const state = createGame(createConfig('avatar' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.players.every((player) => player.hand.length === 7), true, 'UNO Avatar should deal seven cards to each player')
  assert.equal([...state.players.flatMap((player) => player.hand), ...state.drawPile, ...state.discardPile].some((entry) => entry.kind === 'wildAvatarState'), true, 'created games should use the Avatar deck')
}

{
  const state = avatarState()
  state.players[0].hand = [
    card('avatar-state', 'wildAvatarState', 'wild', 'Avatar State', 50),
    card('source-keep', 'number', 'blue', '9', 9, 9),
  ]

  const result = playCard(state, 'avatar-state', { color: 'green' }).state

  assert.equal(result.activeColor, 'green', 'Avatar State should choose the next active color')
  assert.equal(result.activePlayerIndex, 1, 'turn should continue normally after Avatar State')
  assert.deepEqual(result.players[0].hand.map((entry) => entry.id).sort(), ['revealed-wild', 'source-keep'], 'source should keep the strongest revealed card')
  assert.equal(result.drawPile.some((entry) => entry.id === 'revealed-red-8'), true, 'unkept revealed cards should return to the draw pile')
  assert.equal(result.drawPile.some((entry) => entry.id === 'revealed-yellow-skip'), true, 'unkept revealed action cards should return to the draw pile')
  assert.equal(result.drawPile.some((entry) => entry.id === 'revealed-wild'), false, 'kept revealed card should leave the draw pile')
  assert.equal(result.avatarStateEvent?.sourcePlayerName, 'Player 1', 'Avatar State should publish an animation source player')
  assert.deepEqual(result.avatarStateEvent?.revealedCards.map((entry) => entry.cardLabel), ['Wild', 'Yellow Skip', 'Red 8'], 'Avatar State animation should include the three revealed cards in reveal order')
  assert.equal(result.avatarStateEvent?.keptCard.cardLabel, 'Wild', 'Avatar State animation should include the kept card')
  assert.deepEqual(result.avatarStateEvent?.returnedCards.map((entry) => entry.cardLabel), ['Yellow Skip', 'Red 8'], 'Avatar State animation should include returned cards')

  const logText = result.log.map((entry) => entry.text).join('\n')
  assert.match(logText, /Avatar State revealed: Wild, Yellow Skip, Red 8\./, 'Avatar State should log all revealed cards')
  assert.match(logText, /Player 1 kept Wild\./, 'Avatar State should log the kept card')
  assert.match(logText, /Yellow Skip and Red 8 returned to the draw pile\./, 'Avatar State should log returned cards')
}

{
  const appSource = readFileSync('src/App.tsx', 'utf8')
  const starTrekIndex = appSource.indexOf("34: 'starTrek'")
  const avatarIndex = appSource.indexOf("35: 'avatar'")
  const monsterHighIndex = appSource.indexOf("36: 'monsterHigh'")
  assert.ok(starTrekIndex >= 0 && avatarIndex > starTrekIndex && monsterHighIndex > avatarIndex, 'UNO Avatar should sit between UNO Star Trek and UNO Monster High')
  assert.match(appSource, /game === 'avatar' \? Math\.min\(currentConfig\.playerCount, 4\)/, 'UNO Avatar should be limited to 2-4 players in setup selection')
  assert.match(appSource, /playableGame && !isGuoExclusiveGame\(playableGame\) \? 'green-edition'/, 'UNO Avatar should inherit the shared green selection tile for non-Guo games')
}

console.log('UNO Avatar behavior tests passed')
