import { buildMahjongTileSet, dealMahjongRound, isMahjongBonusTile, shuffleMahjongTiles, sortMahjongTiles } from './tiles'
import { applyMahjongWinResult, createMahjongDrawResult, standardMahjongRuleProfile } from './scoring'
import { evaluateMahjongWin } from './win'
import type { AiDifficulty, GameMode } from '../types'
import type { MahjongClaimResponse, MahjongMeldKind, MahjongRuleProfile, MahjongState, MahjongTile } from './types'

export interface CreateMahjongGameOptions {
  mode: GameMode
  aiDifficulty?: AiDifficulty
  playerIds?: string[]
  wall?: MahjongTile[]
  dealerIndex?: number
  ruleProfile?: MahjongRuleProfile
}

export interface MahjongClaimOption {
  action: MahjongClaimResponse['action']
  tileIds: string[]
  priority: number
}

export function createMahjongGame(options: CreateMahjongGameOptions): MahjongState {
  const playerIds = (options.playerIds ?? ['p1', 'p2', 'p3', 'p4']).slice(0, 4)
  while (playerIds.length < 4) playerIds.push(`p${playerIds.length + 1}`)

  const dealerIndex = options.dealerIndex ?? 0
  const ruleProfile = options.ruleProfile ?? standardMahjongRuleProfile
  const deal = dealMahjongRound(options.wall ?? shuffleMahjongTiles(buildMahjongTileSet()), playerIds, dealerIndex)
  const players = deal.players.map((player, index) => ({
    ...player,
    name: index === 0 ? 'You' : `Player ${index + 1}`,
    type: playerTypeForMode(options.mode, index),
    aiDifficulty: playerTypeForMode(options.mode, index) === 'ai' ? options.aiDifficulty ?? 'medium' : undefined,
  }))

  return {
    players,
    wall: deal.wall,
    deadWall: deal.deadWall,
    activePlayerIndex: dealerIndex,
    dealerIndex,
    prevailingWind: 'east',
    phase: 'discard',
    claimWindow: null,
    winnerId: null,
    ruleProfile,
    roundResult: null,
    currentRound: 1,
    log: [{ id: 1, text: `${players[dealerIndex].name} starts as dealer.` }],
    nextLogId: 2,
  }
}

export function mahjongDraw(state: MahjongState): MahjongState {
  if (state.phase !== 'draw' || state.winnerId) return state
  const next = cloneMahjongState(state)
  const player = next.players[next.activePlayerIndex]
  let drawn = next.wall.shift()

  if (!drawn) {
    next.phase = 'roundOver'
    next.roundResult = createMahjongDrawResult()
    next.log.push({ id: next.nextLogId, text: 'The wall is exhausted. The round is drawn.' })
    next.nextLogId += 1
    return next
  }

  while (drawn && isMahjongBonusTile(drawn)) {
    player.flowers.push(drawn)
    drawn = next.deadWall.pop()
  }

  if (drawn) {
    player.concealed = sortMahjongTiles([...player.concealed, drawn])
    next.phase = 'discard'
    next.log.push({ id: next.nextLogId, text: `${player.name} drew a tile.` })
    next.nextLogId += 1
  }

  return next
}

export function mahjongDiscard(state: MahjongState, tileId: string): MahjongState {
  if (state.phase !== 'discard' || state.winnerId) return state
  const active = state.players[state.activePlayerIndex]
  if (!active.concealed.some((tile) => tile.id === tileId)) return state

  const next = cloneMahjongState(state)
  const player = next.players[next.activePlayerIndex]
  const tile = removeTileById(player.concealed, tileId)
  if (!tile) return state

  player.discardRiver.push(tile)
  const eligiblePlayerIds = next.players.filter((candidate) => candidate.id !== player.id).map((candidate) => candidate.id)
  next.phase = 'claim'
  next.claimWindow = {
    discard: tile,
    discarderId: player.id,
    eligiblePlayerIds,
    responses: {},
  }
  next.log.push({ id: next.nextLogId, text: `${player.name} discarded ${tile.key}.` })
  next.nextLogId += 1
  return next
}

