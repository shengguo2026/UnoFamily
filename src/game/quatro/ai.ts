import {
  findQuatroWinningLine,
  quatroLegalColumns,
  quatroPlaceTile,
  quatroPlayableTileIds,
} from './rules'
import type {
  QuatroRandom,
  QuatroState,
  QuatroTile,
} from './types'

export type QuatroAiAction =
  | { type: 'place'; tileId: string; column: number }
  | { type: 'selectSwap'; column: number }
  | { type: 'resolveEmptyPush'; pushOut: boolean }
  | { type: 'exchange'; tileId: string }

const evaluationRandom: QuatroRandom = {
  int(maxExclusive) {
    return Math.max(0, maxExclusive - 1)
  },
}

export function listQuatroLegalActions(
  state: QuatroState,
): QuatroAiAction[] {
  if (state.phase === 'gameOver') return []
  if (state.phase === 'selectSwapFirst') {
    return Array.from({ length: 7 }, (_, column) => ({
      type: 'selectSwap' as const,
      column,
    }))
  }
  if (state.phase === 'selectSwapSecond') {
    return Array.from({ length: 7 }, (_, column) => column)
      .filter((column) => column !== state.pendingSwapFirstColumn)
      .map((column) => ({ type: 'selectSwap' as const, column }))
  }
  if (state.phase === 'chooseEmptyPush') {
    return [
      { type: 'resolveEmptyPush', pushOut: false },
      { type: 'resolveEmptyPush', pushOut: true },
    ]
  }
  if (state.phase !== 'playing') return []

  const active = state.players[state.activePlayerIndex]
  const placements = active.hand.flatMap((handTile) =>
    quatroLegalColumns(state, handTile.id).map((column) => ({
      type: 'place' as const,
      tileId: handTile.id,
      column,
    })),
  )
  if (placements.length > 0) return placements
  return active.hand.map((handTile) => ({
    type: 'exchange' as const,
    tileId: handTile.id,
  }))
}

function actionKey(action: QuatroAiAction): string {
  if (action.type === 'place') {
    return `0:${action.tileId}:${String(action.column).padStart(2, '0')}`
  }
  if (action.type === 'selectSwap') {
    return `1:${String(action.column).padStart(2, '0')}`
  }
  if (action.type === 'resolveEmptyPush') {
    return `2:${action.pushOut ? '1' : '0'}`
  }
  return `3:${action.tileId}`
}

interface Cell {
  column: number
  row: number
}

function tileAt(
  state: QuatroState,
  column: number,
  row: number,
): QuatroTile | undefined {
  return state.columns[column]?.[row]
}

function publicThreatCells(state: QuatroState): Cell[] {
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ] as const
  const cells = new Map<string, Cell>()

  for (let column = 0; column < 7; column += 1) {
    for (let row = 0; row < 6; row += 1) {
      for (const [columnStep, rowStep] of directions) {
        const segment = Array.from({ length: 4 }, (_, offset) => ({
          column: column + columnStep * offset,
          row: row + rowStep * offset,
        }))
        if (
          segment.some(
            (cell) =>
              cell.column < 0
              || cell.column >= 7
              || cell.row < 0
              || cell.row >= 6,
          )
        ) {
          continue
        }
        const segmentTiles = segment.map((cell) =>
          tileAt(state, cell.column, cell.row),
        )
        const emptyIndexes = segmentTiles
          .map((candidate, index) => candidate ? -1 : index)
          .filter((index) => index >= 0)
        if (emptyIndexes.length !== 1) continue
        const occupied = segmentTiles.filter(
          (candidate): candidate is QuatroTile => Boolean(candidate),
        )
        const sameColor = occupied.every(
          (candidate) => candidate.color === occupied[0].color,
        )
        const sameNumber = occupied.every(
          (candidate) => candidate.value === occupied[0].value,
        )
        if (!sameColor && !sameNumber) continue
        const empty = segment[emptyIndexes[0]]
        cells.set(`${empty.column}:${empty.row}`, empty)
      }
    }
  }
  return [...cells.values()]
}

function matchingWindowStrength(
  state: QuatroState,
  tile: QuatroTile,
): number {
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ] as const
  let best = 1
  for (let column = 0; column < 7; column += 1) {
    for (let row = 0; row < 6; row += 1) {
      for (const [columnStep, rowStep] of directions) {
        const segment = Array.from({ length: 4 }, (_, offset) =>
          tileAt(
            state,
            column + columnStep * offset,
            row + rowStep * offset,
          ),
        )
        const occupied = segment.filter(
          (candidate): candidate is QuatroTile => Boolean(candidate),
        )
        const colorCount = occupied.filter(
          (candidate) => candidate.color === tile.color,
        ).length
        const numberCount = occupied.filter(
          (candidate) => candidate.value === tile.value,
        ).length
        best = Math.max(best, colorCount, numberCount)
      }
    }
  }
  return best
}

