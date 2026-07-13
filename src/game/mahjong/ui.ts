import { evaluateMahjongWin } from './win'
import { mahjongLegalClaimOptions } from './rules'
import type { MahjongClaimResponse, MahjongState } from './types'

export type MahjongControlAction =
  | 'draw'
  | 'discard'
  | 'declareWin'
  | 'declareKong'
  | 'claimWin'
  | 'claimPong'
  | 'claimKong'
  | 'claimChow'
  | 'pass'
  | 'nextRound'

export function availableMahjongControlActions(state: MahjongState, playerId: string, selectedTileId: string | null): MahjongControlAction[] {
  if (state.phase === 'roundOver') return ['nextRound']
  if (state.phase === 'draw' && state.players[state.activePlayerIndex]?.id === playerId) return ['draw']
  if (state.phase === 'discard' && state.players[state.activePlayerIndex]?.id === playerId) {
    const player = state.players[state.activePlayerIndex]
    const actions: MahjongControlAction[] = []
    if (evaluateMahjongWin(player.concealed, { allowSevenPairs: state.ruleProfile.allowSevenPairs, exposedMeldCount: player.exposedMelds.length }).winning) actions.push('declareWin')
    if (hasKongDeclaration(player, selectedTileId)) actions.push('declareKong')
    if (player.concealed.length > 0 && (!selectedTileId || player.concealed.some((tile) => tile.id === selectedTileId))) actions.push('discard')
    return actions
  }
  if (state.phase === 'claim') {
    const claimActions = mahjongLegalClaimOptions(state, playerId).map((option) => claimToControlAction(option.action))
    return [...claimActions, 'pass'].filter((action): action is MahjongControlAction => Boolean(action))
  }
  return []
}

function hasKongDeclaration(player: MahjongState['players'][number], selectedTileId: string | null): boolean {
  const selected = selectedTileId ? player.concealed.find((tile) => tile.id === selectedTileId) : null
  const keys = selected ? [selected.key] : [...new Set(player.concealed.map((tile) => tile.key))]
  return keys.some((key) => {
    if (player.concealed.filter((tile) => tile.key === key).length === 4) return true
    return player.concealed.some((tile) => tile.key === key) && player.exposedMelds.some((meld) => meld.kind === 'pong' && meld.tiles.every((meldTile) => meldTile.key === key))
  })
}

function claimToControlAction(action: MahjongClaimResponse['action']): MahjongControlAction | null {
  if (action === 'win') return 'claimWin'
  if (action === 'pong') return 'claimPong'
  if (action === 'kong') return 'claimKong'
  if (action === 'chow') return 'claimChow'
  return null
}