export function mahjongLegalClaimOptions(state: MahjongState, playerId: string): MahjongClaimOption[] {
  const window = state.claimWindow
  if (state.phase !== 'claim' || !window || !window.eligiblePlayerIds.includes(playerId)) return []

  const player = state.players.find((candidate) => candidate.id === playerId)
  if (!player) return []

  const options: MahjongClaimOption[] = []
  const handWithDiscard = [...player.concealed, window.discard]
  if (evaluateMahjongWin(handWithDiscard, { allowSevenPairs: state.ruleProfile.allowSevenPairs, exposedMeldCount: player.exposedMelds.length }).winning) {
    options.push({ action: 'win', tileIds: [], priority: 3 })
  }

  if (window.robbingKong) return options

  const matching = player.concealed.filter((tile) => tile.key === window.discard.key)
  if (matching.length >= 3) {
    options.push({ action: 'kong', tileIds: matching.slice(0, 3).map((tile) => tile.id), priority: 2 })
  }
  if (matching.length >= 2) {
    options.push({ action: 'pong', tileIds: matching.slice(0, 2).map((tile) => tile.id), priority: 2 })
  }

  if (isNextPlayerAfterDiscarder(state, playerId)) {
    for (const tileIds of chowTileIdOptions(player.concealed, window.discard)) {
      options.push({ action: 'chow', tileIds, priority: 1 })
    }
  }

  return options
}

export function mahjongClaim(state: MahjongState, playerId: string, action: MahjongClaimResponse['action'], tileIds: string[] = []): MahjongState {
  const window = state.claimWindow
  if (!window || action === 'pass') return state
  const legalOption = mahjongLegalClaimOptions(state, playerId).find((option) => option.action === action && tileIdsMatch(option.tileIds, tileIds))
  if (!legalOption) return state

  const next = cloneMahjongState(state)
  if (!next.claimWindow) return state
  next.claimWindow.responses[playerId] = { action, tileIds: legalOption.tileIds }

  if (action !== 'win' && hasUnresolvedHigherPriorityClaim(next, legalOption.priority)) return next

  return resolveMahjongClaimWindow(next)
}

export function mahjongDeclareKong(state: MahjongState, tileId?: string): MahjongState {
  if (state.phase !== 'discard' || state.winnerId) return state
  const active = state.players[state.activePlayerIndex]
  const kongTiles = concealedKongTiles(active.concealed, tileId)
  const addedKong = kongTiles ? null : addedKongTile(active, tileId)
  if (!kongTiles && !addedKong) return state

  const next = cloneMahjongState(state)
  const player = next.players[next.activePlayerIndex]
  if (addedKong) {
    next.phase = 'claim'
    next.claimWindow = {
      discard: { ...addedKong.tile },
      discarderId: player.id,
      eligiblePlayerIds: next.players.filter((candidate) => candidate.id !== player.id).map((candidate) => candidate.id),
      responses: {},
      robbingKong: { meldIndex: addedKong.meldIndex },
    }
    next.log.push({ id: next.nextLogId, text: `${player.name} added a kong.` })
    next.nextLogId += 1
    return next
  }

  if (!kongTiles) return state
  const removedTiles = kongTiles.map((tile) => removeTileById(player.concealed, tile.id)).filter((tile): tile is MahjongTile => Boolean(tile))
  if (removedTiles.length !== 4) return state

  player.exposedMelds.push({
    kind: 'kong',
    tiles: sortMahjongTiles(removedTiles),
    concealed: true,
  })
  next.log.push({ id: next.nextLogId, text: `${player.name} declared concealed kong.` })
  next.nextLogId += 1
  return drawKongReplacement(next, player)
}

