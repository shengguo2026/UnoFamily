import assert from 'node:assert/strict'
import { createConfig, createGame, memoryAiMove, memoryResolvePending, memorySelectSlot, startNextRound } from '../src/game/classic'
import type { AddOnPack, GameVariant, MemoryMatchMode } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function memoryGame(matchMode: MemoryMatchMode = 'number', difficulty: 'easy' | 'medium' | 'hard' = 'easy', revealSeconds = 2, targetScore = 500) {
  return createGame(createConfig('guoMemory' as GameVariant, 'hotseat', 4, 'medium', addOns, 7, targetScore, 2, 0, false, difficulty, matchMode, revealSeconds))
}

{
  const state = memoryGame()

  assert.equal(state.config.game, 'guoMemory')
  assert.equal(state.memoryBoard?.rows, 4, 'Guo Memory should start with the easy 4x4 board in the first slice')
  assert.equal(state.memoryBoard?.columns, 4, 'Guo Memory should start with four columns')
  assert.equal(state.memoryBoard?.slots.length, 16, 'Guo Memory should deal 16 shared table cards')
  assert.equal(state.memoryBoard?.matchMode, 'number', 'Guo Memory should default to number matching')
  assert.equal(state.players.every((player) => player.hand.length === 0), true, 'players start with no collected cards')
  assert.equal(state.memoryBoard?.slots.every((slot) => !slot.faceUp && !slot.collectedByPlayerId), true, 'all memory cards start face down')
}

{
  const state = memoryGame()
  const slots = state.memoryBoard!.slots
  const firstIndex = 0
  const matchIndex = slots.findIndex((slot, index) => index !== firstIndex && slot.card.value === slots[firstIndex].card.value)

  const oneSelected = memorySelectSlot(state, firstIndex)
  const pendingMatch = memorySelectSlot(oneSelected, matchIndex)

  assert.deepEqual(pendingMatch.memoryBoard?.pendingMatchIndexes, [firstIndex, matchIndex], 'matching cards should stay visible before collection')
  assert.equal(pendingMatch.players[0].hand.length, 0, 'matching pair should not disappear before the reveal delay resolves')

  const matched = memoryResolvePending(pendingMatch)

  assert.equal(matched.players[0].hand.length, 2, 'matching pair should be collected by the active player after reveal')
  assert.equal(matched.memoryBoard?.slots[firstIndex].collectedByPlayerId, 'p1')
  assert.equal(matched.memoryBoard?.slots[matchIndex].collectedByPlayerId, 'p1')
  assert.equal(matched.activePlayerIndex, 0, 'a successful match grants another turn')
  assert.equal(matched.memoryBoard?.selectedSlotIndexes.length, 0, 'matched slots clear the temporary selection')
}

{
  const state = memoryGame()
  const slots = state.memoryBoard!.slots
  const firstIndex = 0
  const mismatchIndex = slots.findIndex((slot, index) => index !== firstIndex && slot.card.value !== slots[firstIndex].card.value)

  const oneSelected = memorySelectSlot(state, firstIndex)
  const pending = memorySelectSlot(oneSelected, mismatchIndex)

  assert.deepEqual(pending.memoryBoard?.pendingMismatchIndexes, [firstIndex, mismatchIndex], 'a mismatch should stay visible until the reveal delay resolves')
  assert.equal(pending.activePlayerIndex, 0, 'turn should not pass before the reveal delay resolves')

  const resolved = memoryResolvePending(pending)

  assert.equal(resolved.memoryBoard?.slots[firstIndex].faceUp, false, 'first mismatched card flips back down')
  assert.equal(resolved.memoryBoard?.slots[mismatchIndex].faceUp, false, 'second mismatched card flips back down')
  assert.equal(resolved.activePlayerIndex, 1, 'turn passes after a mismatch resolves')
}

