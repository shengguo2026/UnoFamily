import assert from 'node:assert/strict'
import { createConfig, createGame, drawOne, phase10CompletePhase, phase10Discard, phase10HitCard, phase10HitCards, phase10TakeDiscard, startNextRound } from '../src/game/classic'
import { buildPhase10Deck } from '../src/game/deck'
import type { AddOnPack, Card, GameState, GameVariant, UnoColor } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function numberCard(id: string, value: number, color: UnoColor = 'red'): Card {
  return { id, kind: 'number', color, label: String(value), points: value >= 10 ? 10 : 5, value }
}

function wild(id: string): Card {
  return { id, kind: 'wild', color: 'wild', label: 'Wild', points: 25 }
}

function phase10State(): GameState {
  const state = createGame(createConfig('phase10' as GameVariant, 'hotseat', 4, 'medium', addOns))
  state.players[0].hand = [
    numberCard('r3a', 3, 'red'),
    numberCard('b3b', 3, 'blue'),
    wild('wild3'),
    numberCard('r7a', 7, 'red'),
    numberCard('g7b', 7, 'green'),
    numberCard('y7c', 7, 'yellow'),
    numberCard('extra', 12, 'blue'),
  ]
  state.players[1].hand = [numberCard('p2-10', 10), numberCard('p2-11', 11)]
  state.players[2].hand = [numberCard('p3-9', 9)]
  state.players[3].hand = [numberCard('p4-4', 4)]
  state.drawPile = [numberCard('drawn', 5, 'green')]
  state.discardPile = [numberCard('discard', 6, 'yellow')]
  state.activePlayerIndex = 0
  state.drewThisTurn = true
  return state
}

{
  const deck = buildPhase10Deck()

  assert.equal(deck.length, 108, 'Phase 10 should use a 108-card deck')
  assert.equal(deck.filter((entry) => entry.kind === 'wild').length, 8, 'Phase 10 should include eight Wild cards')
  assert.equal(deck.filter((entry) => entry.kind === 'skip').length, 4, 'Phase 10 should include four Skip cards')
  assert.equal(deck.filter((entry) => entry.kind === 'number' && entry.value === 1).length, 8, 'Phase 10 should include eight of each number')
  assert.equal(deck.filter((entry) => entry.kind === 'number' && entry.value === 12).length, 8, 'Phase 10 should include eight of each number')
}

