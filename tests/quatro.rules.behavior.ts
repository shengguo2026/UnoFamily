import assert from 'node:assert/strict'
import {
  createQuatroGame,
  findQuatroWinningLine,
  quatroLegalColumns,
  quatroExchangeTile,
  quatroPlaceTile,
  quatroPlayableTileIds,
  quatroResolveEmptyPush,
  quatroSelectSwapColumn,
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
  assert.deepEqual(next.log, [
    {
      kind: 'place',
      playerId: state.players[0].id,
      tile: { color: 'red', value: 4, action: null },
      column: 3,
    },
    {
      kind: 'win',
      playerId: state.players[0].id,
      match: 'color',
      color: 'red',
    },
  ])
}

{
  const firstTile = tile('trace-first', 'red', 1)
  const secondTile = tile('trace-second', 'blue', 1)
  const state = withBoard([], [firstTile])
  state.players[1] = {
    ...state.players[1],
    hand: [secondTile],
    handCount: 1,
  }

  const afterFirst = quatroPlaceTile(
    state,
    state.players[0].id,
    firstTile.id,
    0,
    steadyRandom,
  )
  const afterSecond = quatroPlaceTile(
    afterFirst,
    state.players[1].id,
    secondTile.id,
    1,
    steadyRandom,
  )

  assert.deepEqual(
    afterSecond.log.map((entry) => ({
      kind: entry.kind,
      playerId: entry.playerId,
    })),
    [
      { kind: 'place', playerId: state.players[0].id },
      { kind: 'place', playerId: state.players[1].id },
    ],
    'the trace must retain public moves from both players',
  )
}

{
  const swapTile = tile('swap-action', 'yellow', 5, 'swap')
  const state = withBoard(
    [
      [tile('row-red-0', 'red', 0)],
      [tile('row-red-1', 'red', 1)],
      [tile('row-red-2', 'red', 2)],
      [tile('swap-source-blue', 'blue', 4)],
      [tile('swap-source-red', 'red', 5)],
    ],
    [swapTile],
  )
  const placed = quatroPlaceTile(
    state,
    state.players[0].id,
    swapTile.id,
    6,
    steadyRandom,
  )
  assert.equal(placed.phase, 'selectSwapFirst')
  assert.equal(placed.winnerId, null)

  const first = quatroSelectSwapColumn(
    placed,
    placed.players[0].id,
    3,
    steadyRandom,
  )
  assert.equal(first.phase, 'selectSwapSecond')
  assert.equal(first.pendingSwapFirstColumn, 3)
  assert.throws(() =>
    quatroSelectSwapColumn(first, first.players[0].id, 3, steadyRandom),
  )

  const resolved = quatroSelectSwapColumn(
    first,
    first.players[0].id,
    4,
    steadyRandom,
  )
  assert.deepEqual(
    resolved.columns[3].map((boardTile) => boardTile.id),
    ['swap-source-red'],
  )
  assert.deepEqual(
    resolved.columns[4].map((boardTile) => boardTile.id),
    ['swap-source-blue'],
  )
  assert.equal(resolved.winnerId, state.players[0].id)
  assert.deepEqual(
    resolved.events.map((event) => event.kind),
    ['swap', 'win'],
  )
  const swapEvent = resolved.events.find(
    (event) => event.kind === 'swap',
  )
  assert.deepEqual(swapEvent?.columns, [3, 4])
  assert.deepEqual(
    swapEvent?.trayTiles?.map((column) =>
      column.map((boardTile) => boardTile.id),
    ),
    [['swap-source-blue'], ['swap-source-red']],
  )
  assert.deepEqual(
    resolved.log.map((entry) => entry.kind),
    ['place', 'swap', 'win'],
  )
}

{
  const pushTile = tile('push-action', 'red', 3, 'push')
  const bottom = tile('pushed-out', 'blue', 1)
  const retained = tile('retained', 'red', 2)
  const state = withBoard([[bottom, retained]], [pushTile])
  const resolved = quatroPlaceTile(
    state,
    state.players[0].id,
    pushTile.id,
    0,
    steadyRandom,
  )
  assert.deepEqual(
    resolved.columns[0].map((boardTile) => boardTile.id),
    [retained.id, pushTile.id],
  )
  assert.equal(
    resolved.bag.filter((bagTile) => bagTile.id === bottom.id).length,
    1,
  )
  assert.deepEqual(
    resolved.events.slice(0, 2).map((event) => event.kind),
    ['drop', 'push'],
  )
  assert.deepEqual(
    resolved.log.map((entry) => entry.kind),
    ['place', 'push'],
  )

  const full = Array.from({ length: 6 }, (_, index) =>
    tile(
      `full-push-${index}`,
      index === 5 ? 'red' : 'blue',
      (index % 6) as QuatroTile['value'],
    ),
  )
  const fullState = withBoard([full], [pushTile])
  const fullResolved = quatroPlaceTile(
    fullState,
    fullState.players[0].id,
    pushTile.id,
    0,
    steadyRandom,
  )
  assert.equal(fullResolved.columns[0].length, 6)
  assert.equal(
    fullResolved.bag.filter((bagTile) => bagTile.id === full[0].id).length,
    1,
  )

  const emptyState = withBoard([], [pushTile])
  const pending = quatroPlaceTile(
    emptyState,
    emptyState.players[0].id,
    pushTile.id,
    0,
    steadyRandom,
  )
  assert.equal(pending.phase, 'chooseEmptyPush')
  const kept = quatroResolveEmptyPush(
    pending,
    pending.players[0].id,
    false,
    steadyRandom,
  )
  assert.equal(kept.columns[0].length, 1)

  const pendingAgain = quatroPlaceTile(
    emptyState,
    emptyState.players[0].id,
    pushTile.id,
    0,
    steadyRandom,
  )
  const pushedOut = quatroResolveEmptyPush(
    pendingAgain,
    pendingAgain.players[0].id,
    true,
    steadyRandom,
  )
  assert.equal(pushedOut.columns[0].length, 0)
  assert.equal(
    pushedOut.bag.filter((bagTile) => bagTile.id === pushTile.id).length,
    1,
  )
}

