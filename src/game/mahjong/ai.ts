import { mahjongLegalClaimOptions } from './rules'
import { mahjongTileSortValue, sortMahjongTiles } from './tiles'
import { evaluateMahjongWin } from './win'
import type { AiDifficulty } from '../types'
import type { MahjongClaimResponse, MahjongState, MahjongTile } from './types'

export type MahjongAiAction =
  | { type: 'draw' }
  | { type: 'declareWin' }
  | { type: 'discard'; tileId: string; reasonKey: MahjongDiscardReasonKey }
  | { type: 'claim'; claimAction: Exclude<MahjongClaimResponse['action'], 'pass'>; tileIds: string[] }
  | { type: 'pass' }

export type MahjongDiscardReasonKey =
  | 'mahjong.reason.isolatedHonor'
  | 'mahjong.reason.isolatedSuit'
  | 'mahjong.reason.isolatedTerminal'
  | 'mahjong.reason.keepPair'
  | 'mahjong.reason.keepSequence'
  | 'mahjong.reason.keepNearSequence'
  | 'mahjong.reason.weakConnector'
  | 'mahjong.reason.breakDuplicate'
  | 'mahjong.reason.lowestRisk'

export interface MahjongDiscardChoice {
  tile: MahjongTile
  reasonKey: MahjongDiscardReasonKey
  score: number
}

export function chooseMahjongAiAction(state: MahjongState, playerId?: string): MahjongAiAction {
  if (state.phase === 'claim') {
    const responderId = playerId ?? firstAiResponderId(state)
    if (!responderId) return { type: 'pass' }
    const responder = state.players.find((player) => player.id === responderId)
    const options = mahjongLegalClaimOptions(state, responderId).sort((left, right) => right.priority - left.priority)
    const win = options.find((option): option is typeof option & { action: 'win' } => option.action === 'win')
    if (win) return { type: 'claim', claimAction: win.action, tileIds: win.tileIds }
    if (responder?.aiDifficulty === 'easy') return { type: 'pass' }
    const strongClaim = options.find((option) => option.action === 'kong' || option.action === 'pong')
    const claim = strongClaim ?? (responder?.aiDifficulty === 'hard' ? options[0] : undefined)
    if (!claim || claim.action === 'pass') return { type: 'pass' }
    return { type: 'claim', claimAction: claim.action, tileIds: claim.tileIds }
  }

  const active = state.players[state.activePlayerIndex]
  if (!active || (playerId && active.id !== playerId)) return { type: 'pass' }

  if (state.phase === 'draw') return { type: 'draw' }
  if (state.phase !== 'discard') return { type: 'pass' }

  const win = evaluateMahjongWin(active.concealed, { allowSevenPairs: state.ruleProfile.allowSevenPairs, exposedMeldCount: active.exposedMelds.length })
  if (win.winning) return { type: 'declareWin' }

  const discard = chooseMahjongDiscard(active.concealed, active.aiDifficulty ?? 'medium')
  return { type: 'discard', tileId: discard.tile.id, reasonKey: discard.reasonKey }
}

export function chooseMahjongDiscard(tiles: MahjongTile[], difficulty: AiDifficulty): MahjongDiscardChoice {
  const choices = sortMahjongTiles(tiles).map((tile) => scoreDiscardCandidate(tile, tiles, difficulty))
  return choices.sort((left, right) => left.score - right.score || mahjongTileSortValue(left.tile) - mahjongTileSortValue(right.tile))[0]
}

function scoreDiscardCandidate(tile: MahjongTile, hand: MahjongTile[], difficulty: AiDifficulty): MahjongDiscardChoice {
  const sameCount = hand.filter((candidate) => candidate.key === tile.key).length
  const shapeScore = tile.category === 'suit' ? suitShapeScore(tile, hand, difficulty) : honorShapeScore(sameCount, difficulty)
  const duplicateScore = sameCount >= 2 ? 40 + sameCount * 8 : 0
  const score = shapeScore + duplicateScore
  return {
    tile,
    score,
    reasonKey: discardReasonFor(tile, hand, score, sameCount),
  }
}

function suitShapeScore(tile: Extract<MahjongTile, { category: 'suit' }>, hand: MahjongTile[], difficulty: AiDifficulty): number {
  const ranks = hand
    .filter((candidate): candidate is Extract<MahjongTile, { category: 'suit' }> => candidate.category === 'suit' && candidate.suit === tile.suit && candidate.id !== tile.id)
    .map((candidate) => candidate.rank)
  const adjacent = ranks.filter((rank) => Math.abs(rank - tile.rank) === 1).length
  const gap = ranks.filter((rank) => Math.abs(rank - tile.rank) === 2).length
  const difficultyWeight = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1
  const shapeScore = adjacent * 18 * difficultyWeight + gap * 7 * difficultyWeight
  if (shapeScore === 0 && (tile.rank === 1 || tile.rank === 9)) {
    return difficulty === 'hard' ? -6 : difficulty === 'medium' ? -3 : 0
  }
  return shapeScore
}

function honorShapeScore(sameCount: number, difficulty: AiDifficulty): number {
  if (sameCount >= 2) return 24
  if (difficulty === 'hard') return -12
  if (difficulty === 'medium') return -8
  return 0
}

function discardReasonFor(tile: MahjongTile, hand: MahjongTile[], score: number, sameCount: number): MahjongDiscardReasonKey {
  if ((tile.category === 'wind' || tile.category === 'dragon') && sameCount === 1) return 'mahjong.reason.isolatedHonor'
  if (sameCount >= 2) return 'mahjong.reason.breakDuplicate'
  if (tile.category === 'suit') {
    const hasNeighbor = hand.some((candidate) => candidate.category === 'suit' && candidate.suit === tile.suit && candidate.id !== tile.id && Math.abs(candidate.rank - tile.rank) <= 2)
    if (!hasNeighbor && (tile.rank === 1 || tile.rank === 9)) return 'mahjong.reason.isolatedTerminal'
    return hasNeighbor ? 'mahjong.reason.weakConnector' : 'mahjong.reason.isolatedSuit'
  }
  return score <= 0 ? 'mahjong.reason.lowestRisk' : 'mahjong.reason.weakConnector'
}

function firstAiResponderId(state: MahjongState): string | null {
  const eligible = state.claimWindow?.eligiblePlayerIds ?? []
  return state.players.find((player) => player.type === 'ai' && eligible.includes(player.id))?.id ?? eligible[0] ?? null
}
