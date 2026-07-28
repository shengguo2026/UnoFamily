import type {
  AiDifficulty,
  AvatarId,
  GameMode,
} from '../types'
import { buildQuatroBag, shuffleQuatroTiles } from './tiles'
import type {
  QuatroPlayer,
  QuatroRandom,
  QuatroState,
  QuatroTile,
  QuatroWinningLine,
} from './types'

const COLUMN_COUNT = 7
const COLUMN_CAPACITY = 6

function cloneColumns(
  columns: QuatroState['columns'],
): QuatroState['columns'] {
  return columns.map((column) => [...column]) as QuatroState['columns']
}

function modePlayerTypes(
  mode: GameMode,
): [QuatroPlayer['type'], QuatroPlayer['type']] {
  if (mode === 'single') return ['human', 'ai']
  if (mode === 'spectacular') return ['ai', 'ai']
  return ['human', 'human']
}

export function createQuatroGame(input: {
  mode: GameMode
  aiDifficulty: AiDifficulty
  avatarId: AvatarId
  random: QuatroRandom
}): QuatroState {
  const bag = shuffleQuatroTiles(buildQuatroBag(), input.random)
  const types = modePlayerTypes(input.mode)
  const players: [QuatroPlayer, QuatroPlayer] = [
    {
      id: 'quatro-player-1',
      name: 'Player 1',
      type: types[0],
      aiDifficulty: types[0] === 'ai' ? input.aiDifficulty : undefined,
      avatarId: input.avatarId,
      hand: [],
      handCount: 0,
    },
    {
      id: 'quatro-player-2',
      name: 'Player 2',
      type: types[1],
      aiDifficulty: types[1] === 'ai' ? input.aiDifficulty : undefined,
      avatarId: 'teacher',
      hand: [],
      handCount: 0,
    },
  ]
  const movements: Array<{ playerId: string; tileId: string }> = []

  for (let round = 0; round < 3; round += 1) {
    for (const player of players) {
      const dealt = bag.shift()
      if (!dealt) throw new Error('UNO Quatro bag exhausted during setup')
      player.hand.push(dealt)
      player.handCount = player.hand.length
      movements.push({ playerId: player.id, tileId: dealt.id })
    }
  }

  return {
    players,
    bag,
    columns: [[], [], [], [], [], [], []],
    activePlayerIndex: 0,
    phase: 'playing',
    selectedTileId: null,
    selectedColumn: null,
    pendingSwapFirstColumn: null,
    pendingPushColumn: null,
    pendingPushTileId: null,
    minus2RefillPlayerId: null,
    exchangeDrawnTileId: null,
    winnerId: null,
    winningLine: null,
    transitionSequence: 1,
    events: [{ kind: 'bagShake' }, { kind: 'deal', movements }],
    mode: input.mode,
    aiDifficulty: input.aiDifficulty,
    animationSpeed: 'normal',
    log: [],
  }
}

function findTileInHands(
  state: QuatroState,
  tileId: string,
): QuatroTile | undefined {
  for (const player of state.players) {
    const found = player.hand.find((tile) => tile.id === tileId)
    if (found) return found
  }
  return undefined
}

function simulatedPlacement(
  column: readonly QuatroTile[],
  tile: QuatroTile,
): { column: QuatroTile[]; landingRow: number } | null {
  if (tile.action === 'push') {
    if (column.length === 0) return { column: [tile], landingRow: 0 }
    return {
      column: [...column.slice(1), tile],
      landingRow: column.length - 1,
    }
  }
  if (column.length >= COLUMN_CAPACITY) return null
  return { column: [...column, tile], landingRow: column.length }
}

function isLegalPlacement(
  columns: QuatroState['columns'],
  tile: QuatroTile,
  columnIndex: number,
): boolean {
  if (
    !Number.isInteger(columnIndex)
    || columnIndex < 0
    || columnIndex >= COLUMN_COUNT
  ) {
    return false
  }

  const simulation = simulatedPlacement(columns[columnIndex], tile)
  if (!simulation) return false
  const resulting = cloneColumns(columns)
  resulting[columnIndex] = simulation.column

  let hasOccupiedNeighbor = false
  for (let columnDelta = -1; columnDelta <= 1; columnDelta += 1) {
    for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
      if (columnDelta === 0 && rowDelta === 0) continue
      const neighborColumn = columnIndex + columnDelta
      const neighborRow = simulation.landingRow + rowDelta
      if (
        neighborColumn < 0
        || neighborColumn >= COLUMN_COUNT
        || neighborRow < 0
        || neighborRow >= COLUMN_CAPACITY
      ) {
        continue
      }
      const neighbor = resulting[neighborColumn][neighborRow]
      if (!neighbor) continue
      hasOccupiedNeighbor = true
      if (neighbor.color === tile.color || neighbor.value === tile.value) {
        return true
      }
    }
  }
  return !hasOccupiedNeighbor
}

