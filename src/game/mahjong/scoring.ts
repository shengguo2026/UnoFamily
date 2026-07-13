import type { MahjongRoundResult, MahjongRuleProfile, MahjongState, MahjongWinPattern } from './types'

export const standardMahjongRuleProfile: MahjongRuleProfile = {
  variant: 'standard',
  baseWinPoints: 8,
  dealerBonusMultiplier: 2,
  allowSevenPairs: true,
  rotateDealerOnDraw: true,
  dealerRepeatsAfterWin: true,
}

export function createMahjongDrawResult(): MahjongRoundResult {
  return {
    kind: 'draw',
    winnerId: null,
    wonFromPlayerId: null,
    selfDraw: false,
    pattern: null,
    payments: [],
  }
}

export function applyMahjongWinResult(
  state: MahjongState,
  winnerId: string,
  options: { wonFromPlayerId: string | null; selfDraw: boolean; pattern: MahjongWinPattern | null },
): MahjongState {
  const dealerId = state.players[state.dealerIndex]?.id
  const payments = state.players.map((player) => {
    if (options.selfDraw) {
      if (player.id === winnerId) {
        const total = state.players
          .filter((opponent) => opponent.id !== winnerId)
          .reduce((sum, opponent) => sum + winPaymentAmount(state, winnerId, opponent.id, dealerId), 0)
        return { playerId: player.id, delta: total }
      }
      return { playerId: player.id, delta: -winPaymentAmount(state, winnerId, player.id, dealerId) }
    }

    const discardPayment = options.wonFromPlayerId ? winPaymentAmount(state, winnerId, options.wonFromPlayerId, dealerId) : state.ruleProfile.baseWinPoints
    if (player.id === winnerId) return { playerId: player.id, delta: discardPayment }
    if (player.id === options.wonFromPlayerId) return { playerId: player.id, delta: -discardPayment }
    return { playerId: player.id, delta: 0 }
  }).filter((payment) => payment.delta !== 0)

  const next: MahjongState = {
    ...state,
    phase: 'roundOver',
    winnerId,
    claimWindow: null,
    roundResult: {
      kind: 'win',
      winnerId,
      wonFromPlayerId: options.wonFromPlayerId,
      selfDraw: options.selfDraw,
      pattern: options.pattern,
      payments,
    },
    players: state.players.map((player) => {
      const payment = payments.find((candidate) => candidate.playerId === player.id)
      return payment ? { ...player, score: player.score + payment.delta } : player
    }),
  }

  return next
}

function winPaymentAmount(state: MahjongState, winnerId: string, payerId: string, dealerId?: string): number {
  const multiplier = winnerId === dealerId || payerId === dealerId ? state.ruleProfile.dealerBonusMultiplier : 1
  return state.ruleProfile.baseWinPoints * multiplier
}
