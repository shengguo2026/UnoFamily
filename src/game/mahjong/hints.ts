import { chooseMahjongAiAction } from './ai'
import { mahjongLegalClaimOptions } from './rules'
import type { MahjongAiAction, MahjongDiscardReasonKey } from './ai'
import type { MahjongState, MahjongTile } from './types'

export interface MahjongHint {
  titleKey: string
  bodyKey: string
  suggestedAction: MahjongAiAction
  reasonKeys: MahjongDiscardReasonKey[]
}

export function getMahjongHint(state: MahjongState, playerId: string): MahjongHint {
  if (state.phase === 'roundOver') {
    return {
      titleKey: 'mahjong.hint.roundOver',
      bodyKey: state.roundResult?.kind === 'win' ? 'mahjong.hint.roundWonBody' : 'mahjong.hint.roundDrawBody',
      suggestedAction: { type: 'pass' },
      reasonKeys: [],
    }
  }

  if (state.phase === 'claim' && state.claimWindow?.eligiblePlayerIds.includes(playerId)) {
    const action = chooseMahjongAiAction(state, playerId)
    if (action.type === 'claim' && action.claimAction === 'win') {
      return {
        titleKey: 'mahjong.hint.claimWin',
        bodyKey: 'mahjong.hint.claimWinBody',
        suggestedAction: action,
        reasonKeys: [],
      }
    }
    if (action.type === 'claim') {
      return {
        titleKey: 'mahjong.hint.claim',
        bodyKey: claimBodyKey(action.claimAction),
        suggestedAction: action,
        reasonKeys: [],
      }
    }
    return {
      titleKey: 'mahjong.hint.pass',
      bodyKey: 'mahjong.hint.passBody',
      suggestedAction: { type: 'pass' },
      reasonKeys: [],
    }
  }

  const active = state.players[state.activePlayerIndex]
  if (!active || active.id !== playerId) {
    return {
      titleKey: 'mahjong.hint.wait',
      bodyKey: 'mahjong.hint.waitBody',
      suggestedAction: { type: 'pass' },
      reasonKeys: [],
    }
  }

  if (state.phase === 'draw') {
    return {
      titleKey: 'mahjong.hint.draw',
      bodyKey: 'mahjong.hint.drawBody',
      suggestedAction: { type: 'draw' },
      reasonKeys: [],
    }
  }

  const action = chooseMahjongAiAction(state, playerId)
  if (action.type === 'declareWin') {
    return {
      titleKey: 'mahjong.hint.declareWin',
      bodyKey: 'mahjong.hint.declareWinBody',
      suggestedAction: action,
      reasonKeys: [],
    }
  }

  if (action.type === 'discard') {
    return {
      titleKey: 'mahjong.hint.discard',
      bodyKey: 'mahjong.hint.discardBody',
      suggestedAction: action,
      reasonKeys: [action.reasonKey, ...discardContextReasonKeys(active.concealed, action.tileId)],
    }
  }

  return {
    titleKey: 'mahjong.hint.wait',
    bodyKey: 'mahjong.hint.waitBody',
    suggestedAction: { type: 'pass' },
    reasonKeys: [],
  }
}

function claimBodyKey(action: Exclude<ReturnType<typeof mahjongLegalClaimOptions>[number]['action'], 'pass' | 'win'> | 'win'): string {
  if (action === 'kong') return 'mahjong.hint.claimKongBody'
  if (action === 'pong') return 'mahjong.hint.claimPongBody'
  if (action === 'chow') return 'mahjong.hint.claimChowBody'
  return 'mahjong.hint.claimWinBody'
}

function discardContextReasonKeys(tiles: MahjongTile[], discardedTileId: string): MahjongDiscardReasonKey[] {
  const reasons: MahjongDiscardReasonKey[] = []
  const remainingTiles = tiles.filter((tile) => tile.id !== discardedTileId)
  const remainingCounts = new Map<string, number>()
  remainingTiles.forEach((tile) => {
      remainingCounts.set(tile.key, (remainingCounts.get(tile.key) ?? 0) + 1)
    })
  if ([...remainingCounts.values()].some((count) => count >= 2)) reasons.push('mahjong.reason.keepPair')
  if (hasCompleteSuitSequence(remainingTiles)) reasons.push('mahjong.reason.keepSequence')
  if (hasNearSuitSequence(remainingTiles)) reasons.push('mahjong.reason.keepNearSequence')
  return reasons
}

function hasCompleteSuitSequence(tiles: MahjongTile[]): boolean {
  const ranksBySuit = new Map<string, Set<number>>()
  tiles.forEach((tile) => {
    if (tile.category !== 'suit') return
    const ranks = ranksBySuit.get(tile.suit) ?? new Set<number>()
    ranks.add(tile.rank)
    ranksBySuit.set(tile.suit, ranks)
  })
  return [...ranksBySuit.values()].some((ranks) => {
    for (let rank = 1; rank <= 7; rank += 1) {
      if (ranks.has(rank) && ranks.has(rank + 1) && ranks.has(rank + 2)) return true
    }
    return false
  })
}

function hasNearSuitSequence(tiles: MahjongTile[]): boolean {
  const ranksBySuit = new Map<string, Set<number>>()
  tiles.forEach((tile) => {
    if (tile.category !== 'suit') return
    const ranks = ranksBySuit.get(tile.suit) ?? new Set<number>()
    ranks.add(tile.rank)
    ranksBySuit.set(tile.suit, ranks)
  })
  return [...ranksBySuit.values()].some((ranks) => {
    for (let rank = 1; rank <= 9; rank += 1) {
      if (ranks.has(rank) && (ranks.has(rank + 1) || ranks.has(rank + 2))) return true
    }
    return false
  })
}
