import assert from 'node:assert/strict'
import {
  createQuatroGame,
  findQuatroWinningLine,
  quatroLegalColumns,
  quatroPlaceTile,
  quatroPlayableTileIds,
} from '../src/game/quatro/rules'
import type {
  QuatroColor,
  QuatroRandom,
  QuatroState,
  QuatroTile,
} from '../src/game/quatro/types'
import type { GameMode } from '../src/game/types'

const steadyRandom: QuatroRandom = {
  int(maxExclusive) {
    return maxExclusive - 1
  },
}

function tile(
  id: string,
  color: QuatroColor,
  value: QuatroTile['value'],
  action: QuatroTile['action'] = null,
): QuatroTile {
  return { id, color, value, action }
}

function freshState(): QuatroState {
  return createQuatroGame({
    mode: 'hotseat',
    aiDifficulty: 'medium',
    avatarId: 'explorer',
    random: steadyRandom,
  })
}

function withBoard(
  columns: QuatroTile[][],
  hand: QuatroTile[] = [tile('candidate', 'red', 5)],
): QuatroState {
  const state = freshState()
  return {
    ...state,
    players: [
      { ...state.players[0], hand, handCount: hand.length },
      state.players[1],
    ],
    columns: Array.from(
      { length: 7 },
      (_, index) => columns[index] ? [...columns[index]] : [],
    ) as QuatroState['columns'],
    events: [],
  }
}

{
  const expectations: Record<GameMode, Array<'human' | 'ai'>> = {
    single: ['human', 'ai'],
    hotseat: ['human', 'human'],
    wifi: ['human', 'human'],
    spectacular: ['ai', 'ai'],
  }

  for (const mode of Object.keys(expectations) as GameMode[]) {
    const state = createQuatroGame({
      mode,
      aiDifficulty: 'hard',
      avatarId: 'explorer',
      random: steadyRandom,
    })
    assert.equal(state.players.length, 2)
    assert.deepEqual(
      state.players.map((player) => player.hand.length),
      [3, 3],
    )
    assert.deepEqual(
      state.players.map((player) => player.handCount),
      [3, 3],
    )
    assert.deepEqual(
      state.players.map((player) => player.type),
      expectations[mode],
    )
    assert.equal(state.bag.length, 38)
    assert.deepEqual(
      state.columns.map((column) => column.length),
      [0, 0, 0, 0, 0, 0, 0],
    )
    assert.deepEqual(
      state.events.map((event) => event.kind),
      ['bagShake', 'deal'],
    )
    assert.equal(
      state.players.some((player) => 'score' in player),
      false,
      'UNO Quatro should not carry score fields',
    )
  }
}

{
  const candidate = tile('red-5', 'red', 5)
  const emptyState = withBoard([], [candidate])
  assert.deepEqual(quatroLegalColumns(emptyState, candidate.id), [
    0, 1, 2, 3, 4, 5, 6,
  ])

  const colorMatch = withBoard(
    [[tile('red-1', 'red', 1)]],
    [candidate],
  )
  assert.equal(quatroLegalColumns(colorMatch, candidate.id).includes(1), true)

  const numberCandidate = tile('blue-1', 'blue', 1)
  const numberMatch = withBoard(
    [[tile('red-1', 'red', 1)]],
    [numberCandidate],
  )
  assert.equal(
    quatroLegalColumns(numberMatch, numberCandidate.id).includes(1),
    true,
  )

  const mismatch = withBoard(
    [[tile('blue-2', 'blue', 2)]],
    [candidate],
  )
  assert.equal(quatroLegalColumns(mismatch, candidate.id).includes(1), false)

  const oneOfSeveralMatches = withBoard(
    [
      [tile('blue-0', 'blue', 0), tile('red-4', 'red', 4)],
      [tile('yellow-2', 'yellow', 2)],
      [tile('green-3', 'green', 3), tile('green-1', 'green', 1)],
    ],
    [candidate],
  )
  assert.equal(
    quatroLegalColumns(oneOfSeveralMatches, candidate.id).includes(1),
    true,
  )

  const fullColumn = Array.from({ length: 6 }, (_, index) =>
    tile(`full-${index}`, 'red', (index % 6) as QuatroTile['value']),
  )
  const normal = tile('normal', 'red', 5)
  const push = tile('push', 'red', 5, 'push')
  const fullState = withBoard([fullColumn], [normal, push])
  assert.equal(quatroLegalColumns(fullState, normal.id).includes(0), false)
  assert.equal(quatroLegalColumns(fullState, push.id).includes(0), true)
  assert.deepEqual(
    quatroPlayableTileIds(fullState, fullState.players[0].id),
    [normal.id, push.id],
    'playable tile IDs should be stable and contain no duplicates',
  )
}