function resolveMahjongClaimWindow(state: MahjongState): MahjongState {
  const window = state.claimWindow
  if (!window) return state
  const best = bestClaimResponse(state)
  if (!best) {
    const allResponded = window.eligiblePlayerIds.every((id) => Boolean(window.responses[id]))
    if (!allResponded) return state

    if (window.robbingKong) {
      return completeAddedKongAfterPasses(state)
    }

    const discarderIndex = state.players.findIndex((player) => player.id === window.discarderId)
    state.activePlayerIndex = nextPlayerIndex(state, discarderIndex)
    state.phase = 'draw'
    state.claimWindow = null
    state.log.push({ id: state.nextLogId, text: 'Nobody claimed the discard.' })
    state.nextLogId += 1
    return state
  }

  if (hasUnresolvedHigherPriorityClaim(state, best.option.priority)) return state

  const playerIndex = state.players.findIndex((candidate) => candidate.id === best.playerId)
  const player = state.players[playerIndex]
  if (!player) return state

  if (best.response.action === 'win') {
    if (window.robbingKong) {
      const declarer = state.players.find((candidate) => candidate.id === window.discarderId)
      if (declarer) removeTileById(declarer.concealed, window.discard.id)
    }
    const result = evaluateMahjongWin([...player.concealed, window.discard], { allowSevenPairs: state.ruleProfile.allowSevenPairs, exposedMeldCount: player.exposedMelds.length })
    const won = applyMahjongWinResult(state, best.playerId, {
      wonFromPlayerId: window.discarderId,
      selfDraw: false,
      pattern: result.pattern,
    })
    state.log.push({ id: state.nextLogId, text: `${player.name} wins on ${window.discard.key}.` })
    won.log = state.log
    won.nextLogId = state.nextLogId + 1
    return won
  }

  const chosenTileIds = best.option.tileIds
  const claimedTiles = chosenTileIds.map((id) => removeTileById(player.concealed, id)).filter((tile): tile is MahjongTile => Boolean(tile))
  if (claimedTiles.length !== chosenTileIds.length) return state

  player.exposedMelds.push({
    kind: best.response.action as MahjongMeldKind,
    tiles: sortMahjongTiles([...claimedTiles, window.discard]),
    claimedFromPlayerId: window.discarderId,
    claimedTileId: window.discard.id,
  })
  removeDiscardFromRiver(state, window.discarderId, window.discard.id)
  state.activePlayerIndex = playerIndex
  state.phase = 'discard'
  state.claimWindow = null
  state.log.push({ id: state.nextLogId, text: `${player.name} claimed ${best.response.action}.` })
  state.nextLogId += 1
  if (best.response.action === 'kong') return drawKongReplacement(state, player)
  return state
}

function bestClaimResponse(state: MahjongState): { playerId: string; response: MahjongClaimResponse; option: MahjongClaimOption } | null {
  const window = state.claimWindow
  if (!window) return null
  const claims = Object.entries(window.responses)
    .map(([playerId, response]) => {
      if (response.action === 'pass') return null
      const option = mahjongLegalClaimOptions(state, playerId).find((candidate) => candidate.action === response.action && tileIdsMatch(candidate.tileIds, response.tileIds ?? []))
      return option ? { playerId, response, option } : null
    })
    .filter((claim): claim is { playerId: string; response: MahjongClaimResponse; option: MahjongClaimOption } => Boolean(claim))

  return claims.sort((left, right) => right.option.priority - left.option.priority || claimTurnDistance(state, left.playerId) - claimTurnDistance(state, right.playerId))[0] ?? null
}

function hasUnresolvedHigherPriorityClaim(state: MahjongState, priority: number): boolean {
  const window = state.claimWindow
  if (!window) return false
  return window.eligiblePlayerIds.some((playerId) => {
    if (window.responses[playerId]) return false
    return maxLegalClaimPriority(state, playerId) > priority
  })
}

function maxLegalClaimPriority(state: MahjongState, playerId: string): number {
  return Math.max(0, ...mahjongLegalClaimOptions(state, playerId).map((option) => option.priority))
}

function claimTurnDistance(state: MahjongState, playerId: string): number {
  const window = state.claimWindow
  if (!window) return Number.MAX_SAFE_INTEGER
  const discarderIndex = state.players.findIndex((player) => player.id === window.discarderId)
  const playerIndex = state.players.findIndex((player) => player.id === playerId)
  if (discarderIndex < 0 || playerIndex < 0) return Number.MAX_SAFE_INTEGER
  return (playerIndex - discarderIndex + state.players.length) % state.players.length
}

function drawKongReplacement(state: MahjongState, player: MahjongState['players'][number]): MahjongState {
  let drawn = state.deadWall.pop()
  while (drawn && isMahjongBonusTile(drawn)) {
    player.flowers.push(drawn)
    drawn = state.deadWall.pop()
  }

  if (!drawn) {
    state.phase = 'roundOver'
    state.roundResult = createMahjongDrawResult()
    state.log.push({ id: state.nextLogId, text: 'No replacement tile remains. The round is drawn.' })
    state.nextLogId += 1
    return state
  }

  player.concealed = sortMahjongTiles([...player.concealed, drawn])
  state.phase = 'discard'
  state.log.push({ id: state.nextLogId, text: `${player.name} drew a kong replacement.` })
  state.nextLogId += 1
  return state
}

