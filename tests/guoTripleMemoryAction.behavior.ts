import assert from 'node:assert/strict'
import { createConfig, createGame, memoryResolvePending, memorySelectSlot } from '../src/game/classic'
import type { AddOnPack, GameVariant } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function actionGame(difficulty: 'easy' | 'medium' | 'hard' = 'easy', targetScore = 500) {
  return createGame(createConfig('guoTripleMemoryAction' as GameVariant, 'hotseat', 4, 'medium', addOns, 7, targetScore, 2, 0, false, difficulty, 'number', 2))
}

function actionKind(slot: unknown): string | undefined {
  return (slot as { memoryActionKind?: string }).memoryActionKind
}

{
  const state = actionGame('easy')
  const actionKinds = state.memoryBoard!.slots.map(actionKind).filter(Boolean)

  assert.equal(state.config.game, 'guoTripleMemoryAction')
  assert.equal(state.memoryBoard?.rows, 6)
  assert.equal(state.memoryBoard?.columns, 3)
  assert.equal(state.memoryBoard?.cardsPerMatch, 3)
  assert.equal(actionKinds.filter((kind) => kind === 'wild').length, 3, 'easy Triple Memory Action should include three Wild cards')
  assert.equal(actionKinds.filter((kind) => kind !== 'wild').length, 0, 'easy Triple Memory Action should not include disruptive actions')
}

{
  const state = actionGame('medium')
  const actionKinds = state.memoryBoard!.slots.map(actionKind).filter(Boolean)

  assert.equal(state.memoryBoard?.rows, 6)
  assert.equal(state.memoryBoard?.columns, 6)
  assert.equal(actionKinds.filter((kind) => kind === 'wild').length, 6)
  assert.equal(actionKinds.filter((kind) => kind === 'loseCards').length, 3, 'medium immediate actions should leave the board divisible into triples')
  assert.equal(actionKinds.filter((kind) => kind === 'earnCards').length, 3, 'medium immediate actions should leave the board divisible into triples')
}

{
  const state = actionGame('hard')
  const actionKinds = state.memoryBoard!.slots.map(actionKind).filter(Boolean)

  assert.equal(state.memoryBoard?.rows, 6)
  assert.equal(state.memoryBoard?.columns, 8)
  assert.equal(actionKinds.filter((kind) => kind === 'wild').length, 6)
  assert.equal(actionKinds.filter((kind) => kind === 'loseCards').length, 3)
  assert.equal(actionKinds.filter((kind) => kind === 'earnCards').length, 2)
  assert.equal(actionKinds.includes('allOthersLose'), true)
  assert.equal(actionKinds.includes('allOthersEarn'), true)
  assert.equal(actionKinds.includes('loseAll'), true)
  assert.equal(actionKinds.includes('winnerTakesAll'), true)
}

{
  const state = actionGame('easy')
  const wildIndex = state.memoryBoard!.slots.findIndex((slot) => actionKind(slot) === 'wild')
  const normalEntries = state.memoryBoard!.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => !actionKind(slot))
  const firstNormal = normalEntries[0]
  const matchingNormal = normalEntries.find(({ index, slot }) => index !== firstNormal.index && slot.card.value === firstNormal.slot.card.value)
  assert.ok(matchingNormal, 'test board should contain two normal cards that Wild can complete')
  const normalIndexes = [firstNormal.index, matchingNormal.index]
  const pending = memorySelectSlot(memorySelectSlot(memorySelectSlot(state, wildIndex), normalIndexes[0]), normalIndexes[1])

  assert.deepEqual(pending.memoryBoard?.pendingMatchIndexes, [wildIndex, normalIndexes[0], normalIndexes[1]], 'Wild should complete a three-card match')
  const resolved = memoryResolvePending(pending)
  assert.equal(resolved.players[0].hand.length, 3, 'Wild triple should be collected after reveal')
}

{
  const state = actionGame('easy')
  const wildIndex = state.memoryBoard!.slots.findIndex((slot) => actionKind(slot) === 'wild')
  const normalEntries = state.memoryBoard!.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => !actionKind(slot))
  const firstNormal = normalEntries[0]
  const mismatchingNormal = normalEntries.find(({ slot }) => slot.card.value !== firstNormal.slot.card.value)
  assert.ok(mismatchingNormal, 'test board should contain two different normal values')
  const pending = memorySelectSlot(memorySelectSlot(memorySelectSlot(state, wildIndex), firstNormal.index), mismatchingNormal.index)

  assert.deepEqual(pending.memoryBoard?.pendingMismatchIndexes, [wildIndex, firstNormal.index, mismatchingNormal.index], 'Wild should not make two different normal numbers into a triple')
}

{
  const state = actionGame('medium')
  const loseIndex = state.memoryBoard!.slots.findIndex((slot) => actionKind(slot) === 'loseCards')
  const seeded = {
    ...state,
    players: state.players.map((player, index) => index === 0
      ? { ...player, hand: [memoryBonusCard('a'), memoryBonusCard('b'), memoryBonusCard('c')], score: 0 }
      : player),
  }
  const originalRandom = Math.random
  Math.random = () => 0.8
  try {
    const afterAction = memorySelectSlot(seeded, loseIndex)
    assert.equal(afterAction.players[0].hand.length, 0, 'Lose Cards should drop up to the launcher result from the current player')
    assert.equal(afterAction.memoryActionEvent?.action, 'loseCards')
    assert.deepEqual(afterAction.memoryActionEvent?.affectedPlayers.map((entry) => entry.deltaCards), [-3])
    assert.equal(afterAction.memoryBoard?.slots[loseIndex].collectedByPlayerId, 'action')
    assert.equal(afterAction.memoryBoard?.selectedSlotIndexes.length, 0)
  } finally {
    Math.random = originalRandom
  }
}

{
  const state = actionGame('hard', 1)
  const winnerIndex = state.memoryBoard!.slots.findIndex((slot) => actionKind(slot) === 'winnerTakesAll')
  const finished = memorySelectSlot(state, winnerIndex)

  assert.equal(finished.winnerId, 'p1')
  assert.equal(finished.gameWinnerId, 'p1')
  assert.equal(finished.memoryActionEvent?.endedRound, true)
  assert.equal(finished.memoryBoard?.slots.every((slot) => slot.collectedByPlayerId), true)
}

function memoryBonusCard(id: string) {
  return { id: `test-bonus-${id}`, kind: 'number' as const, color: 'wild' as const, value: 0, label: 'Bonus', points: 0 }
}

console.log("Guo's Exclusive UNO Triple Memory Action behavior tests passed")