export function quatroLegalColumns(
  state: QuatroState,
  tileId: string,
): number[] {
  const tile = findTileInHands(state, tileId)
  if (!tile || state.phase !== 'playing') return []
  if (
    state.exchangeDrawnTileId
    && state.exchangeDrawnTileId !== tileId
  ) {
    return []
  }

  return Array.from({ length: COLUMN_COUNT }, (_, index) => index).filter(
    (columnIndex) => isLegalPlacement(state.columns, tile, columnIndex),
  )
}

export function quatroPlayableTileIds(
  state: QuatroState,
  playerId: string,
): string[] {
  const player = state.players.find((candidate) => candidate.id === playerId)
  if (!player) return []
  return player.hand
    .filter((tile) => quatroLegalColumns(state, tile.id).length > 0)
    .map((tile) => tile.id)
}

function tileAt(
  columns: QuatroState['columns'],
  column: number,
  row: number,
): QuatroTile | undefined {
  if (
    column < 0
    || column >= COLUMN_COUNT
    || row < 0
    || row >= COLUMN_CAPACITY
  ) {
    return undefined
  }
  return columns[column][row]
}

export function findQuatroWinningLine(
  columns: QuatroState['columns'],
): QuatroWinningLine | null {
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ] as const

  for (let column = 0; column < COLUMN_COUNT; column += 1) {
    for (let row = 0; row < COLUMN_CAPACITY; row += 1) {
      const start = tileAt(columns, column, row)
      if (!start) continue
      for (const [columnStep, rowStep] of directions) {
        const cells = Array.from({ length: 4 }, (_, offset) => ({
          column: column + columnStep * offset,
          row: row + rowStep * offset,
        }))
        const tiles = cells.map((cell) =>
          tileAt(columns, cell.column, cell.row),
        )
        if (tiles.some((candidate) => !candidate)) continue
        const lineTiles = tiles as QuatroTile[]
        if (lineTiles.every((candidate) => candidate.color === start.color)) {
          return { match: 'color', color: start.color, cells }
        }
        if (lineTiles.every((candidate) => candidate.value === start.value)) {
          return { match: 'number', value: start.value, cells }
        }
      }
    }
  }
  return null
}

function refillPlayer(
  player: QuatroPlayer,
  bag: QuatroTile[],
): {
  player: QuatroPlayer
  bag: QuatroTile[]
  drawn: QuatroTile[]
} {
  const nextHand = [...player.hand]
  const nextBag = [...bag]
  const drawn: QuatroTile[] = []
  while (nextHand.length < 3 && nextBag.length > 0) {
    const nextTile = nextBag.shift()
    if (!nextTile) break
    nextHand.push(nextTile)
    drawn.push(nextTile)
  }
  return {
    player: { ...player, hand: nextHand, handCount: nextHand.length },
    bag: nextBag,
    drawn,
  }
}

function finishResolvedMove(
  state: QuatroState,
  playerId: string,
  random: QuatroRandom,
): QuatroState {
  void random
  const winningLine = findQuatroWinningLine(state.columns)
  if (winningLine) {
    return {
      ...state,
      phase: 'gameOver',
      winnerId: playerId,
      winningLine,
      events: [
        ...state.events,
        { kind: 'win', playerId, line: winningLine },
      ],
    }
  }

  const players: [QuatroPlayer, QuatroPlayer] = [
    state.players[0],
    state.players[1],
  ]
  const active = players[state.activePlayerIndex]
  const refill = refillPlayer(active, state.bag)
  players[state.activePlayerIndex] = refill.player
  const nextActivePlayerIndex = state.activePlayerIndex === 0 ? 1 : 0
  const clearsMinus2Refill = state.minus2RefillPlayerId === active.id
  return {
    ...state,
    players,
    bag: refill.bag,
    activePlayerIndex: nextActivePlayerIndex,
    selectedTileId: null,
    selectedColumn: null,
    pendingSwapFirstColumn: null,
    pendingPushColumn: null,
    pendingPushTileId: null,
    minus2RefillPlayerId: clearsMinus2Refill
      ? null
      : state.minus2RefillPlayerId,
    exchangeDrawnTileId: null,
    events: [
      ...state.events,
      ...refill.drawn.map((drawnTile) => ({
        kind: 'draw' as const,
        playerId: active.id,
        tileId: drawnTile.id,
      })),
      { kind: 'turn', playerId: players[nextActivePlayerIndex].id },
    ],
  }
}