function completeAddedKongAfterPasses(state: MahjongState): MahjongState {
  const window = state.claimWindow
  if (!window?.robbingKong) return state
  const playerIndex = state.players.findIndex((player) => player.id === window.discarderId)
  const player = state.players[playerIndex]
  if (!player) return state
  const tile = removeTileById(player.concealed, window.discard.id)
  const meld = player.exposedMelds[window.robbingKong.meldIndex]
  if (!tile || !meld || meld.kind !== 'pong') return state

  meld.kind = 'kong'
  meld.concealed = false
  meld.tiles = sortMahjongTiles([...meld.tiles, tile])
  state.activePlayerIndex = playerIndex
  state.claimWindow = null
  state.log.push({ id: state.nextLogId, text: 'Nobody robbed the kong.' })
  state.nextLogId += 1
  return drawKongReplacement(state, player)
}

function concealedKongTiles(tiles: MahjongTile[], tileId?: string): MahjongTile[] | null {
  const selected = tileId ? tiles.find((tile) => tile.id === tileId) : null
  const targetKey = selected?.key
  const keys = targetKey ? [targetKey] : [...new Set(tiles.map((tile) => tile.key))]
  for (const key of keys) {
    const matching = tiles.filter((tile) => tile.key === key)
    if (matching.length === 4) return matching
  }
  return null
}

function addedKongTile(player: MahjongState['players'][number], tileId?: string): { tile: MahjongTile; meldIndex: number } | null {
  const candidates = tileId ? player.concealed.filter((tile) => tile.id === tileId) : player.concealed
  for (const tile of candidates) {
    const meldIndex = player.exposedMelds.findIndex((meld) => meld.kind === 'pong' && meld.tiles.every((meldTile) => meldTile.key === tile.key))
    if (meldIndex >= 0) return { tile, meldIndex }
  }
  return null
}

export function mahjongDeclareWin(state: MahjongState): MahjongState {
  if (state.phase !== 'discard' || state.winnerId) return state
  const player = state.players[state.activePlayerIndex]
  const result = evaluateMahjongWin(player.concealed, { allowSevenPairs: state.ruleProfile.allowSevenPairs, exposedMeldCount: player.exposedMelds.length })
  if (!result.winning) return state

  const next = applyMahjongWinResult(cloneMahjongState(state), player.id, {
    wonFromPlayerId: null,
    selfDraw: true,
    pattern: result.pattern,
  })
  next.log.push({ id: next.nextLogId, text: `${player.name} wins by self-draw.` })
  next.nextLogId += 1
  return next
}

export function mahjongStartNextRound(state: MahjongState, options: { wall?: MahjongTile[] } = {}): MahjongState {
  if (state.phase !== 'roundOver') return state
  const nextDealerIndex = nextDealerAfterRound(state)
  const next = createMahjongGame({
    mode: 'hotseat',
    playerIds: state.players.map((player) => player.id),
    dealerIndex: nextDealerIndex,
    wall: options.wall,
    ruleProfile: state.ruleProfile,
  })
  next.currentRound = state.currentRound + 1
  next.prevailingWind = nextPrevailingWindAfterRound(state, nextDealerIndex)
  next.players = next.players.map((player, index) => ({
    ...player,
    name: state.players[index]?.name ?? player.name,
    type: state.players[index]?.type ?? player.type,
    aiDifficulty: state.players[index]?.aiDifficulty,
    score: state.players[index]?.score ?? 0,
  }))
  next.log = [...state.log, { id: state.nextLogId, text: `Round ${next.currentRound} begins.` }]
  next.nextLogId = state.nextLogId + 1
  return next
}

export function mahjongPassClaim(state: MahjongState, playerId: string): MahjongState {
  const window = state.claimWindow
  if (!window || !window.eligiblePlayerIds.includes(playerId)) return state

  const next = cloneMahjongState(state)
  if (!next.claimWindow) return state
  next.claimWindow.responses[playerId] = { action: 'pass' }

  return resolveMahjongClaimWindow(next)
}

function playerTypeForMode(mode: GameMode, index: number): 'human' | 'ai' {
  if (mode === 'single') return index === 0 ? 'human' : 'ai'
  if (mode === 'spectacular') return 'ai'
  return 'human'
}