function winningBoard(
  cells: Array<{ column: number; row: number }>,
  match: 'color' | 'number',
): QuatroTile[][] {
  const columns = Array.from({ length: 7 }, () => [] as QuatroTile[])
  for (let column = 0; column < 7; column += 1) {
    const highest = Math.max(
      -1,
      ...cells
        .filter((cell) => cell.column === column)
        .map((cell) => cell.row),
    )
    for (let row = 0; row <= highest; row += 1) {
      const isLine = cells.some(
        (cell) => cell.column === column && cell.row === row,
      )
      const lineIndex = cells.findIndex(
        (cell) => cell.column === column && cell.row === row,
      )
      columns[column].push(
        isLine
          ? tile(
              `line-${column}-${row}`,
              match === 'color' ? 'red' : (['blue', 'green', 'yellow', 'red'][lineIndex] as QuatroColor),
              match === 'number' ? 3 : ((column + row) % 6) as QuatroTile['value'],
            )
          : tile(
              `filler-${column}-${row}`,
              (['blue', 'green', 'yellow', 'red'][(column + row * 2) % 4] as QuatroColor),
              ((column * 2 + row + 1) % 6) as QuatroTile['value'],
            ),
      )
    }
  }
  return columns
}

{
  const lines = [
    [{ column: 0, row: 0 }, { column: 1, row: 0 }, { column: 2, row: 0 }, { column: 3, row: 0 }],
    [{ column: 0, row: 0 }, { column: 0, row: 1 }, { column: 0, row: 2 }, { column: 0, row: 3 }],
    [{ column: 0, row: 0 }, { column: 1, row: 1 }, { column: 2, row: 2 }, { column: 3, row: 3 }],
    [{ column: 0, row: 3 }, { column: 1, row: 2 }, { column: 2, row: 1 }, { column: 3, row: 0 }],
  ]

  for (const match of ['color', 'number'] as const) {
    for (const cells of lines) {
      const result = findQuatroWinningLine(
        withBoard(winningBoard(cells, match)).columns,
      )
      assert.equal(result?.match, match, `${match} fixture ${JSON.stringify(cells)}`)
      assert.deepEqual(result?.cells, cells)
    }
  }

  const three = winningBoard(lines[0].slice(0, 3), 'color')
  assert.equal(findQuatroWinningLine(withBoard(three).columns), null)

  const bent = winningBoard(
    [
      { column: 0, row: 0 },
      { column: 1, row: 0 },
      { column: 2, row: 0 },
      { column: 2, row: 1 },
    ],
    'number',
  )
  assert.equal(findQuatroWinningLine(withBoard(bent).columns), null)

  const five = winningBoard(
    [
      { column: 0, row: 0 },
      { column: 1, row: 0 },
      { column: 2, row: 0 },
      { column: 3, row: 0 },
      { column: 4, row: 0 },
    ],
    'color',
  )
  assert.deepEqual(
    findQuatroWinningLine(withBoard(five).columns)?.cells,
    lines[0],
  )
}

{
  const winningTile = tile('winning-red', 'red', 4)
  const state = withBoard(
    [
      [tile('neutral-0', 'red', 0)],
      [tile('neutral-1', 'red', 1)],
      [tile('neutral-2', 'red', 2)],
    ],
    [winningTile],
  )
  assert.equal(state.columns.flat().some((boardTile) => 'owner' in boardTile), false)

  const next = quatroPlaceTile(
    state,
    state.players[0].id,
    winningTile.id,
    3,
    steadyRandom,
  )
  assert.notEqual(next, state)
  assert.equal(state.columns[3].length, 0, 'placement should be immutable')
  assert.equal(next.winnerId, state.players[0].id)
  assert.equal(next.phase, 'gameOver')
  assert.deepEqual(next.events.map((event) => event.kind), ['drop', 'win'])
}

console.log('UNO Quatro rules behavior tests passed')