{
  const minus2 = tile('minus-two', 'yellow', 4, 'minus2')
  const state = withBoard([], [minus2])
  const opponentIds = state.players[1].hand.map((handTile) => handTile.id)
  const alwaysFirst: QuatroRandom = { int: () => 0 }
  const attacked = quatroPlaceTile(
    state,
    state.players[0].id,
    minus2.id,
    0,
    alwaysFirst,
  )
  assert.equal(attacked.activePlayerIndex, 1)
  assert.equal(attacked.players[1].hand.length, 1)
  assert.equal(attacked.players[1].handCount, 1)
  assert.equal(attacked.minus2RefillPlayerId, state.players[1].id)
  assert.equal(
    attacked.players[1].hand.some((handTile) => handTile.id === opponentIds[0]),
    false,
  )
  assert.equal(
    attacked.players[1].hand.some((handTile) => handTile.id === opponentIds[1]),
    false,
  )
  assert.deepEqual(
    attacked.events.slice(0, 2).map((event) => event.kind),
    ['drop', 'minus2Return'],
  )
  assert.deepEqual(
    attacked.log.map((entry) => entry.kind),
    ['place', 'minus2'],
  )
  assert.equal(
    attacked.events.filter(
      (event) =>
        event.kind === 'draw'
        && event.playerId === state.players[1].id,
    ).length,
    0,
    'the penalized player must begin the next turn with one tile',
  )

  const remaining = attacked.players[1].hand[0]
  const completed = quatroPlaceTile(
    attacked,
    attacked.players[1].id,
    remaining.id,
    3,
    alwaysFirst,
  )
  assert.equal(completed.players[1].hand.length, 3)
  assert.equal(completed.minus2RefillPlayerId, null)
}

{
  const playable = tile('playable', 'red', 1)
  const playableState = withBoard([], [playable])
  assert.throws(() =>
    quatroExchangeTile(
      playableState,
      playableState.players[0].id,
      playable.id,
      steadyRandom,
    ),
  )

  const fullColumns = Array.from({ length: 7 }, (_, column) =>
    Array.from({ length: 6 }, (_, row) =>
      tile(
        `blocked-${column}-${row}`,
        (['red', 'green', 'yellow', 'blue'][(column + row * 2) % 4] as QuatroColor),
        ((column * 2 + row * 3) % 6) as QuatroTile['value'],
      ),
    ),
  )
  const returned = tile('returned', 'red', 1)
  const otherA = tile('other-a', 'green', 2)
  const otherB = tile('other-b', 'yellow', 3)
  const replacement = tile('replacement-push', 'red', 4, 'push')
  const blocked = withBoard(fullColumns, [returned, otherA, otherB])
  blocked.bag = [replacement]
  assert.deepEqual(
    quatroPlayableTileIds(blocked, blocked.players[0].id),
    [],
  )

  const exchanged = quatroExchangeTile(
    blocked,
    blocked.players[0].id,
    returned.id,
    { int: () => 0 },
  )
  assert.equal(exchanged.activePlayerIndex, 0)
  assert.equal(exchanged.exchangeDrawnTileId, replacement.id)
  assert.deepEqual(
    quatroPlayableTileIds(exchanged, exchanged.players[0].id),
    [replacement.id],
  )
  assert.deepEqual(
    exchanged.events.map((event) => event.kind),
    ['returnToBag', 'draw'],
  )
  assert.deepEqual(exchanged.log, [
    {
      kind: 'exchange',
      playerId: blocked.players[0].id,
    },
  ])

  const noBagState = withBoard(fullColumns, [returned, otherA, otherB])
  noBagState.bag = []
  const sameTileBack = quatroExchangeTile(
    noBagState,
    noBagState.players[0].id,
    returned.id,
    { int: () => 0 },
  )
  assert.equal(sameTileBack.players[0].hand.length, 3)
  assert.equal(sameTileBack.players[0].handCount, 3)
  assert.equal(sameTileBack.activePlayerIndex, 1)
  assert.deepEqual(
    sameTileBack.events.slice(0, 2).map((event) => event.kind),
    ['returnToBag', 'draw'],
  )
}

console.log('UNO Quatro rules behavior tests passed')