export function quatroPlaceTile(
  state: QuatroState,
  playerId: string,
  tileId: string,
  columnIndex: number,
  random: QuatroRandom,
): QuatroState {
  const active = state.players[state.activePlayerIndex]
  if (state.phase !== 'playing') throw new Error('Quatro is not accepting placements')
  if (active.id !== playerId) throw new Error('It is not this player’s turn')
  const handIndex = active.hand.findIndex((tile) => tile.id === tileId)
  if (handIndex < 0) throw new Error('Tile is not in the active player’s hand')
  if (!quatroLegalColumns(state, tileId).includes(columnIndex)) {
    throw new Error('Tile cannot be placed in that column')
  }

  const playedTile = active.hand[handIndex]
  const hand = active.hand.filter((_, index) => index !== handIndex)
  const players: [QuatroPlayer, QuatroPlayer] = [
    state.players[0],
    state.players[1],
  ]
  players[state.activePlayerIndex] = {
    ...active,
    hand,
    handCount: hand.length,
  }
  const columns = cloneColumns(state.columns)
  const simulation = simulatedPlacement(columns[columnIndex], playedTile)
  if (!simulation) throw new Error('Column cannot accept this tile')
  const previousBottom = columns[columnIndex][0]
  columns[columnIndex] = simulation.column

  const placed: QuatroState = {
    ...state,
    players,
    columns,
    transitionSequence: state.transitionSequence + 1,
    selectedTileId: playedTile.id,
    selectedColumn: columnIndex,
    events: [
      {
        kind: 'drop',
        playerId,
        tileId,
        column: columnIndex,
        row: simulation.landingRow,
      },
    ],
  }

  if (playedTile.action === 'swap') {
    return { ...placed, phase: 'selectSwapFirst' }
  }
  if (playedTile.action === 'push' && state.columns[columnIndex].length === 0) {
    return {
      ...placed,
      phase: 'chooseEmptyPush',
      pendingPushColumn: columnIndex,
      pendingPushTileId: playedTile.id,
    }
  }
  if (playedTile.action === 'push') {
    const pushed = {
      ...placed,
      bag: previousBottom
        ? shuffleQuatroTiles([...placed.bag, previousBottom], random)
        : placed.bag,
      events: [
        ...placed.events,
        {
          kind: 'push' as const,
          column: columnIndex,
          tileId,
          ejectedTileId: previousBottom?.id ?? null,
        },
      ],
    }
    return finishResolvedMove(pushed, playerId, random)
  }
  if (playedTile.action === 'minus2') {
    const opponentIndex = state.activePlayerIndex === 0 ? 1 : 0
    const opponent = players[opponentIndex]
    if (opponent.hand.length < 2) {
      throw new Error('Minus 2 requires two opponent tiles')
    }
    const remainingHand = [...opponent.hand]
    const removed: QuatroTile[] = []
    for (let count = 0; count < 2; count += 1) {
      const selectedIndex = random.int(remainingHand.length)
      if (
        !Number.isInteger(selectedIndex)
        || selectedIndex < 0
        || selectedIndex >= remainingHand.length
      ) {
        throw new RangeError('Quatro random source returned an invalid index')
      }
      const [selected] = remainingHand.splice(selectedIndex, 1)
      removed.push(selected)
    }
    const attackedPlayers: [QuatroPlayer, QuatroPlayer] = [
      placed.players[0],
      placed.players[1],
    ]
    attackedPlayers[opponentIndex] = {
      ...opponent,
      hand: remainingHand,
      handCount: remainingHand.length,
    }
    const attacked: QuatroState = {
      ...placed,
      players: attackedPlayers,
      bag: shuffleQuatroTiles([...placed.bag, ...removed], random),
      minus2RefillPlayerId: opponent.id,
      events: [
        ...placed.events,
        {
          kind: 'minus2Return',
          playerId: opponent.id,
          tileIds: [removed[0].id, removed[1].id],
        },
      ],
    }
    return finishResolvedMove(attacked, playerId, random)
  }

  return finishResolvedMove(placed, playerId, random)
}

function assertActivePlayer(state: QuatroState, playerId: string): void {
  if (state.players[state.activePlayerIndex].id !== playerId) {
    throw new Error('It is not this player’s turn')
  }
}

