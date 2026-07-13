import { activePlayer, chooseColorFromHand, legalTargets, liarClaimOptions, playableCards, speedPlayableCards, tippoLegalTrayIndexes, triplePlayLegalPileIndexes } from './classic'
import type { AiDifficulty, Card, GameState, PlayChoice, UnoColor } from './types'

const colorOrder: UnoColor[] = ['red', 'yellow', 'green', 'blue']
const darkColorOrder: UnoColor[] = ['teal', 'pink', 'purple', 'orange']

const actionWeight: Record<string, number> = {
  wildDraw4: 10,
  wildDraw10: 13,
  wildDraw6: 12,
  wildReverseDraw4: 11,
  wildColorRoulette: 10,
  wildHitFire: 10,
  wildDraw2Swap: 9,
  wildExtremeHit: 9,
  wildNoU: 9,
  wildAllHit: 9,
  draw2: 8,
  draw4: 10,
  reverseDraw2: 8,
  hit2: 8,
  wildDraw3: 8,
  wildDrawMystery: 7,
  wildDrawColor: 10,
  wildDownpour2: 10,
  wildHuntRing: 9,
  wildSortingHat: 9,
  wildTheForce: 8,
  wildAvengersAssemble: 9,
  wildTrexAttack: 9,
  wildCreeper: 9,
  wildSuperStar: 9,
  wildVictoryLap: 9,
  wildPlayedTooMuch: 9,
  wildPowerOfGrayskull: 9,
  wildTurtlePower: 8,
  wildWebSwing: 9,
  wildJusticeLeague: 10,
  wildBeamMeUp: 9,
  wildAvatarState: 9,
  wildCreepyCool: 8,
  wildTouchdown: 9,
  wildJackpot: 10,
  blast: 9,
  wildRoboto: 10,
  tippo: 8,
  wildEmoji: 8,
  wildItemBox: 9,
  wildClear: 9,
  wildGiveAway: 9,
  triplePlayDiscardTwo: 8,
  wildDownpour1: 9,
  wildAllFlip: 9,
  wildFlexDraw2: 9,
  wildPileUp: 9,
  wildTargetDraw2: 9,
  wildForcedSwap: 7,
  draw5: 9,
  wildDraw2: 8,
  wildSkipTwo: 8,
  flexDraw2: 8,
  pointTaken: 8,
  wildDrawnTogether: 8,
  skip: 7,
  wildSkip: 7,
  flexSkip: 8,
  skipEveryone: 8,
  reverseSkip: 7,
  slap: 7,
  flip: 7,
  draw1: 6,
  wildSwapHands: 7,
  tradeHands: 7,
  targetedSwap: 6,
  passingSwap: 6,
  discardAll: 6,
  flexReverse: 6,
  reverse: 4,
  wildReverse: 4,
  wild: 4,
  number: 1,
}

export interface AiDecision {
  card: Card | null
  choice: PlayChoice
  challenge: boolean
}

export function decideAiMove(state: GameState): AiDecision {
  const player = activePlayer(state)
  const difficulty = player.aiDifficulty ?? 'medium'
  const cards = playableCards(player, state)
  const challenge = shouldChallenge(state, difficulty)

  if (cards.length === 0) {
    return { card: null, choice: {}, challenge }
  }

  const card = pickCard(cards, state, difficulty)
  const targets = legalTargets(state)
  const leader = [...targets].sort((a, b) => a.hand.length - b.hand.length)[0]
  const second = [...targets].filter((target) => target.id !== leader?.id).sort((a, b) => a.hand.length - b.hand.length)[0]

  return {
    card,
    choice: {
      useFlex: shouldUseFlex(card, state, difficulty),
      color: card.color === 'wild' ? chooseAiColor(player.hand, difficulty, colorsForState(state)) : undefined,
      neighborAnchor: state.config.game === 'guoNeighborMatch' && card.color === 'wild' ? chooseAiNeighborAnchor(player.hand, difficulty) : undefined,
      hiLoAnchor: state.config.game === 'guoHiLo' && card.color === 'wild' ? chooseAiHiLoAnchor(player.hand, difficulty) : undefined,
      barbieDiscardColor: state.config.game === 'barbie' && card.kind === 'wildPlayedTooMuch' ? chooseAiBarbieDiscardColor(state, difficulty) : undefined,
      targetPlayerId: leader?.id,
      secondTargetPlayerId: second?.id,
      liarClaim: chooseAiLiarClaim(card, state, difficulty),
      discardPileIndex: chooseAiDiscardPile(card, state),
    },
    challenge,
  }
}

