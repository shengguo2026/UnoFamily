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
  return createGame(createConfig('guoMemoryAction' as GameVariant, 'hotseat', 4, 'medium', addOns, 7, targetScore, 2, 0, false, difficulty, 'number', 2))
}

function actionKind(slot: unknown): string | undefined {
  return (slot as { memoryActionKind?: string }).memoryActionKind
}

{
  const state = actionGame('easy')
  const actionKinds = state.memoryBoard!.slots.map(actionKind).filter(Boolean)

  assert.equal(state.config.game, 'guoMemoryAction')
  assert.equal(state.memoryBoard?.rows, 4)
  assert.equal(state.memoryBoard?.columns, 4)
  assert.equal(actionKinds.filter((kind) => kind === 'wild').length, 2, 'easy action memory should include two Wild cards')
  assert.equal(actionKinds.filter((kind) => kind !== 'wild').length, 0, 'easy action memory should not include disruptive actions yet')
}

{
  let state = actionGame('easy')
  const wildIndex = state.memoryBoard!.slots.findIndex((slot) => actionKind(slot) === 'wild')
  const normalIndex = state.memoryBoard!.slots.findIndex((slot, index) => index !== wildIndex && !actionKind(slot))
  const normalSlot = state.memoryBoard!.slots[normalIndex]
  const orphanMateIndex = state.memoryBoard!.slots.findIndex((slot, index) =>
    index !== normalIndex &&
    index !== wildIndex &&
    !actionKind(slot) &&
    slot.card.value === normalSlot.card.value
  )
  state = memoryResolvePending(memorySelectSlot(memorySelectSlot(state, wildIndex), normalIndex))

  assert.equal(actionKind(state.memoryBoard!.slots[orphanMateIndex]), 'wild', 'the mate of a normal card matched by Wild should become Wild so the board can still finish')
}

{
  const state = actionGame('medium')
  const actionKinds = state.memoryBoard!.slots.map(actionKind).filter(Boolean)

  assert.equal(state.memoryBoard?.rows, 6)
  assert.equal(actionKinds.filter((kind) => kind === 'wild').length, 4)
  assert.equal(actionKinds.filter((kind) => kind === 'loseCards').length, 2)
  assert.equal(actionKinds.filter((kind) => kind === 'earnCards').length, 2)
}

{
  const state = actionGame('hard', 1)
  const actionKinds = state.memoryBoard!.slots.map(actionKind).filter(Boolean)

  assert.equal(state.memoryBoard?.rows, 8)
  assert.equal(actionKinds.filter((kind) => kind === 'wild').length, 4)
  assert.equal(actionKinds.includes('allOthersLose'), true)
  assert.equal(actionKinds.includes('allOthersEarn'), true)
  assert.equal(actionKinds.includes('loseAll'), true)
  assert.equal(actionKinds.includes('winnerTakesAll'), true)
}

{
  const state = actionGame('easy')
  const wildIndex = state.memoryBoard!.slots.findIndex((slot) => actionKind(slot) === 'wild')
  const normalIndex = state.memoryBoard!.slots.findIndex((slot, index) => index !== wildIndex && !actionKind(slot))
  const pending = memorySelectSlot(memorySelectSlot(state, wildIndex), normalIndex)

  assert.deepEqual(pending.memoryBoard?.pendingMatchIndexes, [wildIndex, normalIndex], 'Wild should match any normal card')
  const resolved = memoryResolvePending(pending)
  assert.equal(resolved.players[0].hand.length, 2, 'Wild pairs are collected after the reveal duration')
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
    assert.equal(afterAction.memoryActionEvent?.action, 'loseCards', 'Lose Cards should publish an animation event')
    assert.deepEqual(afterAction.memoryActionEvent?.affectedPlayers.map((entry) => entry.deltaCards), [-3], 'animation event should report the actual cards lost')
    assert.equal(afterAction.memoryBoard?.slots[loseIndex].collectedByPlayerId, 'action', 'immediate action cards leave the table after resolving')
    assert.equal(afterAction.memoryBoard?.selectedSlotIndexes.length, 0, 'revealing an action card first should not consume a pair selection')
  } finally {
    Math.random = originalRandom
  }
}

{
  const state = actionGame('hard', 1)
  const winnerIndex = state.memoryBoard!.slots.findIndex((slot) => actionKind(slot) === 'winnerTakesAll')
  const finished = memorySelectSlot(state, winnerIndex)

  assert.equal(finished.winnerId, 'p1', 'Winner Takes All should finish the round immediately for the revealer')
  assert.equal(finished.gameWinnerId, 'p1')
  assert.equal(finished.memoryActionEvent?.endedRound, true, 'Winner Takes All should keep an animation event before the score screen')
  assert.equal(finished.memoryBoard?.slots.every((slot) => slot.collectedByPlayerId), true, 'Winner Takes All should clear the remaining table')
}

function memoryBonusCard(id: string) {
  return { id: `test-bonus-${id}`, kind: 'number' as const, color: 'wild' as const, value: 0, label: 'Bonus', points: 0 }
}

console.log("Guo's Exclusive UNO Memory Action behavior tests passed")
