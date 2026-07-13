import { activePlayer, playableCards, topCard } from './classic'
import type { Card, GameState, UnoColor } from './types'

export type RecommendationAction = 'play' | 'callUnoThenPlay' | 'draw' | 'acceptPenalty' | 'wait'

export type RecommendationReason =
  | 'finishRound'
  | 'callUno'
  | 'pressureNext'
  | 'answerPenalty'
  | 'wildChoice'
  | 'keepColor'
  | 'matchNumber'
  | 'matchSymbol'
  | 'highPoints'
  | 'forcedColor'
  | 'forcedPlay'
  | 'draw'
  | 'acceptPenalty'
  | 'wait'

export interface MoveRecommendation {
  action: RecommendationAction
  reason: RecommendationReason
  card?: Card
}

const COLORS: UnoColor[] = ['red', 'yellow', 'green', 'blue']
const DARK_COLORS: UnoColor[] = ['teal', 'pink', 'purple', 'orange']

export function recommendMove(state: GameState): MoveRecommendation {
  const player = activePlayer(state)
  if (state.winnerId) return { action: 'wait', reason: 'wait' }
  if (state.config.game === 'guoPassage') return recommendPassageMove(state)
  if (state.config.game === 'skipBo') return recommendSkipBoMove(state)

  const cards = playableCards(player, state)

  if (state.pendingDraw) {
    if (cards.length === 0) return { action: 'acceptPenalty', reason: 'acceptPenalty' }
    return { action: 'play', reason: 'answerPenalty', card: pickBestCard(cards, state) }
  }

  if (cards.length === 0) return { action: 'draw', reason: 'draw' }

  const card = pickBestCard(cards, state)
  const action: RecommendationAction = player.hand.length === 2 && !state.unoDeclaredPlayerId ? 'callUnoThenPlay' : 'play'
  return { action, reason: reasonForCard(card, state), card }
}

function recommendPassageMove(state: GameState): MoveRecommendation {
  const cards = playableCards(activePlayer(state), state)
  if (state.passageTurn?.phase === 'take') return { action: 'draw', reason: 'draw' }
  if (cards.length === 0) return { action: 'wait', reason: 'wait' }
  return { action: 'play', reason: 'highPoints', card: pickBestCard(cards, state) }
}

function recommendSkipBoMove(state: GameState): MoveRecommendation {
  const player = activePlayer(state)
  if (!state.drewThisTurn) return { action: 'draw', reason: 'draw' }
  const cards = playableCards(player, state)
  if (cards.length === 0) return { action: 'wait', reason: 'wait' }
  return { action: 'play', reason: 'highPoints', card: pickBestCard(cards, state) }
}

function pickBestCard(cards: Card[], state: GameState): Card {
  return [...cards].sort((a, b) => scoreCard(b, state) - scoreCard(a, state))[0]
}

function scoreCard(card: Card, state: GameState): number {
  const player = activePlayer(state)
  const nextPlayer = state.players[(state.activePlayerIndex + state.direction + state.players.length) % state.players.length]
  let score = card.points

  if (player.hand.length === 1) score += 100
  if (player.hand.length === 2) score += 24
  if (state.pendingDraw) score += 45 + drawValue(card) * 12
  if (state.mustPlayFromHand) score += 30
  if (state.speedPlayColor && card.color === state.speedPlayColor) score += 40
  if (nextPlayer.hand.length <= 2 && isPressureCard(card)) score += 28
  if (card.color !== 'wild') score += countColor(player.hand, card.color) * 3
  if (card.color === 'wild') score += 12
  if (card.kind === 'number') score += card.value ?? 0
  if (state.config.game === 'flex' && activePlayer(state).flexPowerActive && ['flexSkip', 'flexDraw2', 'wildFlexDraw2'].includes(card.kind)) score += 18

  return score
}

function reasonForCard(card: Card, state: GameState): RecommendationReason {
  const player = activePlayer(state)
  const nextPlayer = state.players[(state.activePlayerIndex + state.direction + state.players.length) % state.players.length]

  if (state.config.game === 'phase10') return 'highPoints'
  if (player.hand.length === 1) return 'finishRound'
  if (player.hand.length === 2 && !state.unoDeclaredPlayerId) return 'callUno'
  if (state.pendingDraw) return 'answerPenalty'
  if (state.speedPlayColor) return 'forcedColor'
  if (state.mustPlayFromHand) return 'forcedPlay'
  if (nextPlayer.hand.length <= 2 && isPressureCard(card)) return 'pressureNext'
  if (card.color === 'wild') return 'wildChoice'
  if (state.config.game === 'dos') return card.kind === 'number' ? 'matchNumber' : 'highPoints'
  if (countColor(player.hand, card.color) > 1) return 'keepColor'
  const top = topCard(state)
  if (card.kind === 'number' && top.kind === 'number' && card.value === top.value) return 'matchNumber'
  if (card.kind !== 'number' && card.kind === top.kind) return 'matchSymbol'
  return 'highPoints'
}