function chooseAiNeighborAnchor(hand: Card[], difficulty: AiDifficulty): number {
  if (difficulty === 'easy') return Math.floor(Math.random() * 10)
  const counts = Array.from({ length: 10 }, (_, anchor) => {
    const playable = hand.filter((card) =>
      card.kind === 'number' &&
      typeof card.value === 'number' &&
      (card.value === anchor || card.value === ((anchor + 9) % 10) || card.value === ((anchor + 1) % 10)),
    ).length
    return { anchor, playable }
  })
  return counts.sort((a, b) => b.playable - a.playable || Math.abs(5 - a.anchor) - Math.abs(5 - b.anchor))[0].anchor
}

function chooseAiHiLoAnchor(hand: Card[], difficulty: AiDifficulty): number {
  if (difficulty === 'easy') return Math.floor(Math.random() * 10)
  const numbers = hand
    .filter((card) => card.kind === 'number' && typeof card.value === 'number')
    .map((card) => card.value as number)
  if (numbers.length === 0) return 5
  const candidates = Array.from({ length: 10 }, (_, anchor) => {
    const lower = numbers.filter((value) => value < anchor).length
    const higher = numbers.filter((value) => value > anchor).length
    return { anchor, playableAfterFlip: lower + higher, balance: Math.min(lower, higher) }
  })
  return candidates.sort((a, b) =>
    b.playableAfterFlip - a.playableAfterFlip ||
    b.balance - a.balance ||
    Math.abs(5 - a.anchor) - Math.abs(5 - b.anchor),
  )[0].anchor
}

function chooseAiBarbieDiscardColor(state: GameState, difficulty: AiDifficulty): UnoColor {
  if (difficulty === 'easy') return colorOrder[Math.floor(Math.random() * colorOrder.length)]
  const active = state.players[state.activePlayerIndex]
  const scored = colorOrder.map((color) => {
    const own = active.hand.filter((card) => card.color === color).length
    const opponentPressure = state.players
      .filter((player) => player.id !== active.id)
      .reduce((sum, player) => {
        const pressure = player.hand.length <= 2 ? 2 : 1
        return sum + player.hand.filter((card) => card.color === color).length * pressure
      }, 0)
    return { color, score: opponentPressure - own * (difficulty === 'hard' ? 2 : 1) }
  })
  return scored.sort((a, b) => b.score - a.score || colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color))[0].color
}

export function shouldAiChallengeLiar(state: GameState): boolean {
  if (!state.pendingLiarChallenge) return false
  const source = state.players.find((player) => player.id === state.pendingLiarChallenge?.sourcePlayerId)
  const challengers = state.players.filter((player) => player.type === 'ai' && player.id !== source?.id)
  const challenger = challengers[0]
  if (!challenger) return false
  const difficulty = challenger.aiDifficulty ?? 'medium'
  const baseChance = difficulty === 'easy' ? 0.18 : difficulty === 'medium' ? 0.38 : 0.58
  const pressure = source && source.hand.length <= 1 ? 0.22 : 0
  return Math.random() < baseChance + pressure
}

export function shouldAiCatchUno(state: GameState): boolean {
  const player = activePlayer(state)
  if (player.type !== 'ai' || !state.catchableUnoPlayerId || state.catchableUnoPlayerId === player.id) {
    return false
  }

  const difficulty = player.aiDifficulty ?? 'medium'
  const baseChance = difficulty === 'easy' ? 0.25 : difficulty === 'medium' ? 0.65 : 0.95
  return Math.random() < baseChance
}

export function decideAiSpeedPlayCutIn(state: GameState): { playerId: string; card: Card } | null {
  if ((state.config.game !== 'party' && state.config.game !== 'houseRules') || state.winnerId || state.pendingDraw || state.pendingLiarChallenge) return null
  const current = activePlayer(state)
  const candidates = state.players
    .filter((player) => player.type === 'ai' && player.id !== current.id)
    .flatMap((player) => speedPlayableCards(player, state).map((card) => ({ player, card })))
  if (candidates.length === 0) return null
  const best = candidates.sort((a, b) => {
    const aDifficulty = a.player.aiDifficulty ?? 'medium'
    const bDifficulty = b.player.aiDifficulty ?? 'medium'
    const difficultyWeight = (difficulty: AiDifficulty) => difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1
    return difficultyWeight(bDifficulty) - difficultyWeight(aDifficulty) || b.card.points - a.card.points
  })[0]
  const difficulty = best.player.aiDifficulty ?? 'medium'
  const chance = difficulty === 'easy' ? 0.22 : difficulty === 'medium' ? 0.5 : 0.82
  if (Math.random() > chance) return null
  return { playerId: best.player.id, card: best.card }
}