function simulatePlacement(
  state: QuatroState,
  action: Extract<QuatroAiAction, { type: 'place' }>,
): QuatroState | null {
  const active = state.players[state.activePlayerIndex]
  const playedTile = active.hand.find(
    (candidate) => candidate.id === action.tileId,
  )
  if (!playedTile) return null

  if (playedTile.action === 'minus2') {
    const columns = state.columns.map(
      (column) => [...column],
    ) as QuatroState['columns']
    columns[action.column].push(playedTile)
    const winningLine = findQuatroWinningLine(columns)
    return {
      ...state,
      columns,
      winnerId: winningLine ? active.id : null,
      winningLine,
      phase: winningLine ? 'gameOver' : 'playing',
      bag: [],
    }
  }

  try {
    return quatroPlaceTile(
      { ...state, bag: [] },
      active.id,
      action.tileId,
      action.column,
      evaluationRandom,
    )
  } catch {
    return null
  }
}

function landingCell(
  before: QuatroState,
  after: QuatroState,
): Cell | null {
  const drop = after.events.find((event) => event.kind === 'drop')
  if (drop?.kind === 'drop') {
    return { column: drop.column, row: drop.row }
  }
  for (let column = 0; column < 7; column += 1) {
    if (after.columns[column].length !== before.columns[column].length) {
      return {
        column,
        row: Math.max(0, after.columns[column].length - 1),
      }
    }
  }
  return null
}

function immediateWinningPlacementCount(
  state: QuatroState,
  playerIndex: 0 | 1,
): number {
  const probe: QuatroState = {
    ...state,
    activePlayerIndex: playerIndex,
    phase: 'playing',
    selectedTileId: null,
    selectedColumn: null,
    pendingSwapFirstColumn: null,
    pendingPushColumn: null,
    pendingPushTileId: null,
    exchangeDrawnTileId: null,
    winnerId: null,
    winningLine: null,
    bag: [],
    events: [],
  }
  const playerId = probe.players[playerIndex].id
  let count = 0
  for (const tileId of quatroPlayableTileIds(probe, playerId)) {
    for (const column of quatroLegalColumns(probe, tileId)) {
      const action = { type: 'place' as const, tileId, column }
      const result = simulatePlacement(probe, action)
      if (result?.winnerId === playerId) count += 1
    }
  }
  return count
}

function scorePlacement(
  state: QuatroState,
  action: Extract<QuatroAiAction, { type: 'place' }>,
  hard: boolean,
): number {
  const active = state.players[state.activePlayerIndex]
  const tile = active.hand.find((candidate) => candidate.id === action.tileId)
  if (!tile) return Number.NEGATIVE_INFINITY
  const simulated = simulatePlacement(state, action)
  if (!simulated) return Number.NEGATIVE_INFINITY

  let score = (4 - Math.abs(3 - action.column)) * 10
  if (simulated.winnerId === active.id) score += 100_000
  const landing = landingCell(state, simulated)
  if (
    landing
    && publicThreatCells(state).some(
      (cell) =>
        cell.column === landing.column
        && cell.row === landing.row,
    )
  ) {
    score += 10_000
  }
  const strength = matchingWindowStrength(simulated, tile)
  if (strength >= 3) score += 1_000
  else if (strength === 2) score += 100
  if (tile.action === 'minus2') score += 40

  if (hard && !simulated.winnerId) {
    const winningReplies = immediateWinningPlacementCount(
      simulated,
      state.activePlayerIndex,
    )
    if (winningReplies >= 2) score += 2_500
  }
  return score
}

function rankedActionScore(
  state: QuatroState,
  action: QuatroAiAction,
  hard: boolean,
): number {
  if (action.type === 'place') return scorePlacement(state, action, hard)
  if (action.type === 'resolveEmptyPush') return action.pushOut ? 0 : 1
  if (action.type === 'selectSwap') {
    return (4 - Math.abs(3 - action.column)) * 10
  }
  return 0
}

export function chooseQuatroAiAction(
  state: QuatroState,
  random: QuatroRandom,
): QuatroAiAction | null {
  const actions = listQuatroLegalActions(state)
  if (actions.length === 0) return null
  const difficulty =
    state.players[state.activePlayerIndex].aiDifficulty
    ?? state.aiDifficulty
  if (difficulty === 'easy') {
    const selectedIndex = random.int(actions.length)
    if (
      !Number.isInteger(selectedIndex)
      || selectedIndex < 0
      || selectedIndex >= actions.length
    ) {
      throw new RangeError('Quatro random source returned an invalid index')
    }
    return actions[selectedIndex]
  }

  const hard = difficulty === 'hard'
  return [...actions].sort((left, right) => {
    const scoreDifference =
      rankedActionScore(state, right, hard)
      - rankedActionScore(state, left, hard)
    if (scoreDifference !== 0) return scoreDifference
    return actionKey(left).localeCompare(actionKey(right))
  })[0]
}
