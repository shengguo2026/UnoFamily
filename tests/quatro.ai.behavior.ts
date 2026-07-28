import assert from 'node:assert/strict'
import {
  chooseQuatroAiAction,
  listQuatroLegalActions,
} from '../src/game/quatro/ai'
import { getQuatroHint } from '../src/game/quatro/hints'
import { createQuatroGame } from '../src/game/quatro/rules'
import type {
  QuatroColor,
  QuatroRandom,
  QuatroState,
  QuatroTile,
} from '../src/game/quatro/types'

const steadyRandom: QuatroRandom = { int: () => 0 }

function tile(
  id: string,
  color: QuatroColor,
  value: QuatroTile['value'],
  action: QuatroTile['action'] = null,
): QuatroTile {
  return { id, color, value, action }
}

function stateWith(
  hand: QuatroTile[],
  columns: QuatroTile[][] = [],
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
): QuatroState {
  const base = createQuatroGame({
    mode: 'single',
    aiDifficulty: difficulty,
    avatarId: 'explorer',
    random: { int: (maximum) => maximum - 1 },
  })
  return {
    ...base,
    players: [
      {
        ...base.players[0],
        type: 'ai',
        aiDifficulty: difficulty,
        hand,
        handCount: hand.length,
      },
      base.players[1],
    ],
    columns: Array.from(
      { length: 7 },
      (_, index) => columns[index] ? [...columns[index]] : [],
    ) as QuatroState['columns'],
    events: [],
  }
}

{
  const state = stateWith(
    [tile('easy-red', 'red', 1), tile('easy-blue', 'blue', 2)],
    [],
    'easy',
  )
  const legal = listQuatroLegalActions(state)
  const selected = chooseQuatroAiAction(state, { int: () => legal.length - 1 })
  assert.deepEqual(selected, legal[legal.length - 1])
}

{
  const winning = tile('winning', 'red', 4)
  const state = stateWith(
    [winning, tile('other', 'blue', 3)],
    [
      [tile('r0', 'red', 0)],
      [tile('r1', 'red', 1)],
      [tile('r2', 'red', 2)],
    ],
  )
  assert.deepEqual(chooseQuatroAiAction(state, steadyRandom), {
    type: 'place',
    tileId: winning.id,
    column: 3,
  })
}

{
  const blocker = tile('blocker', 'red', 2)
  const state = stateWith(
    [blocker],
    [
      [tile('blue-0', 'blue', 0)],
      [tile('blue-1', 'blue', 1)],
      [tile('blue-2', 'blue', 2)],
    ],
  )
  assert.deepEqual(chooseQuatroAiAction(state, steadyRandom), {
    type: 'place',
    tileId: blocker.id,
    column: 3,
  })
}

{
  const base = stateWith([tile('swap', 'yellow', 1, 'swap')])
  const swapFirst: QuatroState = { ...base, phase: 'selectSwapFirst' }
  assert.deepEqual(
    listQuatroLegalActions(swapFirst).map((action) => action.type),
    Array.from({ length: 7 }, () => 'selectSwap'),
  )
  const swapSecond: QuatroState = {
    ...base,
    phase: 'selectSwapSecond',
    pendingSwapFirstColumn: 2,
  }
  assert.equal(
    listQuatroLegalActions(swapSecond).some(
      (action) => action.type === 'selectSwap' && action.column === 2,
    ),
    false,
  )
  const emptyPush: QuatroState = {
    ...base,
    phase: 'chooseEmptyPush',
    pendingPushColumn: 0,
    pendingPushTileId: 'swap',
  }
  assert.deepEqual(listQuatroLegalActions(emptyPush), [
    { type: 'resolveEmptyPush', pushOut: false },
    { type: 'resolveEmptyPush', pushOut: true },
  ])
}

{
  const setup = tile('fork-setup', 'red', 3)
  const finisher = tile('fork-finisher', 'red', 4)
  const decoy = tile('decoy', 'blue', 5)
  const state = stateWith(
    [setup, finisher, decoy],
    [
      [],
      [tile('fork-left', 'red', 0)],
      [],
      [tile('fork-right', 'red', 2)],
    ],
    'hard',
  )
  const originalBag = state.bag.map((bagTile) => bagTile.id)
  const first = chooseQuatroAiAction(state, steadyRandom)
  const second = chooseQuatroAiAction(state, steadyRandom)
  assert.equal(first?.type, 'place')
  assert.equal(first?.type === 'place' ? first.column : -1, 2)
  assert.equal(
    first?.type === 'place'
      && [setup.id, finisher.id].includes(first.tileId),
    true,
  )
  assert.deepEqual(second, first)
  assert.deepEqual(
    state.bag.map((bagTile) => bagTile.id),
    originalBag,
    'hard evaluation must not inspect or reorder the hidden bag',
  )
}

{
  const columns = Array.from({ length: 7 }, (_, column) =>
    Array.from({ length: 6 }, (_, row) =>
      tile(
        `full-${column}-${row}`,
        (['red', 'green', 'yellow', 'blue'][(column + row * 2) % 4] as QuatroColor),
        ((column * 2 + row * 3) % 6) as QuatroTile['value'],
      ),
    ),
  )
  const state = stateWith(
    [
      tile('exchange-a', 'red', 0),
      tile('exchange-b', 'green', 1),
      tile('exchange-c', 'yellow', 2),
    ],
    columns,
  )
  assert.equal(chooseQuatroAiAction(state, steadyRandom)?.type, 'exchange')
}

{
  const movable = tile('movable', 'red', 2)
  const state = stateWith(
    [movable],
    [[tile('neighbor', 'blue', 2)]],
  )
  const hint = getQuatroHint(state, state.players[0].id)
  assert.equal(hint.kind, 'place')
  assert.deepEqual(hint.tileIds, [movable.id])
  assert.equal(hint.columns.includes(1), true)
  const serialized = JSON.stringify(hint)
  for (const opponentTile of state.players[1].hand) {
    assert.equal(serialized.includes(opponentTile.id), false)
    assert.equal(serialized.includes(opponentTile.color), false)
  }

  assert.equal(
    getQuatroHint(
      { ...state, phase: 'selectSwapFirst' },
      state.players[0].id,
    ).kind,
    'swapFirst',
  )
  assert.equal(
    getQuatroHint(
      {
        ...state,
        phase: 'selectSwapSecond',
        pendingSwapFirstColumn: 1,
      },
      state.players[0].id,
    ).kind,
    'swapSecond',
  )
  assert.equal(
    getQuatroHint(
      {
        ...state,
        phase: 'chooseEmptyPush',
        pendingPushColumn: 0,
        pendingPushTileId: movable.id,
      },
      state.players[0].id,
    ).kind,
    'emptyPush',
  )
  assert.equal(
    getQuatroHint(
      { ...state, phase: 'gameOver', winnerId: state.players[0].id },
      state.players[0].id,
    ).kind,
    'won',
  )
  assert.equal(getQuatroHint(state, state.players[1].id).kind, 'wait')
}

console.log('UNO Quatro AI and hint behavior tests passed')