function pickCard(cards: Card[], state: GameState, difficulty: AiDifficulty): Card {
  if (difficulty === 'easy') {
    return cards[Math.floor(Math.random() * cards.length)]
  }

  const nextPlayer = state.players[(state.activePlayerIndex + state.direction + state.players.length) % state.players.length]
  const scored = cards.map((card) => {
    let score = actionWeight[card.kind] ?? 2
    if (card.kind === 'number') score += card.value ?? 0
    if (card.color !== 'wild' && countColor(state.players[state.activePlayerIndex].hand, card.color) > 2) score += 2
    if (
      difficulty === 'hard' &&
      nextPlayer.hand.length <= 2 &&
      ['skip', 'flexSkip', 'draw2', 'draw4', 'flexDraw2', 'draw5', 'wildDraw4', 'wildDraw6', 'wildDraw10', 'wildReverseDraw4', 'wildColorRoulette', 'wildDraw2', 'wildFlexDraw2', 'wildDrawColor', 'wildDownpour1', 'wildDownpour2', 'wildHuntRing', 'wildSortingHat', 'wildTheForce', 'wildTrexAttack', 'wildCreeper', 'wildSuperStar', 'wildVictoryLap', 'wildPlayedTooMuch', 'wildPowerOfGrayskull', 'wildTurtlePower', 'wildWebSwing', 'wildJusticeLeague', 'wildBeamMeUp', 'wildAvatarState', 'wildCreepyCool', 'wildTouchdown', 'blast', 'wildRoboto', 'wildEmoji', 'wildItemBox', 'reverseDraw2', 'hit2', 'wildHitFire', 'wildExtremeHit', 'wildAllHit', 'slap', 'skipEveryone', 'pointTaken', 'wildPileUp'].includes(card.kind)
    ) {
      score += 5
    }
    if (difficulty === 'medium' && card.color === 'wild' && cards.length > 2) score -= 2
    return { card, score }
  })

  return scored.sort((a, b) => b.score - a.score)[0].card
}

function shouldUseFlex(card: Card, state: GameState, difficulty: AiDifficulty): boolean | undefined {
  if (state.config.game !== 'flex') return undefined
  const player = activePlayer(state)
  if (!player.flexPowerActive || !['flexSkip', 'flexReverse', 'flexDraw2', 'wildFlexDraw2'].includes(card.kind)) return undefined
  if (difficulty === 'easy') return Math.random() < 0.25
  if (difficulty === 'medium') return ['flexSkip', 'flexDraw2', 'wildFlexDraw2'].includes(card.kind)
  return true
}

function chooseAiLiarClaim(card: Card, state: GameState, difficulty: AiDifficulty): PlayChoice['liarClaim'] {
  if (state.config.game !== 'liars' || !card.liar) return undefined
  const options = liarClaimOptions(state, card)
  if (options.length === 0) return undefined
  const actual = options.find((claim) => claim.kind === card.kind && claim.color === card.color && claim.value === card.value)
  if (difficulty === 'easy') return actual ?? options[0]
  const pressure = options.find((claim) => claim.kind === 'draw2') ?? options.find((claim) => claim.kind === 'skip')
  if (difficulty === 'hard' && Math.random() < 0.55 && pressure) return pressure
  return actual ?? pressure ?? options[0]
}

function chooseAiDiscardPile(card: Card, state: GameState): number | undefined {
  if (state.config.game === 'tippo') {
    const trays = tippoLegalTrayIndexes(state, card)
    if (trays.length === 0) return undefined
    return trays.sort((a, b) => (state.tippoTrays?.[a]?.load ?? 0) - (state.tippoTrays?.[b]?.load ?? 0))[0]
  }
  if (state.config.game !== 'triplePlay') return undefined
  const piles = triplePlayLegalPileIndexes(state, card)
  if (piles.length === 0) return undefined
  return piles.sort((a, b) => (state.triplePlayPiles?.[a]?.overload ?? 0) - (state.triplePlayPiles?.[b]?.overload ?? 0))[0]
}

function chooseAiColor(hand: Card[], difficulty: AiDifficulty, colors: UnoColor[]): UnoColor {
  if (difficulty === 'easy') {
    return colors[Math.floor(Math.random() * colors.length)]
  }
  return chooseColorFromHand(hand, colors)
}

function shouldChallenge(state: GameState, difficulty: AiDifficulty): boolean {
  if (!state.pendingDraw?.canChallenge) return false
  const baseChance = difficulty === 'easy' ? 0.1 : difficulty === 'medium' ? 0.35 : 0.55
  return Math.random() < baseChance
}

function countColor(cards: Card[], color: UnoColor): number {
  return cards.filter((card) => card.color === color).length
}

function colorsForState(state: GameState): UnoColor[] {
  return (state.config.game === 'flip' || state.config.game === 'flipExtreme') && state.flipSide === 'dark' ? darkColorOrder : colorOrder
}
