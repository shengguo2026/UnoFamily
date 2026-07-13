import type { AiDifficulty } from '../types'

export type MahjongSuit = 'dots' | 'bamboo' | 'characters'
export type MahjongWind = 'east' | 'south' | 'west' | 'north'
export type MahjongDragon = 'red' | 'green' | 'white'
export type MahjongFlower = 'plum' | 'orchid' | 'chrysanthemum' | 'bamboo'
export type MahjongSeason = 'spring' | 'summer' | 'autumn' | 'winter'

export type MahjongTile =
  | {
      id: string
      category: 'suit'
      suit: MahjongSuit
      rank: number
      copy: number
      key: string
    }
  | {
      id: string
      category: 'wind'
      wind: MahjongWind
      copy: number
      key: string
    }
  | {
      id: string
      category: 'dragon'
      dragon: MahjongDragon
      copy: number
      key: string
    }
  | {
      id: string
      category: 'flower'
      flower: MahjongFlower
      copy: number
      key: string
    }
  | {
      id: string
      category: 'season'
      season: MahjongSeason
      copy: number
      key: string
    }

export type MahjongMeldKind = 'chow' | 'pong' | 'kong'

export interface MahjongMeld {
  kind: MahjongMeldKind
  tiles: MahjongTile[]
  claimedFromPlayerId?: string
  claimedTileId?: string
  concealed?: boolean
}

export interface MahjongPlayerState {
  id: string
  name: string
  type: 'human' | 'ai'
  aiDifficulty?: AiDifficulty
  concealed: MahjongTile[]
  exposedMelds: MahjongMeld[]
  flowers: MahjongTile[]
  discardRiver: MahjongTile[]
  score: number
  wind: MahjongWind
}

export interface MahjongClaimWindow {
  discard: MahjongTile
  discarderId: string
  eligiblePlayerIds: string[]
  responses: Record<string, MahjongClaimResponse>
  robbingKong?: {
    meldIndex: number
  }
}

export interface MahjongClaimResponse {
  action: 'pass' | 'win' | 'pong' | 'kong' | 'chow'
  tileIds?: string[]
}

export type MahjongPhase = 'draw' | 'discard' | 'claim' | 'roundOver'
export type MahjongRuleVariant = 'standard'

export interface MahjongRuleProfile {
  variant: MahjongRuleVariant
  baseWinPoints: number
  dealerBonusMultiplier: number
  allowSevenPairs: boolean
  rotateDealerOnDraw: boolean
  dealerRepeatsAfterWin: boolean
}

export interface MahjongScorePayment {
  playerId: string
  delta: number
}

export interface MahjongRoundResult {
  kind: 'win' | 'draw'
  winnerId: string | null
  wonFromPlayerId: string | null
  selfDraw: boolean
  pattern: MahjongWinPattern | null
  payments: MahjongScorePayment[]
}

export interface MahjongState {
  players: MahjongPlayerState[]
  wall: MahjongTile[]
  deadWall: MahjongTile[]
  activePlayerIndex: number
  dealerIndex: number
  prevailingWind: MahjongWind
  phase: MahjongPhase
  claimWindow: MahjongClaimWindow | null
  winnerId: string | null
  ruleProfile: MahjongRuleProfile
  roundResult: MahjongRoundResult | null
  currentRound: number
  log: Array<{ id: number; text: string }>
  nextLogId: number
}

export type MahjongWinPattern = 'standard' | 'sevenPairs'
export type MahjongWinRejectReason = 'wrongTileCount' | 'tooManyCopies' | 'noValidGrouping'

export interface MahjongWinMeld {
  kind: 'chow' | 'pong'
  tiles: MahjongTile[]
}

export interface MahjongWinResult {
  winning: boolean
  pattern: MahjongWinPattern | null
  melds: MahjongWinMeld[]
  pair: MahjongTile[] | null
  reason?: MahjongWinRejectReason
}
