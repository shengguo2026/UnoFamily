import assert from 'node:assert/strict'
import { createConfig, createGame, memoryAiMove, memoryResolvePending, memorySelectSlot } from '../src/game/classic'
import type { AddOnPack, GameVariant, MemoryMatchMode } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function tripleMemory(matchMode: MemoryMatchMode = 'number', difficulty: 'easy' | 'medium' | 'hard' = 'easy', revealSeconds = 2) {
  return createGame(createConfig('guoTripleMemory' as GameVariant, 'hotseat', 4, 'medium', addOns, 7, 500, 2, 0, false, difficulty, matchMode, revealSeconds))
}

function findMatchingTriple(state = tripleMemory()) {
  const slots = state.memoryBoard!.slots
  for (let first = 0; first < slots.length; first += 1) {
    for (let second = first + 1; second < slots.length; second += 1) {
      for (let third = second + 1; third < slots.length; third += 1) {
        const a = slots[first].card
        const b = slots[second].card
        const c = slots[third].card
        if (a.value === b.value && b.value === c.value) return [first, second, third] as const
      }
    }
  }
  throw new Error('test board should contain a matching triple')
}

{
  const state = tripleMemory()

  assert.equal(state.config.game, 'guoTripleMemory')
  assert.equal(state.memoryBoard?.rows, 6, 'easy Triple Memory should use six rows')
  assert.equal(state.memoryBoard?.columns, 3, 'easy Triple Memory should use three columns')
  assert.equal(state.memoryBoard?.slots.length, 18, 'easy Triple Memory should deal 18 shared cards')
  assert.equal(state.memoryBoard?.cardsPerMatch, 3, 'Triple Memory should require three selected cards')
  assert.equal(state.memoryBoard?.matchMode, 'number')
}

{
  const state = tripleMemory('both', 'medium', 4)

  assert.equal(state.memoryBoard?.rows, 6)
  assert.equal(state.memoryBoard?.columns, 6)
  assert.equal(state.memoryBoard?.slots.length, 36)
  assert.equal(state.memoryBoard?.cardsPerMatch, 3)
  assert.equal(state.memoryBoard?.matchMode, 'both')
  assert.equal(state.memoryBoard?.revealDurationMs, 4000)
}

{
  const state = tripleMemory('color', 'hard', 5)

  assert.equal(state.memoryBoard?.rows, 6)
  assert.equal(state.memoryBoard?.columns, 8)
  assert.equal(state.memoryBoard?.slots.length, 48)
  assert.equal(state.memoryBoard?.cardsPerMatch, 3)
  assert.equal(state.memoryBoard?.matchMode, 'color')
  assert.equal(state.memoryBoard?.revealDurationMs, 5000)
}

{
  const state = tripleMemory()
  const [firstIndex, secondIndex, thirdIndex] = findMatchingTriple(state)
  const oneSelected = memorySelectSlot(state, firstIndex)
  const twoSelected = memorySelectSlot(oneSelected, secondIndex)
  const pendingMatch = memorySelectSlot(twoSelected, thirdIndex)

  assert.equal(twoSelected.memoryBoard?.selectedSlotIndexes.length, 2, 'two cards should not resolve a Triple Memory turn')
  assert.deepEqual(pendingMatch.memoryBoard?.pendingMatchIndexes, [firstIndex, secondIndex, thirdIndex], 'matching triples should stay visible before collection')

  const matched = memoryResolvePending(pendingMatch)

  assert.equal(matched.players[0].hand.length, 3, 'matching triple should be collected after reveal')
  assert.equal(matched.activePlayerIndex, 0, 'a successful triple grants another turn')
  assert.equal(matched.memoryBoard?.selectedSlotIndexes.length, 0)
}

{
  const state = createGame(createConfig('guoTripleMemory' as GameVariant, 'single', 4, 'easy', addOns, 7, 500, 2, 0, false, 'easy', 'number', 2))
  const aiTurn = { ...state, activePlayerIndex: 1 }
  const firstMove = memoryAiMove(aiTurn).state
  const secondMove = memoryAiMove(firstMove).state

  assert.equal(firstMove.memoryBoard?.selectedSlotIndexes.length, 1, 'AI should reveal the first picked triple card')
  assert.equal(secondMove.memoryBoard?.selectedSlotIndexes.length, 2, 'AI should reveal a second picked triple card before resolving')
  assert.equal(secondMove.memoryBoard?.selectedSlotIndexes.every((index) => secondMove.memoryBoard!.slots[index].faceUp), true, 'AI picks should be visible')
}

console.log("Guo's Exclusive UNO Triple Memory behavior tests passed")
