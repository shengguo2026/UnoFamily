import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createConfig, createGame, passagePairWithCard, passagePassCard, passageSkipPair, passageTakeCard, playableCards } from '../src/game/classic'
import { recommendMove } from '../src/game/recommendation'
import type { AddOnPack, Card, GameState, GameVariant, UnoColor } from '../src/game/types'
import { playableReason } from '../src/i18n'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function card(id: string, kind: Card['kind'], color: UnoColor | 'wild', label: string, points: number, value?: number): Card {
  return { id, kind, color, label, points, value }
}

function baseState(matchMode: 'number' | 'color' | 'both' = 'number'): GameState {
  const state = createGame(createConfig('guoPassage' as GameVariant, 'hotseat', 4, 'medium', addOns, 7, 200, 2, 0, false, 'easy', matchMode, 2))
  return {
    ...state,
    drawPile: [card('draw-9', 'number', 'green', '9', 9, 9)],
    passageFaceUp: card('face-2', 'number', 'green', '2', 2, 2),
    passageSlot: card('slot-7', 'number', 'red', '7', 7, 7),
    passageTurn: { phase: 'take', takenCard: null, source: null },
    passageDiscardPile: [],
    players: state.players.map((player, index) => index === 0
      ? {
          ...player,
          hand: [
            card('yellow-2', 'number', 'yellow', '2', 2, 2),
            card('red-5', 'number', 'red', '5', 5, 5),
            card('wild', 'wild', 'wild', 'Wild', 0),
          ],
          passagePairs: [],
        }
      : { ...player, passagePairs: [] }),
  }
}

{
  const state = createGame(createConfig('guoPassage' as GameVariant, 'hotseat', 4, 'medium', addOns, 7, 200))
  const totalCards = state.players.reduce((sum, player) => sum + player.hand.length, 0) +
    state.drawPile.length +
    (state.passageFaceUp ? 1 : 0) +
    (state.passageSlot ? 1 : 0)
  assert.equal(totalCards, 76, 'Passage deck should contain 72 number cards plus 4 Wild cards')
  assert.equal(state.passageSlot, null, 'Passage slot should start empty at the beginning of a round')
  assert.equal(passageTakeCard(state, 'passage'), state, 'first player should not be able to take from an empty Passage slot')
  assert.equal(state.drawPile.some((entry) => entry.kind !== 'number' && entry.kind !== 'wild'), false, 'Passage should not include action cards')
  assert.equal(state.drawPile.some((entry) => entry.value === 0), false, 'Passage should not include 0 cards')
  assert.doesNotThrow(() => recommendMove(state), 'Passage recommendation should not require a discard top card')
  assert.doesNotThrow(() => playableReason('en', state.players[0].hand[0], state), 'Passage tooltip text should not require a discard top card')
}

{
  const state = passageTakeCard(baseState('number'), 'faceUp')
  assert.equal(state.passageTurn?.phase, 'pair')
  assert.equal(playableCards(state.players[0], state).map((entry) => entry.id).includes('yellow-2'), true, 'number mode should highlight same-number pair')
  const paired = passagePairWithCard(state, 'yellow-2')
  assert.equal(paired.players[0].score, 4, 'Yellow 2 plus Green 2 should score 4')
  assert.equal(paired.players[0].passagePairs?.[0]?.score, 4)
  assert.equal(paired.passageTurn?.phase, 'pass')
  const passed = passagePassCard(paired, 'red-5', false)
  assert.equal(passed.passageFaceUp?.id, 'red-5', 'face-up pass should replace the face-up pile')
  assert.equal(passed.activePlayerIndex, 1, 'passing should advance the turn')
}

{
  const state = passageTakeCard(baseState('both'), 'faceUp')
  assert.equal(playableCards(state.players[0], state).some((entry) => entry.id === 'yellow-2'), false, 'exact mode should reject same number in a different color')
  assert.equal(playableCards(state.players[0], state).some((entry) => entry.id === 'wild'), true, 'Wild should work as exact pair helper')
  const paired = passagePairWithCard(state, 'wild')
  assert.equal(paired.players[0].score, 4, 'Wild paired with 2 should declare value 2 and score 4')
}

{
  const skipped = passageSkipPair(passageTakeCard(baseState('color'), 'draw'))
  assert.equal(skipped.passageTurn?.phase, 'pass')
  assert.equal(skipped.players[0].hand.some((entry) => entry.id === 'draw-9'), true, 'skipped taken card should join the hand')
}

{
  const state = {
    ...baseState('number'),
    passageTurn: { phase: 'pass' as const, takenCard: null, source: null },
    players: baseState('number').players.map((player, index) => index === 0 ? { ...player, hand: [card('only-3', 'number', 'blue', '3', 3, 3)], score: 12, passagePairs: [] } : player),
  }
  const finished = passagePassCard(state, 'only-3', true)
  assert.equal(finished.winnerId, 'p1')
  assert.equal(finished.players[0].score, 22, 'emptying the hand should add a 10 point quickest-run bonus')
}

console.log("Guo's Exclusive Uno Passage behavior tests passed")

const appSource = readFileSync('src/App.tsx', 'utf8')
const cssSource = readFileSync('src/App.css', 'utf8')
const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')
assert.match(appSource, /const passagePassPlayerId[\s\S]*const canvasPassModePlayerId = teamPassPlayerId \?\? passagePassPlayerId/, 'Passage pass mode should be wired into the canvas hand click mode')
assert.match(cssSource, /\.passage-actions button[\s\S]*font-size:\s*11/, 'Passage action buttons should have compact phone sizing')
assert.match(canvasSource, /count:\s*state\.drawPile\.length[\s\S]*drawFittedText\(ctx, String\(entry\.count\)/, 'Passage center slots should display card counts above each slot')