function cloneMahjongState(state: MahjongState): MahjongState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      concealed: player.concealed.map((tile) => ({ ...tile })),
      exposedMelds: player.exposedMelds.map((meld) => ({
        ...meld,
        tiles: meld.tiles.map((tile) => ({ ...tile })),
      })),
      flowers: player.flowers.map((tile) => ({ ...tile })),
      discardRiver: player.discardRiver.map((tile) => ({ ...tile })),
    })),
    wall: state.wall.map((tile) => ({ ...tile })),
    deadWall: state.deadWall.map((tile) => ({ ...tile })),
    ruleProfile: { ...state.ruleProfile },
    roundResult: state.roundResult
      ? {
          ...state.roundResult,
          payments: state.roundResult.payments.map((payment) => ({ ...payment })),
        }
      : null,
    claimWindow: state.claimWindow
      ? {
          ...state.claimWindow,
          discard: { ...state.claimWindow.discard },
          responses: { ...state.claimWindow.responses },
          eligiblePlayerIds: [...state.claimWindow.eligiblePlayerIds],
        }
      : null,
    log: state.log.map((entry) => ({ ...entry })),
  }
}

function nextDealerAfterRound(state: MahjongState): number {
  if (state.roundResult?.kind === 'win' && state.roundResult.winnerId) {
    const winnerIndex = state.players.findIndex((player) => player.id === state.roundResult?.winnerId)
    if (winnerIndex === state.dealerIndex && state.ruleProfile.dealerRepeatsAfterWin) return state.dealerIndex
  }
  if (state.roundResult?.kind === 'draw' && !state.ruleProfile.rotateDealerOnDraw) return state.dealerIndex
  return nextPlayerIndex(state, state.dealerIndex)
}

function nextPrevailingWindAfterRound(state: MahjongState, nextDealerIndex: number): MahjongState['prevailingWind'] {
  if (nextDealerIndex === 0 && state.dealerIndex === state.players.length - 1) {
    return nextWind(state.prevailingWind)
  }
  return state.prevailingWind
}

function nextWind(wind: MahjongState['prevailingWind']): MahjongState['prevailingWind'] {
  const order: MahjongState['prevailingWind'][] = ['east', 'south', 'west', 'north']
  return order[(order.indexOf(wind) + 1) % order.length] ?? 'east'
}

function removeTileById(tiles: MahjongTile[], tileId: string): MahjongTile | null {
  const index = tiles.findIndex((tile) => tile.id === tileId)
  if (index < 0) return null
  const [tile] = tiles.splice(index, 1)
  return tile ?? null
}

function isNextPlayerAfterDiscarder(state: MahjongState, playerId: string): boolean {
  const window = state.claimWindow
  if (!window) return false
  const discarderIndex = state.players.findIndex((player) => player.id === window.discarderId)
  return state.players[nextPlayerIndex(state, discarderIndex)]?.id === playerId
}

function nextPlayerIndex(state: MahjongState, fromIndex: number): number {
  return (fromIndex + 1 + state.players.length) % state.players.length
}

function chowTileIdOptions(concealed: MahjongTile[], discard: MahjongTile): string[][] {
  if (discard.category !== 'suit') return []
  const options: string[][] = []
  for (const ranks of [
    [discard.rank - 2, discard.rank - 1],
    [discard.rank - 1, discard.rank + 1],
    [discard.rank + 1, discard.rank + 2],
  ]) {
    if (ranks.some((rank) => rank < 1 || rank > 9)) continue
    const tiles = ranks.map((rank) => concealed.find((tile) => tile.category === 'suit' && tile.suit === discard.suit && tile.rank === rank))
    if (tiles.every(Boolean)) options.push(tiles.map((tile) => tile?.id ?? ''))
  }
  return options
}

function tileIdsMatch(expected: string[], actual: string[]): boolean {
  if (expected.length === 0) return actual.length === 0
  if (expected.length !== actual.length) return false
  const actualSet = new Set(actual)
  return expected.every((id) => actualSet.has(id))
}

function removeDiscardFromRiver(state: MahjongState, playerId: string, tileId: string): void {
  const player = state.players.find((candidate) => candidate.id === playerId)
  if (!player) return
  const index = player.discardRiver.findIndex((tile) => tile.id === tileId)
  if (index >= 0) player.discardRiver.splice(index, 1)
}
