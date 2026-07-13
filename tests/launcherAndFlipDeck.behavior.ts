import assert from 'node:assert/strict'
import { createConfig, createGame, drawOne } from '../src/game/classic'
import { buildFlipDeck, buildFlipExtremeDeck } from '../src/game/deck'
import type { AddOnPack, Card, GameState, GameVariant } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function numberCard(id: string, value: number): Card {
  return { id, kind: 'number', color: 'red', label: String(value), points: value, value }
}

function launcherState(game: Extract<GameVariant, 'extreme' | 'flipExtreme'>): GameState {
  return {
    ...createGame(createConfig(game, 'hotseat', 2, 'medium', addOns)),
    players: [
      { id: 'p1', name: 'Player 1', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'explorer', flexPowerActive: true },
      { id: 'p2', name: 'Player 2', type: 'human', hand: [], score: 0, unoSafe: false, avatarId: 'teacher', flexPowerActive: true },
    ],
    drawPile: Array.from({ length: 12 }, (_, index) => numberCard(`draw-${index}`, index + 1)),
    discardPile: [numberCard('top', 5)],
    activePlayerIndex: 0,
    activeColor: 'red',
    direction: 1,
    flipSide: 'light',
    winnerId: null,
    gameWinnerId: null,
  }
}

function withRandom<T>(value: number, run: () => T): T {
  const original = Math.random
  Math.random = () => value
  try {
    return run()
  } finally {
    Math.random = original
  }
}

function assertDoubleSidedNumbersDiffer(deckName: string, deck: Card[]) {
  const matchingNumberFaces = deck.filter((card) => card.flipFaces?.light.kind === 'number' && card.flipFaces.dark.kind === 'number')
  assert.ok(matchingNumberFaces.length > 0, `${deckName} should contain double-sided number cards`)

  for (const card of matchingNumberFaces) {
    assert.notEqual(
      card.flipFaces?.light.value,
      card.flipFaces?.dark.value,
      `${deckName} card ${card.id} should not have the same number on both sides`,
    )
  }
}

{
  assertDoubleSidedNumbersDiffer('Uno Flip', buildFlipDeck())
  assertDoubleSidedNumbersDiffer('Uno Flip Extreme', buildFlipExtremeDeck())
}

{
  const noFire = withRandom(0.29, () => drawOne(launcherState('extreme')))
  assert.equal(noFire.launcherEvent?.cardsFired, 0, 'launcher rolls below 30% should fire no cards')

  const twoCards = withRandom(0.35, () => drawOne(launcherState('extreme')))
  assert.equal(twoCards.launcherEvent?.cardsFired, 2, 'launcher rolls from 30% to 62% should fire 2 cards')

  const threeCards = withRandom(0.625, () => drawOne(launcherState('extreme')))
  assert.equal(threeCards.launcherEvent?.cardsFired, 3, 'launcher rolls from 62% to 93% should fire 3 cards')

  const fourCards = withRandom(0.95, () => drawOne(launcherState('extreme')))
  assert.equal(fourCards.launcherEvent?.cardsFired, 4, 'launcher rolls from 93% upward should fire 4 cards')

  const flipExtreme = withRandom(0.925, () => drawOne(launcherState('flipExtreme')))
  assert.equal(flipExtreme.launcherEvent?.cardsFired, 3, 'Uno Flip Extreme should share the launcher probabilities')
}

console.log('Launcher and Flip deck behavior tests passed')
