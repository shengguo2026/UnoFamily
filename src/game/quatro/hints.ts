import { chooseQuatroAiAction } from './ai'
import {
  quatroLegalColumns,
  quatroPlayableTileIds,
} from './rules'
import type { QuatroState } from './types'

export interface QuatroHint {
  kind:
    | 'place'
    | 'swapFirst'
    | 'swapSecond'
    | 'emptyPush'
    | 'exchange'
    | 'wait'
    | 'won'
  tileIds: string[]
  columns: number[]
  reasonKey: string
}

const firstRandom = { int: () => 0 }

export function getQuatroHint(
  state: QuatroState,
  viewerPlayerId: string,
): QuatroHint {
  if (state.phase === 'gameOver') {
    return {
      kind: 'won',
      tileIds: [],
      columns: [],
      reasonKey: 'hint.gameOver',
    }
  }
  const active = state.players[state.activePlayerIndex]
  if (active.id !== viewerPlayerId) {
    return {
      kind: 'wait',
      tileIds: [],
      columns: [],
      reasonKey: 'hint.wait',
    }
  }
  if (state.phase === 'selectSwapFirst') {
    return {
      kind: 'swapFirst',
      tileIds: [],
      columns: [0, 1, 2, 3, 4, 5, 6],
      reasonKey: 'hint.swapFirst',
    }
  }
  if (state.phase === 'selectSwapSecond') {
    return {
      kind: 'swapSecond',
      tileIds: [],
      columns: [0, 1, 2, 3, 4, 5, 6].filter(
        (column) => column !== state.pendingSwapFirstColumn,
      ),
      reasonKey: 'hint.swapSecond',
    }
  }
  if (state.phase === 'chooseEmptyPush') {
    return {
      kind: 'emptyPush',
      tileIds: state.pendingPushTileId
        ? [state.pendingPushTileId]
        : [],
      columns: state.pendingPushColumn === null
        ? []
        : [state.pendingPushColumn],
      reasonKey: 'hint.emptyPush',
    }
  }

  const playableTileIds = quatroPlayableTileIds(state, viewerPlayerId)
  if (playableTileIds.length === 0) {
    return {
      kind: 'exchange',
      tileIds: active.hand.map((tile) => tile.id),
      columns: [],
      reasonKey: 'hint.exchange',
    }
  }
  const columns = [
    ...new Set(
      playableTileIds.flatMap((tileId) =>
        quatroLegalColumns(state, tileId),
      ),
    ),
  ].sort((left, right) => left - right)
  const recommended = chooseQuatroAiAction(
    {
      ...state,
      players: [
        {
          ...state.players[0],
          aiDifficulty:
            state.players[0].id === viewerPlayerId
              ? 'medium'
              : state.players[0].aiDifficulty,
        },
        {
          ...state.players[1],
          aiDifficulty:
            state.players[1].id === viewerPlayerId
              ? 'medium'
              : state.players[1].aiDifficulty,
        },
      ],
    },
    firstRandom,
  )

  return {
    kind: 'place',
    tileIds: playableTileIds,
    columns,
    reasonKey: recommended?.type === 'place'
      ? `hint.place:${recommended.tileId}:${recommended.column}`
      : 'hint.place',
  }
}
