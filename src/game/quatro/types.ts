import type {
  AiDifficulty,
  AnimationSpeed,
  AvatarId,
  GameMode,
} from '../types'

export type QuatroColor = 'red' | 'green' | 'yellow' | 'blue'
export type QuatroActionKind = 'swap' | 'push' | 'minus2'
export type QuatroPhase =
  | 'playing'
  | 'selectSwapFirst'
  | 'selectSwapSecond'
  | 'chooseEmptyPush'
  | 'gameOver'

export interface QuatroTile {
  id: string
  color: QuatroColor
  value: 0 | 1 | 2 | 3 | 4 | 5
  action: QuatroActionKind | null
}

export interface QuatroPlayer {
  id: string
  name: string
  type: 'human' | 'ai'
  aiDifficulty?: AiDifficulty
  avatarId: AvatarId
  hand: QuatroTile[]
  handCount: number
}

export interface QuatroRandom {
  int(maxExclusive: number): number
}

export interface QuatroWinningLine {
  match: 'color' | 'number'
  color?: QuatroColor
  value?: QuatroTile['value']
  cells: Array<{ column: number; row: number }>
}

export type QuatroAction =
  | { type: 'place'; playerId: string; tileId: string; column: number }
  | { type: 'selectSwapColumn'; playerId: string; column: number }
  | { type: 'resolveEmptyPush'; playerId: string; pushOut: boolean }
  | { type: 'exchange'; playerId: string; tileId: string }

export type QuatroAnimationEvent =
  | { kind: 'bagShake' }
  | {
      kind: 'deal'
      movements: Array<{ playerId: string; tileId: string }>
    }
  | {
      kind: 'drop'
      playerId: string
      tileId: string
      column: number
      row: number
    }
  | { kind: 'swap'; columns: [number, number] }
  | {
      kind: 'push'
      column: number
      tileId: string
      ejectedTileId: string | null
    }
  | { kind: 'minus2Return'; playerId: string; tileIds: [string, string] }
  | { kind: 'returnToBag'; playerId: string; tileId: string }
  | { kind: 'draw'; playerId: string; tileId: string }
  | { kind: 'turn'; playerId: string }
  | { kind: 'win'; playerId: string; line: QuatroWinningLine }

export interface QuatroState {
  players: [QuatroPlayer, QuatroPlayer]
  bag: QuatroTile[]
  bagCount?: number
  columns: [
    QuatroTile[],
    QuatroTile[],
    QuatroTile[],
    QuatroTile[],
    QuatroTile[],
    QuatroTile[],
    QuatroTile[],
  ]
  activePlayerIndex: 0 | 1
  phase: QuatroPhase
  selectedTileId: string | null
  selectedColumn: number | null
  pendingSwapFirstColumn: number | null
  pendingPushColumn: number | null
  pendingPushTileId: string | null
  minus2RefillPlayerId: string | null
  exchangeDrawnTileId: string | null
  winnerId: string | null
  winningLine: QuatroWinningLine | null
  transitionSequence: number
  events: QuatroAnimationEvent[]
  mode: GameMode
  aiDifficulty: AiDifficulty
  animationSpeed: AnimationSpeed
  log: string[]
}