export function quatroSelectSwapColumn(
  state: QuatroState,
  playerId: string,
  columnIndex: number,
  random: QuatroRandom,
): QuatroState {
  assertActivePlayer(state, playerId)
  if (
    !Number.isInteger(columnIndex)
    || columnIndex < 0
    || columnIndex >= COLUMN_COUNT
  ) {
    throw new Error('Swap column is outside the board')
  }
  if (state.phase === 'selectSwapFirst') {
    return {
      ...state,
      phase: 'selectSwapSecond',
      pendingSwapFirstColumn: columnIndex,
      transitionSequence: state.transitionSequence + 1,
      events: [],
    }
  }
  if (
    state.phase !== 'selectSwapSecond'
    || state.pendingSwapFirstColumn === null
  ) {
    throw new Error('A Swap action is not awaiting this selection')
  }
  if (columnIndex === state.pendingSwapFirstColumn) {
    throw new Error('Swap requires two different columns')
  }

  const firstColumn = state.pendingSwapFirstColumn
  const columns = cloneColumns(state.columns)
  ;[columns[firstColumn], columns[columnIndex]] = [
    columns[columnIndex],
    columns[firstColumn],
  ]
  return finishResolvedMove(
    {
      ...state,
      columns,
      phase: 'playing',
      transitionSequence: state.transitionSequence + 1,
      events: [{ kind: 'swap', columns: [firstColumn, columnIndex] }],
    },
    playerId,
    random,
  )
}

export function quatroResolveEmptyPush(
  state: QuatroState,
  playerId: string,
  pushOut: boolean,
  random: QuatroRandom,
): QuatroState {
  assertActivePlayer(state, playerId)
  if (
    state.phase !== 'chooseEmptyPush'
    || state.pendingPushColumn === null
    || state.pendingPushTileId === null
  ) {
    throw new Error('An empty-column Push choice is not pending')
  }
  const columnIndex = state.pendingPushColumn
  const column = state.columns[columnIndex]
  const pushedTile = column.find(
    (candidate) => candidate.id === state.pendingPushTileId,
  )
  if (!pushedTile || column.length !== 1) {
    throw new Error('The pending Push tile is no longer in its column')
  }

  const columns = cloneColumns(state.columns)
  let bag = state.bag
  if (pushOut) {
    columns[columnIndex] = []
    bag = shuffleQuatroTiles([...bag, pushedTile], random)
  }
  return finishResolvedMove(
    {
      ...state,
      columns,
      bag,
      phase: 'playing',
      transitionSequence: state.transitionSequence + 1,
      events: [
        {
          kind: 'push',
          column: columnIndex,
          tileId: pushedTile.id,
          ejectedTileId: pushOut ? pushedTile.id : null,
        },
      ],
    },
    playerId,
    random,
  )
}

export function quatroExchangeTile(
  state: QuatroState,
  playerId: string,
  tileId: string,
  random: QuatroRandom,
): QuatroState {
  assertActivePlayer(state, playerId)
  if (state.phase !== 'playing') {
    throw new Error('Tiles can only be exchanged during normal play')
  }
  if (quatroPlayableTileIds(state, playerId).length > 0) {
    throw new Error('A tile can only be exchanged when no tile is playable')
  }

  const active = state.players[state.activePlayerIndex]
  const returnedIndex = active.hand.findIndex(
    (candidate) => candidate.id === tileId,
  )
  if (returnedIndex < 0) {
    throw new Error('Tile is not in the active player’s hand')
  }
  const hand = active.hand.filter((_, index) => index !== returnedIndex)
  const exchangeBag = [...state.bag, active.hand[returnedIndex]]
  const drawIndex = random.int(exchangeBag.length)
  if (
    !Number.isInteger(drawIndex)
    || drawIndex < 0
    || drawIndex >= exchangeBag.length
  ) {
    throw new RangeError('Quatro random source returned an invalid index')
  }
  const [drawn] = exchangeBag.splice(drawIndex, 1)
  hand.push(drawn)
  const players: [QuatroPlayer, QuatroPlayer] = [
    state.players[0],
    state.players[1],
  ]
  players[state.activePlayerIndex] = {
    ...active,
    hand,
    handCount: hand.length,
  }
  const exchanged: QuatroState = {
    ...state,
    players,
    bag: exchangeBag,
    exchangeDrawnTileId: drawn.id,
    transitionSequence: state.transitionSequence + 1,
    events: [
      { kind: 'returnToBag', playerId, tileId },
      { kind: 'draw', playerId, tileId: drawn.id },
    ],
  }

  if (quatroLegalColumns(exchanged, drawn.id).length > 0) {
    return exchanged
  }
  return finishResolvedMove(exchanged, playerId, random)
}

export function quatroCompleteTurn(
  state: QuatroState,
  random: QuatroRandom,
): QuatroState {
  return finishResolvedMove(
    state,
    state.players[state.activePlayerIndex].id,
    random,
  )
}