function isPressureCard(card: Card): boolean {
  return [
    'skip',
    'reverseSkip',
    'draw2',
    'draw4',
    'wildDraw4',
    'wildDraw6',
    'wildDraw10',
    'wildReverseDraw4',
    'wildColorRoulette',
    'wildDraw2',
    'wildDrawColor',
    'wildDownpour1',
    'wildDownpour2',
    'wildHuntRing',
    'wildSortingHat',
    'wildTheForce',
    'wildAvengersAssemble',
    'wildTrexAttack',
    'wildCreeper',
    'wildSuperStar',
    'wildVictoryLap',
    'wildPlayedTooMuch',
    'wildPowerOfGrayskull',
    'wildTurtlePower',
    'wildWebSwing',
    'wildJusticeLeague',
    'wildBeamMeUp',
    'wildAvatarState',
    'wildCreepyCool',
    'wildTouchdown',
    'wildJackpot',
    'blast',
    'wildRoboto',
    'tippo',
    'wildEmoji',
    'wildItemBox',
    'flexSkip',
    'flexDraw2',
    'wildFlexDraw2',
    'reverseDraw2',
    'wildDraw3',
    'wildDrawMystery',
    'draw5',
    'skipEveryone',
    'hit2',
    'wildExtremeHit',
    'wildHitFire',
    'wildAllHit',
    'slap',
    'pointTaken',
    'wildDrawnTogether',
    'wildPileUp',
  ].includes(card.kind)
}

function drawValue(card: Card): number {
  if (card.kind === 'draw2' || card.kind === 'flexDraw2' || card.kind === 'wildFlexDraw2' || card.kind === 'reverseDraw2' || card.kind === 'stack2' || card.kind === 'wildDraw2Swap' || card.kind === 'hit2' || card.kind === 'wildExtremeHit') return 2
  if (card.kind === 'draw1') return 1
  if (card.kind === 'draw5') return 5
  if (card.kind === 'draw4' || card.kind === 'wildReverseDraw4') return 4
  if (card.kind === 'wildDraw2') return 2
  if (card.kind === 'stack1' || card.kind === 'wildDraw1SpeedPlay') return 1
  if (card.kind === 'wildDraw3') return 3
  if (card.kind === 'wildDraw4') return 4
  if (card.kind === 'wildDraw6') return 6
  if (card.kind === 'wildDraw10') return 10
  if (card.kind === 'wildHuntRing') return 3
  if (card.kind === 'wildSortingHat') return 3
  if (card.kind === 'wildTheForce') return 2
  if (card.kind === 'wildTrexAttack') return 5
  if (card.kind === 'wildCreeper') return 3
  if (card.kind === 'wildSuperStar') return 2
  if (card.kind === 'wildVictoryLap') return 1
  if (card.kind === 'wildPlayedTooMuch') return 2
  if (card.kind === 'wildPowerOfGrayskull') return 1
  if (card.kind === 'wildTurtlePower') return 1
  if (card.kind === 'wildWebSwing') return 2
  if (card.kind === 'wildJusticeLeague') return 3
  if (card.kind === 'wildBeamMeUp') return 2
  if (card.kind === 'wildAvatarState') return 2
  if (card.kind === 'wildCreepyCool') return 2
  if (card.kind === 'wildTouchdown') return 4
  if (card.kind === 'wildJackpot') return 3
  if (card.kind === 'blast') return Math.max(2, (card.points / 25) | 0)
  if (card.kind === 'wildRoboto') return 3
  if (card.kind === 'tippo') return 3
  if (card.kind === 'wildEmoji') return 4
  if (card.kind === 'wildItemBox') return 3
  if (card.kind === 'wildDrawMystery') return 3
  return 0
}

function countColor(cards: Card[], color: UnoColor): number {
  return cards.filter((card) => card.color === color).length
}

export function chooseRecommendedColor(card: Card, state: GameState): UnoColor | null {
  if (card.color !== 'wild') return null
  const player = activePlayer(state)
  const colors = (state.config.game === 'flip' || state.config.game === 'flipExtreme') && state.flipSide === 'dark' ? DARK_COLORS : COLORS
  return [...colors].sort((a, b) => countColor(player.hand, b) - countColor(player.hand, a))[0]
}