{
  const state = createGame(createConfig('phase10' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.config.game, 'phase10')
  assert.equal(state.targetScore, 10, 'Phase 10 sessions track completion through phase 10')
  assert.equal(state.players[0].hand.length, 10, 'Phase 10 deals ten cards to each player')
  assert.equal(state.players[0].phase10Phase, 1, 'players start on phase 1')
  assert.equal(state.players[0].phase10Completed, false, 'players have not completed the phase at setup')
  assert.equal(state.discardPile.length, 1, 'Phase 10 starts with one discard')
}

{
  const state = phase10State()
  const completed = phase10CompletePhase(state)

  assert.equal(completed.players[0].phase10Completed, true, 'a valid two-sets-of-three hand completes phase 1')
  assert.equal(completed.players[0].hand.length, 1, 'the phase cards should leave the hand')
  assert.equal(completed.players[0].hand[0].id, 'extra', 'non-phase cards should remain in hand')
}

{
  const state = phase10State()
  state.drewThisTurn = false

  const rejected = phase10CompletePhase(state)
  assert.equal(rejected.players[0].phase10Completed, false, 'Phase 10 phases cannot be laid before drawing')

  const afterDraw = drawOne(state)
  assert.equal(afterDraw.players[0].hand.some((entry) => entry.id === 'drawn'), true, 'drawing adds one card to the Phase 10 hand')
  assert.equal(afterDraw.activePlayerIndex, 0, 'drawing in Phase 10 does not pass the turn')
  assert.equal(afterDraw.drewThisTurn, true, 'drawing opens the lay/discard step')
}

{
  const state = phase10State()
  state.players[0].hand = [
    numberCard('blue10a', 10, 'blue'),
    numberCard('green1', 1, 'green'),
    numberCard('red7', 7, 'red'),
    wild('wildAny'),
    numberCard('yellow4', 4, 'yellow'),
    numberCard('red10b', 10, 'red'),
    numberCard('red10c', 10, 'red'),
    numberCard('yellow2a', 2, 'yellow'),
    numberCard('yellow11', 11, 'yellow'),
    numberCard('blue2b', 2, 'blue'),
  ]
  state.drawPile = [numberCard('drawStep', 6, 'green')]
  state.drewThisTurn = false

  assert.equal(phase10CompletePhase(state).players[0].phase10Completed, false, 'the screenshot hand cannot be laid before the mandatory draw step')

  const completed = phase10CompletePhase(drawOne(state))
  assert.equal(completed.players[0].phase10Completed, true, 'three 10s plus two 2s and a Wild complete phase 1 after drawing')
  assert.equal(completed.players[0].hand.some((entry) => entry.id === 'drawStep'), true, 'the drawn card remains available after laying the phase')
}

{
  const state = phase10State()
  state.players[0].phase10Phase = 2
  state.players[0].hand = [
    numberCard('set4a', 4, 'red'),
    numberCard('set4b', 4, 'blue'),
    numberCard('set4c', 4, 'yellow'),
    numberCard('run1', 1, 'red'),
    numberCard('run2', 2, 'green'),
    numberCard('run3', 3, 'blue'),
    numberCard('run4', 4, 'green'),
    numberCard('extra9', 9, 'yellow'),
  ]
  state.drewThisTurn = true

  const completed = phase10CompletePhase(state)
  assert.equal(completed.players[0].phase10Completed, true, 'phase detection should backtrack when a set candidate also belongs to the needed run')
  assert.deepEqual(completed.players[0].hand.map((entry) => entry.id), ['extra9'], 'phase 2 should lay the three 4s set and 1-4 run without consuming the wrong 4')
}

{
  const state = phase10State()
  state.players[0].phase10Phase = 3
  state.players[0].hand = [
    wild('wildAny'),
    numberCard('green5', 5, 'green'),
    numberCard('yellow8a', 8, 'yellow'),
    numberCard('yellow11', 11, 'yellow'),
    numberCard('red3', 3, 'red'),
    numberCard('green7', 7, 'green'),
    numberCard('yellow9', 9, 'yellow'),
    numberCard('green8b', 8, 'green'),
    numberCard('yellow6', 6, 'yellow'),
    numberCard('green4', 4, 'green'),
    numberCard('yellow4', 4, 'yellow'),
  ]
  state.drewThisTurn = true

  const rejected = phase10CompletePhase(state)
  assert.equal(rejected.players[0].phase10Completed, false, 'phase 3 needs a four-card same-number set plus a separate run of 4')
}

{
  const state = phase10State()
  state.players[0].phase10Phase = 3
  state.players[0].hand = [
    wild('wildSet4'),
    numberCard('red4a', 4, 'red'),
    numberCard('blue4b', 4, 'blue'),
    numberCard('yellow4c', 4, 'yellow'),
    numberCard('green5', 5, 'green'),
    numberCard('yellow6', 6, 'yellow'),
    numberCard('green7', 7, 'green'),
    numberCard('yellow8', 8, 'yellow'),
    numberCard('extra11', 11, 'yellow'),
  ]
  state.drewThisTurn = true

  const completed = phase10CompletePhase(state)
  assert.equal(completed.players[0].phase10Completed, true, 'phase 3 can use three matching numbers plus a Wild for the set and 5-8 for the run')
  assert.deepEqual(completed.players[0].hand.map((entry) => entry.id), ['extra11'], 'phase 3 should leave only cards outside the set and run')
}

{
  const state = phase10State()
  state.drewThisTurn = false
  const afterTake = phase10TakeDiscard(state)

  assert.equal(afterTake.players[0].hand.some((entry) => entry.id === 'discard'), true, 'Phase 10 players may take the top discard as their draw')
  assert.equal(afterTake.discardPile.length, 0, 'taking discard removes it from the pile')
  assert.equal(afterTake.drewThisTurn, true, 'taking discard opens the lay/discard step')
}

{
  const completed = phase10CompletePhase(phase10State())
  completed.players[0].hand = [numberCard('hit7', 7, 'blue')]
  const hit = phase10HitCard({ ...completed, drewThisTurn: true }, 'hit7')
  assert.equal(hit.players[0].hand.length, 0, 'after laying a phase, matching remaining cards can be hit to go out')
  assert.equal(hit.winnerId, 'p1', 'hitting the last card after completing a phase ends the round')
}

{
  const completed = phase10CompletePhase(phase10State())
  completed.players[0].hand = [numberCard('hit7', 7, 'blue'), numberCard('miss12', 12, 'blue')]
  const hits = phase10HitCards({ ...completed, drewThisTurn: true }, 'p1')

  assert.deepEqual(hits.map((card) => card.id), ['hit7'], 'after laying a phase, the UI can show which remaining cards may be hit')
}

{
  const completed = phase10CompletePhase(phase10State())
  completed.players[0].hand = [wild('wildHit')]
  const hitsBeforeDraw = phase10HitCards({ ...completed, drewThisTurn: false }, 'p1')

  assert.deepEqual(hitsBeforeDraw, [], 'after laying a phase, hit cards should not be advertised before the mandatory draw or take-discard step')
}

{
  const completed = phase10CompletePhase(phase10State())
  const finished = phase10Discard(completed, 'extra')

  assert.equal(finished.winnerId, 'p1', 'discarding the last card after completing a phase ends the round')
  assert.equal(finished.players[0].phase10Phase, 2, 'a player who completed the phase advances to the next phase')
  assert.equal(finished.players[1].score, 20, 'remaining cards score against opponents')

  const nextRound = startNextRound(finished)
  assert.equal(nextRound.currentRound, 2, 'Phase 10 starts a new round after someone goes out')
  assert.equal(nextRound.players[0].phase10Phase, 2, 'the completed player starts the next round on phase 2')
  assert.equal(nextRound.players[0].phase10Completed, false, 'the next round should require completing the new phase')
  assert.equal(nextRound.players[0].hand.length, 10, 'the next phase starts with a fresh ten-card hand')
}

console.log('Phase 10 behavior tests passed')