{
  let state = memoryGame()
  const slots = state.memoryBoard!.slots
  const firstIndex = 0
  const matchIndex = slots.findIndex((slot, index) => index !== firstIndex && slot.card.value === slots[firstIndex].card.value)
  const p2Cards = state.memoryBoard!.slots.filter((_, slotIndex) => slotIndex !== firstIndex && slotIndex !== matchIndex).map((slot) => slot.card)
  state = {
    ...state,
    memoryBoard: {
      ...state.memoryBoard!,
      slots: state.memoryBoard!.slots.map((slot, index) =>
        index === firstIndex || index === matchIndex ? slot : { ...slot, collectedByPlayerId: 'p2', faceUp: true },
      ),
    },
    players: state.players.map((player, index) => index === 1
      ? { ...player, hand: p2Cards, score: p2Cards.reduce((total, card) => total + card.points, 0) }
      : player),
  }

  const finished = memoryResolvePending(memorySelectSlot(memorySelectSlot(state, firstIndex), matchIndex))

  assert.equal(finished.winnerId, 'p2', 'winner should be the player with the most collected cards')
  assert.equal(finished.gameWinnerId, null, 'memory sessions should continue until the configured target score is reached')

  const nextRound = startNextRound(finished)
  assert.equal(nextRound.currentRound, 2, 'continue should start the next Memory round')
  assert.equal(nextRound.winnerId, null, 'next Memory round should clear the round winner')
  assert.equal(nextRound.memoryBoard?.slots.length, 16, 'next Memory round should deal a fresh shared board')
  assert.equal(nextRound.players[1].score, finished.players[1].score, 'next Memory round should preserve session score')
  assert.equal(nextRound.players.every((player) => player.hand.length === 0), true, 'next Memory round should clear collected cards')
}

{
  const state = memoryGame('number', 'easy', 2, 1)
  const slots = state.memoryBoard!.slots
  const firstIndex = slots.findIndex((slot, index) => slot.card.points > 0 && slots.some((candidate, candidateIndex) => candidateIndex !== index && candidate.card.value === slot.card.value))
  assert.notEqual(firstIndex, -1, 'test board should contain a positive-point matching pair')
  const matchIndex = slots.findIndex((slot, index) => index !== firstIndex && slot.card.value === slots[firstIndex].card.value)
  const p2Cards = state.memoryBoard!.slots.filter((_, slotIndex) => slotIndex !== firstIndex && slotIndex !== matchIndex).map((slot) => slot.card)
  const almostFinished = {
    ...state,
    memoryBoard: {
      ...state.memoryBoard!,
      slots: state.memoryBoard!.slots.map((slot, index) =>
        index === firstIndex || index === matchIndex ? slot : { ...slot, collectedByPlayerId: 'p2', faceUp: true },
      ),
    },
    players: state.players.map((player, index) => index === 1
      ? { ...player, hand: p2Cards, score: p2Cards.reduce((total, card) => total + card.points, 0) }
      : player),
  }
  const finished = memoryResolvePending(memorySelectSlot(memorySelectSlot(almostFinished, firstIndex), matchIndex))

  assert.equal(finished.gameWinnerId, 'p2', 'memory session should end once a player reaches the configured target score')
}

{
  const state = memoryGame('both', 'medium', 4)

  assert.equal(state.memoryBoard?.rows, 6, 'medium difficulty should use a 6x6 board')
  assert.equal(state.memoryBoard?.columns, 6, 'medium difficulty should use six columns')
  assert.equal(state.memoryBoard?.slots.length, 36, 'medium difficulty should deal 36 shared cards')
  assert.equal(state.memoryBoard?.matchMode, 'both', 'selected match mode should be stored on the board')
  assert.equal(state.memoryBoard?.revealDurationMs, 4000, 'selected reveal duration should be stored in milliseconds')
}

{
  const state = memoryGame('color', 'hard', 5)

  assert.equal(state.memoryBoard?.rows, 8, 'hard difficulty should use an 8x8 board')
  assert.equal(state.memoryBoard?.columns, 8, 'hard difficulty should use eight columns')
  assert.equal(state.memoryBoard?.slots.length, 64, 'hard difficulty should deal 64 shared cards')
  assert.equal(state.memoryBoard?.matchMode, 'color')
  assert.equal(state.memoryBoard?.revealDurationMs, 5000)
}

{
  const state = createGame(createConfig('guoMemory' as GameVariant, 'single', 4, 'easy', addOns, 7, 500, 2, 0, false, 'easy', 'number', 2))
  const aiTurn = { ...state, activePlayerIndex: 1 }
  const firstMove = memoryAiMove(aiTurn).state

  assert.equal(firstMove.memoryBoard?.selectedSlotIndexes.length, 1, 'AI should reveal the first picked card before choosing the second')
  assert.equal(firstMove.memoryBoard?.slots[firstMove.memoryBoard.selectedSlotIndexes[0]].faceUp, true, 'AI first pick should be visible')

  const originalRandom = Math.random
  Math.random = () => 0.99
  try {
    const secondMove = memoryAiMove(firstMove).state
    assert.equal(secondMove.memoryBoard?.pendingMismatchIndexes?.length, 2, 'easy AI should sometimes miss instead of always finding a pair')
  } finally {
    Math.random = originalRandom
  }
}

console.log("Guo's Exclusive UNO Memory behavior tests passed")
